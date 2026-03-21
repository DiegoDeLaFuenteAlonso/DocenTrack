from typing import List
from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    """Extends the built-in User with a role field."""

    ROLE_CHOICES: List[tuple[str, str]] = [
        ('ADMIN', 'Administrador'),
        ('PROFESOR', 'Profesor'),
        ('ALUMNO', 'Alumno'),
    ]

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profile',
    )
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='ALUMNO')

    class Meta:
        verbose_name = 'Perfil de usuario'
        verbose_name_plural = 'Perfiles de usuario'

    def __str__(self) -> str:
        return f'{self.user.username} ({self.get_role_display()})'


class Profesor(models.Model):
    """Teacher profile linked 1-1 with a User."""

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='profesor',
    )
    nombre = models.CharField(max_length=100)
    apellidos = models.CharField(max_length=200)
    departamento = models.CharField(max_length=200, blank=True, default='')

    class Meta:
        verbose_name = 'Profesor'
        verbose_name_plural = 'Profesores'

    def __str__(self) -> str:
        return f'{self.nombre} {self.apellidos}'


class AsignaturaGrupo(models.Model):
    """Subject-group combination assigned to a teacher."""

    nombre = models.CharField(max_length=200, verbose_name='Asignatura')
    curso = models.CharField(max_length=50)
    grupo = models.CharField(max_length=20)
    profesor = models.ForeignKey(
        Profesor,
        on_delete=models.CASCADE,
        related_name='asignaturas',
    )

    class Meta:
        verbose_name = 'Asignatura / Grupo'
        verbose_name_plural = 'Asignaturas / Grupos'

    def __str__(self) -> str:
        return f'{self.nombre} – {self.curso} {self.grupo}'


class CampanaEvaluacion(models.Model):
    """Evaluation campaign (time-bounded)."""

    nombre = models.CharField(max_length=200)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    activa = models.BooleanField(default=False)

    class Meta:
        verbose_name = 'Campaña de evaluación'
        verbose_name_plural = 'Campañas de evaluación'
        ordering = ['fecha_inicio']

    def __str__(self) -> str:
        return self.nombre


class Pregunta(models.Model):
    """Question in a survey (shared across campaigns)."""

    texto = models.TextField(verbose_name='Texto de la pregunta')
    orden = models.PositiveIntegerField(default=0)

    class Meta:
        verbose_name = 'Pregunta'
        verbose_name_plural = 'Preguntas'
        ordering = ['orden']

    def __str__(self) -> str:
        return f'P{self.orden}: {self.texto[:60]}'


class Respuesta(models.Model):
    """
    Anonymous answer to a question.
    No FK to User → anonymity guaranteed.
    """

    asignatura_grupo = models.ForeignKey(
        AsignaturaGrupo,
        on_delete=models.CASCADE,
        related_name='respuestas',
    )
    campana = models.ForeignKey(
        CampanaEvaluacion,
        on_delete=models.CASCADE,
        related_name='respuestas',
    )
    pregunta = models.ForeignKey(
        Pregunta,
        on_delete=models.CASCADE,
        related_name='respuestas',
    )
    valor = models.PositiveSmallIntegerField(
        help_text='Puntuación de 1 a 5',
    )

    class Meta:
        verbose_name = 'Respuesta'
        verbose_name_plural = 'Respuestas'

    def __str__(self) -> str:
        return f'{self.asignatura_grupo} | {self.pregunta} → {self.valor}'


class RegistroVoto(models.Model):
    """
    Tracks that a student has already voted for a given
    subject-group in a given campaign. No link to Respuesta
    to preserve anonymity.
    """

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='votos',
    )
    campana = models.ForeignKey(
        CampanaEvaluacion,
        on_delete=models.CASCADE,
        related_name='votos',
    )
    asignatura_grupo = models.ForeignKey(
        AsignaturaGrupo,
        on_delete=models.CASCADE,
        related_name='votos',
    )

    class Meta:
        verbose_name = 'Registro de voto'
        verbose_name_plural = 'Registros de voto'
        unique_together = ('user', 'campana', 'asignatura_grupo')

    def __str__(self) -> str:
        return f'{self.user.username} → {self.asignatura_grupo} ({self.campana})'
