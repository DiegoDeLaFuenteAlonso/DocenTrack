"""
Management command to populate the database with test data.

Usage: python manage.py seed_data
"""

import random
from datetime import date, timedelta

from django.contrib.auth.models import User  # type: ignore
from django.core.management.base import BaseCommand  # type: ignore

from evaluations.models import (  # type: ignore
    AsignaturaGrupo,
    CampanaEvaluacion,
    Pregunta,
    Profesor,
    RegistroVoto,
    Respuesta,
    UserProfile,
)


class Command(BaseCommand):
    help = 'Seed the database with test data for DocenTrack'

    def handle(self, *args, **options):
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
        UserProfile.objects.get_or_create(user=admin_user, defaults={'role': 'ADMIN'})

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
            UserProfile.objects.get_or_create(user=user, defaults={'role': 'PROFESOR'})
            prof, _ = Profesor.objects.get_or_create(
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
            asig, _ = AsignaturaGrupo.objects.get_or_create(
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
            UserProfile.objects.get_or_create(user=user, defaults={'role': 'ALUMNO'})
            alumnos.append(user)

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
            preg, _ = Pregunta.objects.get_or_create(
                orden=idx,
                defaults={'texto': texto},
            )
            preguntas.append(preg)

        # ── Campañas ──────────────────────────────
        today = date.today()
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
            camp, _ = CampanaEvaluacion.objects.get_or_create(
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
                    if RegistroVoto.objects.filter(
                        user=alumno, campana=campana, asignatura_grupo=asig
                    ).exists():
                        continue

                    for pregunta in preguntas:
                        Respuesta.objects.create(
                            asignatura_grupo=asig,
                            campana=campana,
                            pregunta=pregunta,
                            valor=random.randint(3, 5),
                        )
                    RegistroVoto.objects.create(
                        user=alumno,
                        campana=campana,
                        asignatura_grupo=asig,
                    )

        self.stdout.write(self.style.SUCCESS(
            f'✓ Seed complete!\n'
            f'  Admin: admin / admin123\n'
            f'  Profesores: profesor1, profesor2 / profesor123\n'
            f'  Alumnos: alumno1..alumno10 / alumno123\n'
            f'  Campañas: {len(campanas)} (1 activa)\n'
            f'  Preguntas: {len(preguntas)}\n'
            f'  Asignaturas: {len(asignaturas)}'
        ))
