from django.apps import AppConfig


class EvaluationsConfig(AppConfig):
    # Django permite sobrescribir esta cached_property con atributo de clase.
    default_auto_field = 'django.db.models.BigAutoField'  # pyright: ignore[reportAssignmentType]
    name = 'evaluations'
    verbose_name = 'Evaluaciones Docentes'
