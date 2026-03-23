from datetime import date, timedelta
from typing import Any, cast

from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken

from evaluations.models import (
    AsignaturaGrupo,
    Encuesta,
    EncuestaPregunta,
    MiembroClase,
    ParticipacionEncuesta,
    Profesor,
    RespuestaEncuesta,
    UserProfile,
)


class EncuestaEstadosRulesTests(TestCase):
    """Test de reglas de estado de encuestas (ACTIVA, INACTIVA, FINALIZADA)."""

    def setUp(self) -> None:
        self.client = APIClient()
        self.client.enforce_csrf_checks = False

        self.profesor_user = User.objects.create_user(username='profesor', password='x')
        UserProfile.objects.create(user=self.profesor_user, role='PROFESOR')
        self.profesor = Profesor.objects.create(
            user=self.profesor_user,
            nombre='Ada',
            apellidos='Lovelace',
            departamento='Informatica',
        )

        self.alumno_1 = User.objects.create_user(username='alumno1', password='x')
        UserProfile.objects.create(user=self.alumno_1, role='ALUMNO')
        self.alumno_2 = User.objects.create_user(username='alumno2', password='x')
        UserProfile.objects.create(user=self.alumno_2, role='ALUMNO')

        self.clase = AsignaturaGrupo.objects.create(
            nombre='Programacion',
            curso='2DAW',
            grupo='A',
            profesor=self.profesor,
        )
        MiembroClase.objects.create(user=self.alumno_1, asignatura_grupo=self.clase)
        MiembroClase.objects.create(user=self.alumno_2, asignatura_grupo=self.clase)

    def _crear_encuesta(
        self,
        *,
        nombre: str,
        activa: bool,
        finalizada: bool,
        fecha_inicio: date,
        fecha_fin: date,
    ) -> tuple[Encuesta, EncuestaPregunta]:
        encuesta = Encuesta.objects.create(
            asignatura_grupo=self.clase,
            profesor=self.profesor,
            nombre=nombre,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            activa=activa,
            finalizada=finalizada,
            eliminada=False,
        )
        pregunta = EncuestaPregunta.objects.create(
            encuesta=encuesta,
            texto='La clase fue clara',
            orden=1,
        )
        return encuesta, pregunta

    @staticmethod
    def _get_token(user: User) -> str:
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)

    def test_01_inactiva_no_finaliza_por_tiempo_y_no_muestra_resumen_final(self) -> None:
        """Caso 1: Inactiva no finaliza por tiempo, no muestra métricas."""
        ayer = date.today() - timedelta(days=1)
        encuesta, _ = self._crear_encuesta(
            nombre='Inactiva fuera de plazo',
            activa=False,
            finalizada=False,
            fecha_inicio=ayer - timedelta(days=5),
            fecha_fin=ayer,
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self._get_token(self.profesor_user)}')
        response = self.client.get(f'/api/encuestas-clase/{encuesta.id}/resumen/')

        self.assertEqual(response.status_code, 200)
        data = cast(dict[str, Any], response.json())
        self.assertFalse(data['disponible'], 'Resumen debe estar no disponible')
        self.assertFalse(data['finalizada'], 'Inactiva no debe marcarse como finalizada')
        self.assertEqual(data['media_global'], None, 'No debe haber media global')
        self.assertEqual(data['por_pregunta'], [], 'No debe haber estadísticas por pregunta')
        self.assertIn('inactiva', str(data['detail']).lower(), 'Debe mencionar que está inactiva')

        encuesta.refresh_from_db()
        self.assertFalse(encuesta.activa, 'Sigue inactiva')
        self.assertFalse(encuesta.finalizada, 'No finaliza por tiempo si está inactiva')

    def test_02_finalizada_muestra_resumen_final(self) -> None:
        """Caso 2: Finalizada sí muestra resumen final con métricas."""
        hoy = date.today()
        encuesta, pregunta = self._crear_encuesta(
            nombre='Finalizada con datos',
            activa=False,
            finalizada=True,
            fecha_inicio=hoy - timedelta(days=7),
            fecha_fin=hoy - timedelta(days=1),
        )
        ParticipacionEncuesta.objects.create(user=self.alumno_1, encuesta=encuesta)
        RespuestaEncuesta.objects.create(encuesta=encuesta, pregunta=pregunta, valor=4)

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self._get_token(self.profesor_user)}')
        response = self.client.get(f'/api/encuestas-clase/{encuesta.id}/resumen/')

        self.assertEqual(response.status_code, 200)
        data = cast(dict[str, Any], response.json())
        self.assertTrue(data['disponible'], 'Resumen debe estar disponible')
        self.assertTrue(data['finalizada'], 'Debe marcarse como finalizada')
        self.assertEqual(data['n_participantes'], 1, 'Debe contar participantes')
        self.assertEqual(data['media_global'], 4.0, 'Debe mostrar media global correcta')
        self.assertEqual(len(data['por_pregunta']), 1, 'Debe mostrar media por pregunta')

    def test_03_alumno_no_ve_inactivas_ve_activas_finalizadas(self) -> None:
        """Caso 3: Alumno no ve inactivas, sí ve activas y finalizadas."""
        hoy = date.today()
        activa, _ = self._crear_encuesta(
            nombre='Activa visible',
            activa=True,
            finalizada=False,
            fecha_inicio=hoy - timedelta(days=1),
            fecha_fin=hoy + timedelta(days=5),
        )
        finalizada, _ = self._crear_encuesta(
            nombre='Finalizada visible',
            activa=False,
            finalizada=True,
            fecha_inicio=hoy - timedelta(days=10),
            fecha_fin=hoy - timedelta(days=1),
        )
        inactiva, _ = self._crear_encuesta(
            nombre='Inactiva oculta',
            activa=False,
            finalizada=False,
            fecha_inicio=hoy - timedelta(days=2),
            fecha_fin=hoy + timedelta(days=2),
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self._get_token(self.alumno_1)}')
        response = self.client.get('/api/encuestas-clase/')

        self.assertEqual(response.status_code, 200)
        data = cast(list[dict[str, Any]], response.json())
        ids = {item['id'] for item in data}
        self.assertIn(activa.id, ids, 'Alumno debe ver encuestas activas')
        self.assertIn(finalizada.id, ids, 'Alumno debe ver encuestas finalizadas')
        self.assertNotIn(inactiva.id, ids, 'Alumno no debe ver encuestas inactivas')

    def test_04_no_se_puede_cambiar_activa_en_finalizada_patch(self) -> None:
        """Caso 4: No se puede activar/desactivar manualmente una encuesta finalizada."""
        hoy = date.today()
        encuesta, _ = self._crear_encuesta(
            nombre='Finalizada bloqueada',
            activa=False,
            finalizada=True,
            fecha_inicio=hoy - timedelta(days=5),
            fecha_fin=hoy - timedelta(days=1),
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self._get_token(self.profesor_user)}')
        response = self.client.patch(
            f'/api/encuestas-clase/{encuesta.id}/',
            {'activa': True},
            format='json',
        )

        self.assertEqual(response.status_code, 400, 'Debe rechazar la actualización')
        data = cast(dict[str, Any], response.json())
        self.assertIn('activa', data, 'Error debe mencionar el campo activa')

        encuesta.refresh_from_db()
        self.assertFalse(encuesta.activa, 'Sigue sin cambios')
        self.assertTrue(encuesta.finalizada, 'Finalizada sin cambios')

    def test_05_bulk_activate_excluye_finalizadas(self) -> None:
        """Caso 5: Acciones masivas no tocan encuestas finalizadas."""
        hoy = date.today()
        enc_finalizada, _ = self._crear_encuesta(
            nombre='Finalizada para bulk',
            activa=False,
            finalizada=True,
            fecha_inicio=hoy - timedelta(days=6),
            fecha_fin=hoy - timedelta(days=2),
        )
        enc_inactiva, _ = self._crear_encuesta(
            nombre='Inactiva para bulk',
            activa=False,
            finalizada=False,
            fecha_inicio=hoy - timedelta(days=1),
            fecha_fin=hoy + timedelta(days=3),
        )

        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self._get_token(self.profesor_user)}')
        response = self.client.post(
            '/api/encuestas-clase/bulk-action/',
            {
                'encuesta_ids': [enc_finalizada.id, enc_inactiva.id],
                'action': 'activate',
            },
            format='json',
        )

        self.assertEqual(response.status_code, 200)
        data = cast(dict[str, Any], response.json())
        self.assertEqual(data['updated'], 1, 'Solo debe actualizar la inactiva')
        self.assertEqual(data['skipped_finalizadas'], 1, 'Debe reportar 1 finalizada omitida')
        self.assertIn(enc_finalizada.id, data['skipped_finalizadas_ids'], 'ID de finalizada omitida')

        enc_finalizada.refresh_from_db()
        enc_inactiva.refresh_from_db()
        self.assertFalse(enc_finalizada.activa, 'Finalizada no cambia')
        self.assertTrue(enc_finalizada.finalizada, 'Finalizada sin cambios')
        self.assertTrue(enc_inactiva.activa, 'Inactiva se activa')
