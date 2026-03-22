"""
Management command to populate the database with test data.

Usage: python manage.py seed_data
"""

import random
from datetime import date, timedelta
from typing import Any, cast

from django.contrib.auth.models import User  # type: ignore
from django.core.management.base import BaseCommand  # type: ignore

from evaluations.models import (  # type: ignore
    AsignaturaGrupo,
    CampanaEvaluacion,
    Encuesta,
    EncuestaPregunta,
    MiembroClase,
    Pregunta,
    Profesor,
    RegistroVoto,
    Respuesta,
    UserProfile,
)

# Pyright no infiere el manager .objects en modelos Django
_UserProfile = cast(Any, UserProfile)
_Profesor = cast(Any, Profesor)
_AsignaturaGrupo = cast(Any, AsignaturaGrupo)
_MiembroClase = cast(Any, MiembroClase)
_Encuesta = cast(Any, Encuesta)
_EncuestaPregunta = cast(Any, EncuestaPregunta)
_Pregunta = cast(Any, Pregunta)
_CampanaEvaluacion = cast(Any, CampanaEvaluacion)
_RegistroVoto = cast(Any, RegistroVoto)
_Respuesta = cast(Any, Respuesta)


class Command(BaseCommand):
    help = 'Seed the database with test data for DocenTrack'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force-passwords',
            action='store_true',
            help=(
                'Restablece las contraseñas demo (admin123, profesor123, alumno123) '
                'para usuarios ya existentes. Útil en producción si olvidaste la clave '
                'o tras migraciones; no borra datos.'
            ),
        )

    def _force_demo_passwords(self) -> None:
        """Restablece solo contraseñas y perfiles demo; no duplica encuestas ni respuestas."""
        self.stdout.write('Restableciendo contraseñas demo…')

        admin_user, _ = User.objects.get_or_create(
            username='admin',
            defaults={
                'first_name': 'Admin',
                'last_name': 'DocenTrack',
                'email': 'admin@docentrack.es',
                'is_staff': True,
                'is_superuser': True,
            },
        )
        admin_user.set_password('admin123')
        admin_user.save()
        _UserProfile.objects.get_or_create(user=admin_user, defaults={'role': 'ADMIN'})

        for uname in ('profesor1', 'profesor2'):
            u, _ = User.objects.get_or_create(
                username=uname,
                defaults={
                    'email': f'{uname}@docentrack.es',
                },
            )
            u.set_password('profesor123')
            u.save()
            _UserProfile.objects.get_or_create(user=u, defaults={'role': 'PROFESOR'})

        for i in range(1, 11):
            uname = f'alumno{i}'
            u, _ = User.objects.get_or_create(
                username=uname,
                defaults={
                    'first_name': 'Alumno',
                    'last_name': f'Prueba {i}',
                    'email': f'{uname}@docentrack.es',
                },
            )
            u.set_password('alumno123')
            u.save()
            _UserProfile.objects.get_or_create(user=u, defaults={'role': 'ALUMNO'})

        style: Any = self.style
        self.stdout.write(style.SUCCESS(
            'Contraseñas demo actualizadas: admin/admin123, profesor*/profesor123, alumno*/alumno123'
        ))

    def handle(self, *args, **options):
        if options['force_passwords']:
            self._force_demo_passwords()
            return

        self.stdout.write('Seeding database...')

        # ── Admin ──────────────────────────────────
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'first_name': 'Admin',
                'last_name': 'DocenTrack',
                'email': 'admin@docentrack.es',
                'is_staff': True,
                'is_superuser': True,
            },
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
        _UserProfile.objects.get_or_create(user=admin_user, defaults={'role': 'ADMIN'})

        # ── Profesores ─────────────────────────────
        profesores_data = [
            {'username': 'profesor1', 'nombre': 'María', 'apellidos': 'García López', 'departamento': 'Informática'},
            {'username': 'profesor2', 'nombre': 'Carlos', 'apellidos': 'Martínez Ruiz', 'departamento': 'Matemáticas'},
        ]
        profesores = []
        for pd in profesores_data:
            user, created = User.objects.get_or_create(
                username=pd['username'],
                defaults={
                    'first_name': pd['nombre'],
                    'last_name': pd['apellidos'],
                    'email': f"{pd['username']}@docentrack.es",
                },
            )
            if created:
                user.set_password('profesor123')
                user.save()
            _UserProfile.objects.get_or_create(user=user, defaults={'role': 'PROFESOR'})
            prof, _ = _Profesor.objects.get_or_create(
                user=user,
                defaults={
                    'nombre': pd['nombre'],
                    'apellidos': pd['apellidos'],
                    'departamento': pd['departamento'],
                },
            )
            profesores.append(prof)

        # ── Asignaturas ────────────────────────────
        asignaturas_data = [
            {'nombre': 'Desarrollo Web en Entorno Cliente', 'curso': '2º DAW', 'grupo': 'A', 'profesor': profesores[0]},
            {'nombre': 'Desarrollo Web en Entorno Servidor', 'curso': '2º DAW', 'grupo': 'A', 'profesor': profesores[0]},
            {'nombre': 'Diseño de Interfaces Web', 'curso': '2º DAW', 'grupo': 'B', 'profesor': profesores[0]},
            {'nombre': 'Bases de Datos', 'curso': '1º DAW', 'grupo': 'A', 'profesor': profesores[1]},
            {'nombre': 'Programación', 'curso': '1º DAW', 'grupo': 'A', 'profesor': profesores[1]},
        ]
        asignaturas = []
        for ad in asignaturas_data:
            asig, _ = _AsignaturaGrupo.objects.get_or_create(
                nombre=ad['nombre'],
                curso=ad['curso'],
                grupo=ad['grupo'],
                defaults={'profesor': ad['profesor']},
            )
            asignaturas.append(asig)

        # ── Alumnos ────────────────────────────────
        alumnos: list[User] = []
        for i in range(1, 11):
            user, created = User.objects.get_or_create(
                username=f'alumno{i}',
                defaults={
                    'first_name': 'Alumno',
                    'last_name': f'Prueba {i}',
                    'email': f'alumno{i}@docentrack.es',
                },
            )
            if created:
                user.set_password('alumno123')
                user.save()
            _UserProfile.objects.get_or_create(user=user, defaults={'role': 'ALUMNO'})
            alumnos.append(user)

        today = date.today()

        # ── Matrícula en clase (nuevo flujo API) ──
        for alumno_user in alumnos[:5]:
            _MiembroClase.objects.get_or_create(
                user=alumno_user,
                asignatura_grupo=asignaturas[0],
            )

        # ── Encuesta de clase con preguntas propias ──
        enc_clase, _ = _Encuesta.objects.get_or_create(
            asignatura_grupo=asignaturas[0],
            nombre='Encuesta de satisfacción (clase)',
            defaults={
                'profesor': asignaturas[0].profesor,
                'fecha_inicio': today - timedelta(days=3),
                'fecha_fin': today + timedelta(days=14),
                'activa': True,
            },
        )
        items_enc = [
            '¿El contenido de la asignatura es claro?',
            '¿El ritmo de la clase es adecuado?',
        ]
        for idx, texto in enumerate(items_enc, 1):
            _EncuestaPregunta.objects.get_or_create(
                encuesta=enc_clase,
                orden=idx,
                defaults={'texto': texto},
            )

        # ── Preguntas ─────────────────────────────
        preguntas_textos = [
            'El/la profesor/a explica con claridad los contenidos.',
            'El/la profesor/a fomenta la participación del alumnado.',
            'Los materiales proporcionados son útiles para el aprendizaje.',
            'La metodología utilizada facilita la comprensión de la materia.',
            'El/la profesor/a muestra interés por el progreso del alumnado.',
            'Las evaluaciones son coherentes con lo enseñado en clase.',
            'El/la profesor/a resuelve dudas de forma eficaz.',
            'El/la profesor/a crea un ambiente de respeto en el aula.',
        ]
        preguntas: list[Pregunta] = []
        for idx, texto in enumerate(preguntas_textos, 1):
            preg, _ = _Pregunta.objects.get_or_create(
                orden=idx,
                defaults={'texto': texto},
            )
            preguntas.append(preg)

        # ── Campañas ──────────────────────────────
        campanas_data = [
            {
                'nombre': 'Evaluación 1er Trimestre 2024-2025',
                'fecha_inicio': date(2024, 12, 1),
                'fecha_fin': date(2024, 12, 20),
                'activa': False,
            },
            {
                'nombre': 'Evaluación 2º Trimestre 2024-2025',
                'fecha_inicio': date(2025, 3, 1),
                'fecha_fin': date(2025, 3, 20),
                'activa': False,
            },
            {
                'nombre': 'Evaluación 3er Trimestre 2024-2025',
                'fecha_inicio': today - timedelta(days=5),
                'fecha_fin': today + timedelta(days=10),
                'activa': True,
            },
        ]
        campanas: list[CampanaEvaluacion] = []
        for cd in campanas_data:
            camp, _ = _CampanaEvaluacion.objects.get_or_create(
                nombre=cd['nombre'],
                defaults={
                    'fecha_inicio': cd['fecha_inicio'],
                    'fecha_fin': cd['fecha_fin'],
                    'activa': cd['activa'],
                },
            )
            campanas.append(camp)

        # ── Generate responses for past campaigns ──
        for campana in campanas[:2]:  # type: ignore
            for asig in asignaturas:
                for alumno in alumnos[:7]:  # type: ignore
                    # Check if already voted
                    if _RegistroVoto.objects.filter(
                        user=alumno, campana=campana, asignatura_grupo=asig
                    ).exists():
                        continue

                    for pregunta in preguntas:
                        _Respuesta.objects.create(
                            asignatura_grupo=asig,
                            campana=campana,
                            pregunta=pregunta,
                            valor=random.randint(3, 5),
                        )
                    _RegistroVoto.objects.create(
                        user=alumno,
                        campana=campana,
                        asignatura_grupo=asig,
                    )

        style: Any = self.style
        self.stdout.write(style.SUCCESS(
            f'✓ Seed complete!\n'
            f'  Admin: admin / admin123\n'
            f'  Profesores: profesor1, profesor2 / profesor123\n'
            f'  Alumnos: alumno1..alumno10 / alumno123\n'
            f'  Campañas: {len(campanas)} (1 activa)\n'
            f'  Preguntas globales: {len(preguntas)}\n'
            f'  Asignaturas: {len(asignaturas)} (código invitación en API para profesor)\n'
            f'  Encuesta de clase ejemplo: {enc_clase.nombre!r} en {asignaturas[0]}'
        ))
