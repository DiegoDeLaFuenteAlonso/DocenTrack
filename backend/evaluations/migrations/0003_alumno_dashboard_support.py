from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import django.utils.timezone


class Migration(migrations.Migration):
    dependencies = [
        ("evaluations", "0002_clase_encuestas_miembros"),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.AddField(
            model_name="encuesta",
            name="created_at",
            field=models.DateTimeField(
                auto_now_add=True,
                default=django.utils.timezone.now,
            ),
            preserve_default=False,
        ),
        migrations.CreateModel(
            name="ClaseVisitaAlumno",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                ("last_visited_at", models.DateTimeField(auto_now=True)),
                ("veces", models.PositiveIntegerField(default=1)),
                (
                    "asignatura_grupo",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="visitas_alumno",
                        to="evaluations.asignaturagrupo",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="visitas_clase",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Visita de clase",
                "verbose_name_plural": "Visitas de clase",
                "constraints": [
                    models.UniqueConstraint(
                        fields=("user", "asignatura_grupo"),
                        name="unique_visita_clase_alumno",
                    )
                ],
            },
        ),
        migrations.CreateModel(
            name="ProgresoEncuestaAlumno",
            fields=[
                ("id", models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name="ID")),
                (
                    "estado",
                    models.CharField(
                        choices=[
                            ("PENDIENTE", "Pendiente"),
                            ("EN_CURSO", "En curso"),
                            ("ENVIADA", "Enviada"),
                        ],
                        default="PENDIENTE",
                        max_length=12,
                    ),
                ),
                ("respuestas_borrador", models.JSONField(blank=True, default=dict)),
                ("respondidas_count", models.PositiveIntegerField(default=0)),
                ("started_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                (
                    "encuesta",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="progresos_alumno",
                        to="evaluations.encuesta",
                    ),
                ),
                (
                    "user",
                    models.ForeignKey(
                        on_delete=django.db.models.deletion.CASCADE,
                        related_name="progresos_encuesta",
                        to=settings.AUTH_USER_MODEL,
                    ),
                ),
            ],
            options={
                "verbose_name": "Progreso de encuesta",
                "verbose_name_plural": "Progresos de encuesta",
                "constraints": [
                    models.UniqueConstraint(
                        fields=("user", "encuesta"),
                        name="unique_progreso_encuesta_alumno",
                    )
                ],
            },
        ),
    ]
