from django.contrib.auth.models import User
from rest_framework import serializers

from .models import (
    AsignaturaGrupo,
    CampanaEvaluacion,
    Pregunta,
    Profesor,
    RegistroVoto,
    Respuesta,
    UserProfile,
)


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

    class Meta:
        model = AsignaturaGrupo
        fields = ['id', 'nombre', 'curso', 'grupo', 'profesor', 'profesor_nombre']

    def get_profesor_nombre(self, obj: AsignaturaGrupo) -> str:
        return str(obj.profesor)


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
