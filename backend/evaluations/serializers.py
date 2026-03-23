from typing import Any, cast

from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    AsignaturaGrupo,
    CampanaEvaluacion,
    ClaseVisitaAlumno,
    Encuesta,
    EncuestaPregunta,
    MiembroClase,
    ParticipacionEncuesta,
    ProgresoEncuestaAlumno,
    Pregunta,
    Profesor,
    RegistroVoto,
    Respuesta,
    UserProfile,
)
from .permissions import is_admin, owns_clase


def _estado_publicacion_encuesta(obj: Encuesta) -> str:
    if obj.finalizada:
        return 'FINALIZADA'
    if obj.activa:
        return 'ACTIVA'
    return 'INACTIVA'


# ──────────────────────────────────────────────────────────
# Auth / User
# ──────────────────────────────────────────────────────────
class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['id', 'role']


class UserSerializer(serializers.ModelSerializer):
    profile = UserProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email', 'profile']


# ──────────────────────────────────────────────────────────
# Profesor
# ──────────────────────────────────────────────────────────
class ProfesorSerializer(serializers.ModelSerializer):
    user_id = serializers.IntegerField(source='user.id', read_only=True)
    username = serializers.CharField(source='user.username', read_only=True)

    class Meta:
        model = Profesor
        fields = ['id', 'user_id', 'username', 'nombre', 'apellidos', 'departamento']


# ──────────────────────────────────────────────────────────
# Asignatura / Grupo
# ──────────────────────────────────────────────────────────
class AsignaturaGrupoSerializer(serializers.ModelSerializer):
    profesor_nombre = serializers.SerializerMethodField()
    codigo_invitacion = serializers.SerializerMethodField()

    class Meta:
        model = AsignaturaGrupo
        fields = [
            'id',
            'nombre',
            'curso',
            'grupo',
            'profesor',
            'profesor_nombre',
            'codigo_invitacion',
        ]
        read_only_fields = ['codigo_invitacion']
        extra_kwargs = {
            'profesor': {'required': False},
        }

    def get_profesor_nombre(self, obj: AsignaturaGrupo) -> str:
        return str(obj.profesor)

    def get_codigo_invitacion(self, obj: AsignaturaGrupo) -> str | None:
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return None
        if is_admin(request.user) or owns_clase(request.user, obj):
            return cast(str | None, obj.codigo_invitacion)
        return None


class UnirseClaseSerializer(serializers.Serializer):
    codigo_invitacion = serializers.CharField(max_length=16, trim_whitespace=True)


# ──────────────────────────────────────────────────────────
# Campaña de evaluación
# ──────────────────────────────────────────────────────────
class CampanaEvaluacionSerializer(serializers.ModelSerializer):
    class Meta:
        model = CampanaEvaluacion
        fields = ['id', 'nombre', 'fecha_inicio', 'fecha_fin', 'activa']


# ──────────────────────────────────────────────────────────
# Pregunta
# ──────────────────────────────────────────────────────────
class PreguntaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Pregunta
        fields = ['id', 'texto', 'orden']


# ──────────────────────────────────────────────────────────
# Respuesta (read-only, never exposes user data)
# ──────────────────────────────────────────────────────────
class RespuestaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Respuesta
        fields = ['id', 'asignatura_grupo', 'campana', 'pregunta', 'valor']


# ──────────────────────────────────────────────────────────
# RegistroVoto
# ──────────────────────────────────────────────────────────
class RegistroVotoSerializer(serializers.ModelSerializer):
    class Meta:
        model = RegistroVoto
        fields = ['id', 'user', 'campana', 'asignatura_grupo']
        read_only_fields = ['user']


# ──────────────────────────────────────────────────────────
# Survey submit (custom)
# ──────────────────────────────────────────────────────────
class RespuestaItemSerializer(serializers.Serializer):
    pregunta_id = serializers.IntegerField()
    valor = serializers.IntegerField(min_value=1, max_value=5)


class SurveySubmitSerializer(serializers.Serializer):
    asignatura_grupo_id = serializers.IntegerField()
    campana_id = serializers.IntegerField()
    respuestas = RespuestaItemSerializer(many=True)


# ──────────────────────────────────────────────────────────
# Encuestas por clase
# ──────────────────────────────────────────────────────────
class EncuestaWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Encuesta
        fields = [
            'id',
            'asignatura_grupo',
            'nombre',
            'fecha_inicio',
            'fecha_fin',
            'activa',
        ]
        read_only_fields = ['id']


class EncuestaPreguntaSerializer(serializers.ModelSerializer):
    class Meta:
        model = EncuestaPregunta
        fields = ['id', 'encuesta', 'texto', 'orden']


class EncuestaPreguntaCreateSerializer(serializers.Serializer):
    texto = serializers.CharField(trim_whitespace=True)
    orden = serializers.IntegerField(required=False, min_value=1)


class EncuestaCreateWithItemsSerializer(serializers.Serializer):
    asignatura_grupo = serializers.IntegerField(min_value=1)
    nombre = serializers.CharField(trim_whitespace=True, max_length=200)
    fecha_inicio = serializers.DateField()
    fecha_fin = serializers.DateField()
    activa = serializers.BooleanField(required=False, default=True)
    preguntas = EncuestaPreguntaCreateSerializer(many=True, min_length=1)

    def validate(self, attrs: dict[str, Any]) -> dict[str, Any]:
        if attrs['fecha_fin'] < attrs['fecha_inicio']:
            raise serializers.ValidationError(
                {'fecha_fin': 'La fecha de fin debe ser mayor o igual a la fecha de inicio.'}
            )

        preguntas = attrs['preguntas']
        seen: set[int] = set()
        auto_order = 1
        normalizadas: list[dict[str, Any]] = []
        for item in preguntas:
            texto = str(item.get('texto', '')).strip()
            if not texto:
                raise serializers.ValidationError(
                    {'preguntas': 'Cada pregunta debe tener texto.'}
                )
            orden = item.get('orden')
            if orden is None:
                while auto_order in seen:
                    auto_order += 1
                orden = auto_order
                auto_order += 1
            if orden in seen:
                raise serializers.ValidationError(
                    {'preguntas': 'No puede haber preguntas con el mismo orden.'}
                )
            seen.add(int(orden))
            normalizadas.append({'texto': texto, 'orden': int(orden)})

        attrs['preguntas'] = normalizadas
        return attrs


class EncuestaListSerializer(serializers.ModelSerializer):
    """Listado con estado para el alumno (pendiente / realizada)."""

    ya_respondido = serializers.SerializerMethodField()
    num_preguntas = serializers.SerializerMethodField()
    estado_encuesta = serializers.SerializerMethodField()
    estado_publicacion = serializers.SerializerMethodField()

    class Meta:
        model = Encuesta
        fields = [
            'id',
            'asignatura_grupo',
            'profesor',
            'nombre',
            'fecha_inicio',
            'fecha_fin',
            'activa',
            'finalizada',
            'created_at',
            'ya_respondido',
            'estado_encuesta',
            'estado_publicacion',
            'num_preguntas',
        ]

    def get_num_preguntas(self, obj: Encuesta) -> int:
        n = getattr(obj, 'num_preguntas', None)
        if n is not None:
            return int(n)
        return cast(Any, obj).items.count()

    def get_ya_respondido(self, obj: Encuesta) -> bool:
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return cast(Any, ParticipacionEncuesta).objects.filter(
            user=request.user,
            encuesta=obj,
        ).exists()

    def get_estado_encuesta(self, obj: Encuesta) -> str:
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 'PENDIENTE'
        if cast(Any, ParticipacionEncuesta).objects.filter(user=request.user, encuesta=obj).exists():
            return ProgresoEncuestaAlumno.ESTADO_ENVIADA
        progreso = cast(Any, ProgresoEncuestaAlumno).objects.filter(
            user=request.user,
            encuesta=obj,
        ).first()
        if progreso:
            return progreso.estado
        return ProgresoEncuestaAlumno.ESTADO_PENDIENTE

    def get_estado_publicacion(self, obj: Encuesta) -> str:
        return _estado_publicacion_encuesta(obj)


class EncuestaDetailSerializer(serializers.ModelSerializer):
    items = EncuestaPreguntaSerializer(many=True, read_only=True)
    ya_respondido = serializers.SerializerMethodField()
    num_preguntas = serializers.SerializerMethodField()
    estado_encuesta = serializers.SerializerMethodField()
    estado_publicacion = serializers.SerializerMethodField()

    class Meta:
        model = Encuesta
        fields = [
            'id',
            'asignatura_grupo',
            'profesor',
            'nombre',
            'fecha_inicio',
            'fecha_fin',
            'activa',
            'finalizada',
            'created_at',
            'items',
            'ya_respondido',
            'estado_encuesta',
            'estado_publicacion',
            'num_preguntas',
        ]

    def get_num_preguntas(self, obj: Encuesta) -> int:
        n = getattr(obj, 'num_preguntas', None)
        if n is not None:
            return int(n)
        return cast(Any, obj).items.count()

    def get_ya_respondido(self, obj: Encuesta) -> bool:
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return False
        return cast(Any, ParticipacionEncuesta).objects.filter(
            user=request.user,
            encuesta=obj,
        ).exists()

    def get_estado_encuesta(self, obj: Encuesta) -> str:
        request = self.context.get('request')
        if not request or not request.user.is_authenticated:
            return 'PENDIENTE'
        if cast(Any, ParticipacionEncuesta).objects.filter(user=request.user, encuesta=obj).exists():
            return ProgresoEncuestaAlumno.ESTADO_ENVIADA
        progreso = cast(Any, ProgresoEncuestaAlumno).objects.filter(
            user=request.user,
            encuesta=obj,
        ).first()
        if progreso:
            return progreso.estado
        return ProgresoEncuestaAlumno.ESTADO_PENDIENTE

    def get_estado_publicacion(self, obj: Encuesta) -> str:
        return _estado_publicacion_encuesta(obj)


class ClaseRespuestaItemSerializer(serializers.Serializer):
    pregunta_id = serializers.IntegerField()
    valor = serializers.IntegerField(min_value=1, max_value=5)


class ClaseSurveySubmitSerializer(serializers.Serializer):
    encuesta_id = serializers.IntegerField()
    respuestas = ClaseRespuestaItemSerializer(many=True)


class ClaseAddAlumnoSerializer(serializers.Serializer):
    user_id = serializers.IntegerField(min_value=1)


class EncuestaBulkActionSerializer(serializers.Serializer):
    ACTION_ACTIVATE = 'activate'
    ACTION_DEACTIVATE = 'deactivate'
    ACTION_DELETE = 'delete'
    ACTION_CHOICES = [
        (ACTION_ACTIVATE, 'Activate'),
        (ACTION_DEACTIVATE, 'Deactivate'),
        (ACTION_DELETE, 'Soft delete'),
    ]

    encuesta_ids = serializers.ListField(
        child=serializers.IntegerField(min_value=1),
        min_length=1,
    )
    action = serializers.ChoiceField(choices=ACTION_CHOICES)


class ProgresoEncuestaAlumnoSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProgresoEncuestaAlumno
        fields = [
            'encuesta',
            'estado',
            'respuestas_borrador',
            'respondidas_count',
            'started_at',
            'updated_at',
        ]
        read_only_fields = ['started_at', 'updated_at']


class ProgresoEncuestaUpdateSerializer(serializers.Serializer):
    respuestas = serializers.DictField(child=serializers.IntegerField(min_value=1, max_value=5))


class ClaseVisitaAlumnoSerializer(serializers.ModelSerializer):
    clase = AsignaturaGrupoSerializer(source='asignatura_grupo', read_only=True)

    class Meta:
        model = ClaseVisitaAlumno
        fields = ['clase', 'last_visited_at', 'veces']


class AlumnoDashboardSerializer(serializers.Serializer):
    ultimas_clases_visitadas = ClaseVisitaAlumnoSerializer(many=True)
    ultimas_encuestas_anadidas = EncuestaListSerializer(many=True)
    encuestas_a_medias = EncuestaListSerializer(many=True)
