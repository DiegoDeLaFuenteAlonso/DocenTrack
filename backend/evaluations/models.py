import secrets
from typing import Any, List, cast

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
        user = cast(Any, self.user)
        role_label = cast(Any, self).get_role_display()
        return f'{user.username} ({role_label})'


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
    codigo_invitacion = models.CharField(
        max_length=16,
        unique=True,
        blank=True,
        null=True,
        db_index=True,
        help_text='Código para que los alumnos se unan a la clase (se genera al guardar).',
    )

    class Meta:
        verbose_name = 'Asignatura / Grupo'
        verbose_name_plural = 'Asignaturas / Grupos'

    def __str__(self) -> str:
        return f'{self.nombre} – {self.curso} {self.grupo}'

    def _generar_codigo_invitacion(self) -> str:
        model_cls = cast(Any, AsignaturaGrupo)
        while True:
            raw = secrets.token_urlsafe(9).replace('-', 'x')[:12]
            if not model_cls.objects.filter(codigo_invitacion=raw).exclude(pk=self.pk).exists():
                return raw

    def save(self, *args, **kwargs) -> None:
        if not self.codigo_invitacion:
            self.codigo_invitacion = self._generar_codigo_invitacion()
        super().save(*args, **kwargs)

    def regenerar_codigo_invitacion(self) -> str:
        self.codigo_invitacion = self._generar_codigo_invitacion()
        self.save(update_fields=['codigo_invitacion'])
        return self.codigo_invitacion


class MiembroClase(models.Model):
    """Alumno matriculado en una clase (asignatura/grupo)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='clases_inscritas',
    )
    asignatura_grupo = models.ForeignKey(
        AsignaturaGrupo,
        on_delete=models.CASCADE,
        related_name='miembros',
    )
    fecha_inscripcion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Miembro de clase'
        verbose_name_plural = 'Miembros de clase'
        constraints = [
            models.UniqueConstraint(
                fields=('user', 'asignatura_grupo'),
                name='unique_miembro_por_clase',
            ),
        ]

    def __str__(self) -> str:
        user = cast(Any, self.user)
        return f'{user.username} → {self.asignatura_grupo}'


class Encuesta(models.Model):
    """Encuesta de evaluación creada por el profesor dentro de una clase."""

    asignatura_grupo = models.ForeignKey(
        AsignaturaGrupo,
        on_delete=models.CASCADE,
        related_name='encuestas_clase',
    )
    profesor = models.ForeignKey(
        Profesor,
        on_delete=models.CASCADE,
        related_name='encuestas_creadas',
    )
    nombre = models.CharField(max_length=200)
    created_at = models.DateTimeField(auto_now_add=True)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    activa = models.BooleanField(default=True)  # pyright: ignore[reportArgumentType]

    class Meta:
        verbose_name = 'Encuesta de clase'
        verbose_name_plural = 'Encuestas de clase'
        ordering = ['-fecha_inicio', 'id']

    def __str__(self) -> str:
        return f'{self.nombre} ({self.asignatura_grupo})'


class EncuestaPregunta(models.Model):
    """Pregunta perteneciente a una encuesta de clase."""

    encuesta = models.ForeignKey(
        Encuesta,
        on_delete=models.CASCADE,
        related_name='items',
    )
    texto = models.TextField(verbose_name='Texto de la pregunta')
    orden = models.PositiveIntegerField(default=0)  # pyright: ignore[reportArgumentType]

    class Meta:
        verbose_name = 'Pregunta de encuesta'
        verbose_name_plural = 'Preguntas de encuesta'
        ordering = ['orden', 'id']

    def __str__(self) -> str:
        pregunta = cast(Any, self)
        return f'{pregunta.encuesta_id}: P{self.orden}'


class RespuestaEncuesta(models.Model):
    """Respuesta anónima a un ítem de encuesta de clase (sin FK a usuario)."""

    encuesta = models.ForeignKey(
        Encuesta,
        on_delete=models.CASCADE,
        related_name='respuestas_items',
    )
    pregunta = models.ForeignKey(
        EncuestaPregunta,
        on_delete=models.CASCADE,
        related_name='respuestas',
    )
    valor = models.PositiveSmallIntegerField(help_text='Puntuación de 1 a 5')

    class Meta:
        verbose_name = 'Respuesta (encuesta de clase)'
        verbose_name_plural = 'Respuestas (encuestas de clase)'

    def __str__(self) -> str:
        respuesta = cast(Any, self)
        return f'{respuesta.encuesta_id} | P{respuesta.pregunta_id} → {self.valor}'


class ParticipacionEncuesta(models.Model):
    """Indica que el usuario ya envió la encuesta (evita doble envío)."""

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='participaciones_encuesta',
    )
    encuesta = models.ForeignKey(
        Encuesta,
        on_delete=models.CASCADE,
        related_name='participaciones',
    )
    fecha = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = 'Participación en encuesta'
        verbose_name_plural = 'Participaciones en encuestas'
        constraints = [
            models.UniqueConstraint(
                fields=('user', 'encuesta'),
                name='unique_participacion_encuesta',
            ),
        ]

    def __str__(self) -> str:
        user = cast(Any, self.user)
        return f'{user.username} → {self.encuesta}'


class ProgresoEncuestaAlumno(models.Model):
    ESTADO_PENDIENTE = 'PENDIENTE'
    ESTADO_EN_CURSO = 'EN_CURSO'
    ESTADO_ENVIADA = 'ENVIADA'
    ESTADO_CHOICES: List[tuple[str, str]] = [
        (ESTADO_PENDIENTE, 'Pendiente'),
        (ESTADO_EN_CURSO, 'En curso'),
        (ESTADO_ENVIADA, 'Enviada'),
    ]

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='progresos_encuesta',
    )
    encuesta = models.ForeignKey(
        Encuesta,
        on_delete=models.CASCADE,
        related_name='progresos_alumno',
    )
    estado = models.CharField(
        max_length=12,
        choices=ESTADO_CHOICES,
        default=ESTADO_PENDIENTE,
    )
    respuestas_borrador = models.JSONField(default=dict, blank=True)
    respondidas_count = models.PositiveIntegerField(default=0)  # pyright: ignore[reportArgumentType]
    started_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Progreso de encuesta'
        verbose_name_plural = 'Progresos de encuesta'
        constraints = [
            models.UniqueConstraint(
                fields=('user', 'encuesta'),
                name='unique_progreso_encuesta_alumno',
            )
        ]

    def __str__(self) -> str:
        user = cast(Any, self.user)
        return f'{user.username} → {self.encuesta_id} ({self.estado})'


class ClaseVisitaAlumno(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='visitas_clase',
    )
    asignatura_grupo = models.ForeignKey(
        AsignaturaGrupo,
        on_delete=models.CASCADE,
        related_name='visitas_alumno',
    )
    last_visited_at = models.DateTimeField(auto_now=True)
    veces = models.PositiveIntegerField(default=1)  # pyright: ignore[reportArgumentType]

    class Meta:
        verbose_name = 'Visita de clase'
        verbose_name_plural = 'Visitas de clase'
        constraints = [
            models.UniqueConstraint(
                fields=('user', 'asignatura_grupo'),
                name='unique_visita_clase_alumno',
            )
        ]

    def __str__(self) -> str:
        visita = cast(Any, self)
        return f'{visita.user_id} -> {visita.asignatura_grupo_id} ({visita.veces})'


class CampanaEvaluacion(models.Model):
    """Evaluation campaign (time-bounded)."""

    nombre = models.CharField(max_length=200)
    fecha_inicio = models.DateField()
    fecha_fin = models.DateField()
    activa = models.BooleanField(default=False)  # pyright: ignore[reportArgumentType]

    class Meta:
        verbose_name = 'Campaña de evaluación'
        verbose_name_plural = 'Campañas de evaluación'
        ordering = ['fecha_inicio']

    def __str__(self) -> str:
        return cast(str, self.nombre)


class Pregunta(models.Model):
    """Question in a survey (shared across campaigns)."""

    texto = models.TextField(verbose_name='Texto de la pregunta')
    orden = models.PositiveIntegerField(default=0) # pyright: ignore[reportArgumentType]

    class Meta:
        verbose_name = 'Pregunta'
        verbose_name_plural = 'Preguntas'
        ordering = ['orden']

    def __str__(self) -> str:
        pregunta = cast(Any, self)
        return f'P{pregunta.orden}: {pregunta.texto[:60]}'


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
        respuesta = cast(Any, self)
        return f'{respuesta.asignatura_grupo} | {respuesta.pregunta} → {respuesta.valor}'


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
        registro = cast(Any, self)
        user = cast(Any, registro.user)
        return f'{user.username} → {registro.asignatura_grupo} ({registro.campana})'
