from datetime import date
from typing import Any, Dict, List, cast

from django.core.exceptions import ObjectDoesNotExist
from django.contrib.auth.models import User
from django.db import IntegrityError
from django.db.models import Avg, Count, StdDev
from django.shortcuts import get_object_or_404
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.request import Request
from rest_framework.response import Response

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
    RespuestaEncuesta,
)
from .permissions import (
    IsAdminOrReadOnly,
    is_admin,
    is_alumno,
    is_miembro_clase,
    is_profesor,
    owns_clase,
    owns_encuesta,
    profesor_for_user,
)
from .serializers import (
    AlumnoDashboardSerializer,
    AsignaturaGrupoSerializer,
    CampanaEvaluacionSerializer,
    ClaseAddAlumnoSerializer,
    ProgresoEncuestaAlumnoSerializer,
    ProgresoEncuestaUpdateSerializer,
    ClaseSurveySubmitSerializer,
    EncuestaDetailSerializer,
    EncuestaListSerializer,
    EncuestaPreguntaSerializer,
    EncuestaWriteSerializer,
    PreguntaSerializer,
    ProfesorSerializer,
    RespuestaSerializer,
    SurveySubmitSerializer,
    UnirseClaseSerializer,
    UserSerializer,
)


# ──────────────────────────────────────────────
# Standard CRUD ViewSets
# ──────────────────────────────────────────────
class UserViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self) -> Any:
        user = self.request.user
        qs = User.objects.select_related('profile')
        if is_admin(user):
            return qs.all()
        if is_profesor(user):
            return qs.filter(profile__role='ALUMNO').order_by('username')
        return qs.filter(id=user.id)


class ProfesorViewSet(viewsets.ModelViewSet):
    serializer_class = ProfesorSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

    def get_queryset(self) -> Any:
        user = self.request.user
        base = cast(Any, Profesor).objects.select_related('user')
        if is_admin(user):
            return base.all()
        prof = profesor_for_user(user)
        if prof:
            return base.filter(pk=prof.pk)
        return base.none()


def _clases_visibles_para_usuario(user: User) -> Any:
    qs = cast(Any, AsignaturaGrupo).objects.select_related('profesor', 'profesor__user')
    if is_admin(user):
        return qs.all()
    if is_profesor(user):
        prof = profesor_for_user(user)
        return qs.filter(profesor=prof) if prof else qs.none()
    if is_alumno(user):
        ids = cast(Any, MiembroClase).objects.filter(user=user).values_list(
            'asignatura_grupo_id', flat=True
        )
        return qs.filter(id__in=ids)
    return qs.none()


class AsignaturaGrupoViewSet(viewsets.ModelViewSet):
    serializer_class = AsignaturaGrupoSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self) -> Any:
        return _clases_visibles_para_usuario(self.request.user)

    def create(self, request: Request, *args: Any, **kwargs: Any) -> Response:
        if not (is_admin(request.user) or is_profesor(request.user)):
            raise PermissionDenied('Solo profesores o administradores pueden crear clases.')
        return super().create(request, *args, **kwargs)

    def perform_create(self, serializer: Any) -> None:
        user = self.request.user
        if is_admin(user):
            serializer.save()
            return
        prof = profesor_for_user(user)
        if not prof:
            raise PermissionDenied('Solo profesores o administradores pueden crear clases.')
        serializer.save(profesor=prof)

    def perform_update(self, serializer: Any) -> None:
        if not (is_admin(self.request.user) or owns_clase(self.request.user, serializer.instance)):
            raise PermissionDenied('No puedes editar esta clase.')
        serializer.save()

    def perform_destroy(self, instance: AsignaturaGrupo) -> None:
        if not (is_admin(self.request.user) or owns_clase(self.request.user, instance)):
            raise PermissionDenied('No puedes eliminar esta clase.')
        instance.delete()


class CampanaEvaluacionViewSet(viewsets.ModelViewSet):
    queryset = cast(Any, CampanaEvaluacion).objects.all()
    serializer_class = CampanaEvaluacionSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]


class PreguntaViewSet(viewsets.ModelViewSet):
    queryset = cast(Any, Pregunta).objects.all()
    serializer_class = PreguntaSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]


class RespuestaViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = RespuestaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self) -> Any:
        if is_admin(self.request.user):
            return cast(Any, Respuesta).objects.all()
        return cast(Any, Respuesta).objects.none()


class EncuestaViewSet(viewsets.ModelViewSet):
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self) -> Any:
        user = self.request.user
        qs = (
            cast(Any, Encuesta).objects.select_related('asignatura_grupo', 'profesor')
            .prefetch_related('items')
            .annotate(num_preguntas=Count('items'))
        )
        ag_id = self.request.query_params.get('asignatura_grupo')
        if ag_id:
            qs = qs.filter(asignatura_grupo_id=ag_id)
        from_date = self.request.query_params.get('from')
        if from_date:
            qs = qs.filter(fecha_inicio__gte=from_date)
        to_date = self.request.query_params.get('to')
        if to_date:
            qs = qs.filter(fecha_inicio__lte=to_date)
        ordering = self.request.query_params.get('ordering')
        allowed_ordering = {
            'created_at',
            '-created_at',
            'fecha_inicio',
            '-fecha_inicio',
            'fecha_fin',
            '-fecha_fin',
        }
        if ordering in allowed_ordering:
            qs = qs.order_by(ordering)
        if is_admin(user):
            return qs
        if is_profesor(user):
            prof = profesor_for_user(user)
            return qs.filter(asignatura_grupo__profesor=prof) if prof else qs.none()
        if is_alumno(user):
            ids = cast(Any, MiembroClase).objects.filter(user=user).values_list(
                'asignatura_grupo_id', flat=True
            )
            return qs.filter(asignatura_grupo_id__in=ids)
        return qs.none()

    def get_serializer_class(self) -> type:
        if self.action in ('create', 'update', 'partial_update'):
            return EncuestaWriteSerializer
        if self.action == 'retrieve':
            return EncuestaDetailSerializer
        return EncuestaListSerializer

    def perform_create(self, serializer: Any) -> None:
        clase = serializer.validated_data['asignatura_grupo']
        if not (is_admin(self.request.user) or owns_clase(self.request.user, clase)):
            raise PermissionDenied('No puedes crear encuestas en esta clase.')
        prof = clase.profesor
        serializer.save(profesor=prof)

    def perform_update(self, serializer: Any) -> None:
        enc = serializer.instance
        if not (is_admin(self.request.user) or owns_encuesta(self.request.user, enc)):
            raise PermissionDenied('No puedes editar esta encuesta.')
        serializer.save()

    def perform_destroy(self, instance: Encuesta) -> None:
        if not (is_admin(self.request.user) or owns_encuesta(self.request.user, instance)):
            raise PermissionDenied('No puedes eliminar esta encuesta.')
        instance.delete()


class EncuestaPreguntaViewSet(viewsets.ModelViewSet):
    serializer_class = EncuestaPreguntaSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self) -> Any:
        user = self.request.user
        qs = cast(Any, EncuestaPregunta).objects.select_related(
            'encuesta', 'encuesta__asignatura_grupo'
        )
        enc_id = self.request.query_params.get('encuesta')
        if enc_id:
            qs = qs.filter(encuesta_id=enc_id)
        if is_admin(user):
            return qs
        if is_profesor(user):
            prof = profesor_for_user(user)
            return (
                qs.filter(encuesta__asignatura_grupo__profesor=prof)
                if prof
                else qs.none()
            )
        if is_alumno(user):
            ids = cast(Any, MiembroClase).objects.filter(user=user).values_list(
                'asignatura_grupo_id', flat=True
            )
            return qs.filter(encuesta__asignatura_grupo_id__in=ids)
        return qs.none()

    def perform_create(self, serializer: Any) -> None:
        enc = serializer.validated_data['encuesta']
        if not (is_admin(self.request.user) or owns_encuesta(self.request.user, enc)):
            raise PermissionDenied('No puedes añadir preguntas a esta encuesta.')
        serializer.save()

    def perform_update(self, serializer: Any) -> None:
        enc = serializer.instance.encuesta
        if not (is_admin(self.request.user) or owns_encuesta(self.request.user, enc)):
            raise PermissionDenied('No puedes editar esta pregunta.')
        serializer.save()

    def perform_destroy(self, instance: EncuestaPregunta) -> None:
        if not (
            is_admin(self.request.user)
            or owns_encuesta(self.request.user, cast(Any, instance).encuesta)
        ):
            raise PermissionDenied('No puedes eliminar esta pregunta.')
        instance.delete()


# ──────────────────────────────────────────────
# Clases: menú, matrícula, alumnos, códigos
# ──────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def mis_clases(request: Request) -> Response:
    """Lista de clases visibles para el rol actual (profesor: propias; alumno: inscrito)."""
    qs = _clases_visibles_para_usuario(request.user).order_by('nombre', 'curso', 'grupo')
    ser = AsignaturaGrupoSerializer(qs, many=True, context={'request': request})
    return Response(ser.data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def unirse_clase_por_codigo(request: Request) -> Response:
    if not is_alumno(request.user) and not is_admin(request.user):
        raise PermissionDenied('Solo los alumnos pueden unirse a una clase con código.')
    ser = UnirseClaseSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    validated_data = cast(dict[str, Any], ser.validated_data)
    codigo = validated_data['codigo_invitacion']
    clase = get_object_or_404(AsignaturaGrupo, codigo_invitacion=codigo)
    _, created = cast(Any, MiembroClase).objects.get_or_create(
        user=request.user,
        asignatura_grupo=clase,
    )
    out = AsignaturaGrupoSerializer(clase, context={'request': request})
    return Response(
        {'clase': out.data, 'nuevo': created},
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def abandonar_clase(request: Request, clase_id: int) -> Response:
    clase = get_object_or_404(AsignaturaGrupo, pk=clase_id)
    deleted, _ = cast(Any, MiembroClase).objects.filter(
        user=request.user,
        asignatura_grupo=clase,
    ).delete()
    if not deleted:
        return Response(
            {'detail': 'No estabas inscrito en esta clase.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def listar_alumnos_clase(request: Request, clase_id: int) -> Response:
    clase = get_object_or_404(AsignaturaGrupo, pk=clase_id)
    if not (is_admin(request.user) or owns_clase(request.user, clase)):
        raise PermissionDenied('No puedes ver los alumnos de esta clase.')
    user_ids = cast(Any, MiembroClase).objects.filter(asignatura_grupo=clase).values_list(
        'user_id', flat=True
    )
    alumnos = User.objects.filter(id__in=user_ids).select_related('profile').order_by(
        'username'
    )
    return Response(UserSerializer(alumnos, many=True).data)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def anadir_alumno_clase(request: Request, clase_id: int) -> Response:
    clase = get_object_or_404(AsignaturaGrupo, pk=clase_id)
    if not (is_admin(request.user) or owns_clase(request.user, clase)):
        raise PermissionDenied('No puedes modificar los alumnos de esta clase.')
    ser = ClaseAddAlumnoSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    validated_data = cast(dict[str, Any], ser.validated_data)
    uid = validated_data['user_id']
    alumno = get_object_or_404(User, pk=uid)
    profile = getattr(alumno, 'profile', None)
    if not profile or profile.role != 'ALUMNO':
        raise ValidationError({'user_id': 'El usuario debe tener rol ALUMNO.'})
    cast(Any, MiembroClase).objects.get_or_create(user=alumno, asignatura_grupo=clase)
    return Response(status=status.HTTP_201_CREATED)


@api_view(['DELETE'])
@permission_classes([permissions.IsAuthenticated])
def quitar_alumno_clase(request: Request, clase_id: int, user_id: int) -> Response:
    clase = get_object_or_404(AsignaturaGrupo, pk=clase_id)
    if not (is_admin(request.user) or owns_clase(request.user, clase)):
        raise PermissionDenied('No puedes modificar los alumnos de esta clase.')
    cast(Any, MiembroClase).objects.filter(
        user_id=user_id,
        asignatura_grupo=clase,
    ).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def regenerar_codigo_invitacion(request: Request, clase_id: int) -> Response:
    clase = get_object_or_404(AsignaturaGrupo, pk=clase_id)
    if not (is_admin(request.user) or owns_clase(request.user, clase)):
        raise PermissionDenied('Solo el profesor de la clase puede regenerar el código.')
    nuevo = clase.regenerar_codigo_invitacion()
    return Response({'codigo_invitacion': nuevo})


@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def registrar_visita_clase(request: Request, clase_id: int) -> Response:
    clase = get_object_or_404(AsignaturaGrupo, pk=clase_id)
    if not (is_admin(request.user) or is_miembro_clase(request.user, clase)):
        raise PermissionDenied('Solo los alumnos inscritos pueden registrar visitas.')
    visita, created = cast(Any, ClaseVisitaAlumno).objects.get_or_create(
        user=request.user,
        asignatura_grupo=clase,
    )
    if not created:
        visita.veces += 1
        visita.save(update_fields=['veces', 'last_visited_at'])
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def alumno_dashboard(request: Request) -> Response:
    if not is_alumno(request.user):
        raise PermissionDenied('Solo el alumnado puede ver este dashboard.')

    ultimas_visitas = cast(Any, ClaseVisitaAlumno).objects.filter(user=request.user).select_related(
        'asignatura_grupo',
        'asignatura_grupo__profesor',
        'asignatura_grupo__profesor__user',
    ).order_by('-last_visited_at')[:5]

    encuestas_recientes = (
        cast(Any, Encuesta).objects.filter(
            asignatura_grupo__miembros__user=request.user,
        )
        .select_related('asignatura_grupo', 'profesor')
        .prefetch_related('items')
        .annotate(num_preguntas=Count('items'))
        .distinct()
        .order_by('-created_at')[:5]
    )

    encuestas_a_medias = (
        cast(Any, Encuesta).objects.filter(
            progresos_alumno__user=request.user,
            progresos_alumno__estado=ProgresoEncuestaAlumno.ESTADO_EN_CURSO,
        )
        .select_related('asignatura_grupo', 'profesor')
        .prefetch_related('items')
        .annotate(num_preguntas=Count('items'))
        .order_by('-progresos_alumno__updated_at')[:5]
    )

    payload = {
        'ultimas_clases_visitadas': ultimas_visitas,
        'ultimas_encuestas_anadidas': encuestas_recientes,
        'encuestas_a_medias': encuestas_a_medias,
    }
    serializer = AlumnoDashboardSerializer(payload, context={'request': request})
    return Response(serializer.data)


@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([permissions.IsAuthenticated])
def progreso_encuesta_clase(request: Request, encuesta_id: int) -> Response:
    encuesta = get_object_or_404(Encuesta, pk=encuesta_id)
    if not is_miembro_clase(request.user, encuesta.asignatura_grupo):
        raise PermissionDenied('Debes estar inscrito para gestionar progreso.')

    if request.method == 'GET':
        progreso = cast(Any, ProgresoEncuestaAlumno).objects.filter(
            user=request.user,
            encuesta=encuesta,
        ).first()
        if not progreso:
            return Response(
                {
                    'encuesta': encuesta.id,
                    'estado': ProgresoEncuestaAlumno.ESTADO_PENDIENTE,
                    'respuestas_borrador': {},
                    'respondidas_count': 0,
                    'started_at': None,
                    'updated_at': None,
                }
            )
        return Response(ProgresoEncuestaAlumnoSerializer(progreso).data)

    if request.method == 'DELETE':
        cast(Any, ProgresoEncuestaAlumno).objects.filter(user=request.user, encuesta=encuesta).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

    serializer = ProgresoEncuestaUpdateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    respuestas = serializer.validated_data['respuestas']
    preguntas_validas = set(
        cast(Any, EncuestaPregunta).objects.filter(encuesta=encuesta).values_list('id', flat=True)
    )
    respuestas_limpias = {
        int(pid): int(valor)
        for pid, valor in respuestas.items()
        if int(pid) in preguntas_validas
    }
    progreso, _ = cast(Any, ProgresoEncuestaAlumno).objects.get_or_create(
        user=request.user,
        encuesta=encuesta,
    )
    progreso.respuestas_borrador = respuestas_limpias
    progreso.respondidas_count = len(respuestas_limpias)
    progreso.estado = (
        ProgresoEncuestaAlumno.ESTADO_EN_CURSO
        if respuestas_limpias
        else ProgresoEncuestaAlumno.ESTADO_PENDIENTE
    )
    progreso.save(update_fields=['respuestas_borrador', 'respondidas_count', 'estado', 'updated_at'])
    return Response(ProgresoEncuestaAlumnoSerializer(progreso).data)


# ──────────────────────────────────────────────
# Encuesta de clase: envío y resumen (profesor)
# ──────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_encuesta_clase(request: Request) -> Response:
    ser = ClaseSurveySubmitSerializer(data=request.data)
    ser.is_valid(raise_exception=True)
    validated_data = cast(dict[str, Any], ser.validated_data)
    encuesta_id = validated_data['encuesta_id']
    items = validated_data['respuestas']

    try:
        encuesta = cast(Any, Encuesta).objects.prefetch_related('items').get(pk=encuesta_id)
    except ObjectDoesNotExist:
        return Response(
            {'detail': 'La encuesta no existe.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    clase = encuesta.asignatura_grupo
    if not is_miembro_clase(request.user, clase):
        return Response(
            {'detail': 'Debes estar inscrito en la clase para responder.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    today = date.today()
    if not encuesta.activa:
        return Response(
            {'detail': 'La encuesta no está activa.'},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if not (encuesta.fecha_inicio <= today <= encuesta.fecha_fin):
        return Response(
            {'detail': 'La encuesta no está en periodo de respuesta.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if cast(Any, ParticipacionEncuesta).objects.filter(user=request.user, encuesta=encuesta).exists():
        return Response(
            {'detail': 'Ya has respondido esta encuesta.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    preguntas_ids = {p.id for p in encuesta.items.all()}
    enviados = {it['pregunta_id'] for it in items}
    if enviados != preguntas_ids:
        return Response(
            {
                'detail': 'Debes enviar exactamente una respuesta por cada pregunta de la encuesta.',
            },
            status=status.HTTP_400_BAD_REQUEST,
        )

    objs: List[Any] = []
    for it in items:
        objs.append(
            RespuestaEncuesta(
                encuesta=encuesta,
                pregunta_id=it['pregunta_id'],
                valor=it['valor'],
            )
        )
    cast(Any, RespuestaEncuesta).objects.bulk_create(objs)
    try:
        cast(Any, ParticipacionEncuesta).objects.create(user=request.user, encuesta=encuesta)
    except IntegrityError:
        return Response(
            {'detail': 'Ya has respondido esta encuesta.'},
            status=status.HTTP_403_FORBIDDEN,
        )
    cast(Any, ProgresoEncuestaAlumno).objects.update_or_create(
        user=request.user,
        encuesta=encuesta,
        defaults={
            'estado': ProgresoEncuestaAlumno.ESTADO_ENVIADA,
            'respuestas_borrador': {},
            'respondidas_count': len(items),
        },
    )

    return Response(
        {'detail': 'Encuesta enviada correctamente.'},
        status=status.HTTP_201_CREATED,
    )


@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def resumen_encuesta_clase(request: Request, encuesta_id: int) -> Response:
    encuesta = get_object_or_404(
        cast(Any, Encuesta).objects.select_related('asignatura_grupo').prefetch_related('items'),
        pk=encuesta_id,
    )
    if not (is_admin(request.user) or owns_encuesta(request.user, encuesta)):
        raise PermissionDenied('No puedes ver las estadísticas de esta encuesta.')

    n_participantes = cast(Any, ParticipacionEncuesta).objects.filter(encuesta=encuesta).count()
    por_pregunta: List[Dict[str, Any]] = []
    for pregunta in encuesta.items.all().order_by('orden', 'id'):
        stats = cast(Any, RespuestaEncuesta).objects.filter(
            encuesta=encuesta,
            pregunta=pregunta,
        ).aggregate(media=Avg('valor'))
        por_pregunta.append(
            {
                'pregunta_id': pregunta.id,
                'texto': pregunta.texto,
                'orden': pregunta.orden,
                'media': round(stats['media'], 2) if stats['media'] is not None else None,
            }
        )

    global_stats = cast(Any, RespuestaEncuesta).objects.filter(encuesta=encuesta).aggregate(
        media=Avg('valor')
    )

    return Response(
        {
            'encuesta_id': encuesta.id,
            'nombre': encuesta.nombre,
            'asignatura_grupo_id': encuesta.asignatura_grupo_id,
            'n_participantes': n_participantes,
            'media_global': round(global_stats['media'], 2)
            if global_stats['media'] is not None
            else None,
            'por_pregunta': por_pregunta,
        }
    )


# ──────────────────────────────────────────────
# Current user info
# ──────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def me(request: Request) -> Response:
    """Return the currently authenticated user with profile."""
    serializer = UserSerializer(request.user)
    return Response(serializer.data)


# ──────────────────────────────────────────────
# Submit survey (anonymous answers)
# ──────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def submit_survey(request: Request) -> Response:
    """
    Receive a list of answers, verify the student has not
    already voted, save Respuestas anonymously, and create
    a RegistroVoto to prevent double-voting.
    """
    serializer = SurveySubmitSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)

    data = cast(dict[str, Any], serializer.validated_data)
    asignatura_grupo_id = data['asignatura_grupo_id']
    campana_id = data['campana_id']
    respuestas_data = data['respuestas']

    # Verify campaign exists and is active
    try:
        campana = cast(Any, CampanaEvaluacion).objects.get(id=campana_id, activa=True)
    except ObjectDoesNotExist:
        return Response(
            {'detail': 'La campaña no existe o no está activa.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Verify asignatura_grupo exists
    try:
        asignatura_grupo = cast(Any, AsignaturaGrupo).objects.get(id=asignatura_grupo_id)
    except ObjectDoesNotExist:
        return Response(
            {'detail': 'La asignatura/grupo no existe.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check for duplicate vote
    if cast(Any, RegistroVoto).objects.filter(
        user=request.user,
        campana=campana,
        asignatura_grupo=asignatura_grupo,
    ).exists():
        return Response(
            {'detail': 'Ya has votado en esta asignatura para esta campaña.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Save anonymous responses
    respuesta_objects: List[Any] = []
    for item in respuestas_data:
        respuesta_objects.append(
            Respuesta(
                asignatura_grupo=asignatura_grupo,
                campana=campana,
                pregunta_id=item['pregunta_id'],
                valor=item['valor'],
            )
        )
    cast(Any, Respuesta).objects.bulk_create(respuesta_objects)

    # Record the vote (prevents future double-voting)
    try:
        cast(Any, RegistroVoto).objects.create(
            user=request.user,
            campana=campana,
            asignatura_grupo=asignatura_grupo,
        )
    except IntegrityError:
        return Response(
            {'detail': 'Ya has votado en esta asignatura para esta campaña.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    return Response(
        {'detail': 'Encuesta enviada correctamente.'},
        status=status.HTTP_201_CREATED,
    )


# ──────────────────────────────────────────────
# Check if user already voted
# ──────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def check_vote(request: Request) -> Response:
    """Check if the current user has voted for a given asignatura_grupo in a campaign."""
    campana_id = request.query_params.get('campana_id')
    asignatura_grupo_id = request.query_params.get('asignatura_grupo_id')

    if not campana_id or not asignatura_grupo_id:
        return Response(
            {'detail': 'campana_id y asignatura_grupo_id son requeridos.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    voted = cast(Any, RegistroVoto).objects.filter(
        user=request.user,
        campana_id=campana_id,
        asignatura_grupo_id=asignatura_grupo_id,
    ).exists()

    return Response({'voted': voted})


# ──────────────────────────────────────────────
# Evolution data for a professor
# ──────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_evolution(request: Request, profesor_id: int) -> Response:
    """
    Return average scores for a teacher grouped by campaign.
    Used to render the evolution chart.
    """
    if not is_admin(request.user):
        mine = profesor_for_user(request.user)
        if not mine or cast(Any, mine).id != profesor_id:
            raise PermissionDenied('No puedes ver la evolución de otro profesor.')

    try:
        profesor = cast(Any, Profesor).objects.get(id=profesor_id)
    except ObjectDoesNotExist:
        return Response(
            {'detail': 'Profesor no encontrado.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    asignatura_ids = profesor.asignaturas.values_list('id', flat=True)

    campanas = cast(Any, CampanaEvaluacion).objects.all().order_by('fecha_inicio')

    evolution: List[Dict[str, Any]] = []
    for campana in campanas:
        stats: Dict[str, Any] = cast(Any, Respuesta).objects.filter(
            campana=campana,
            asignatura_grupo_id__in=asignatura_ids,
        ).aggregate(
            media=Avg('valor'),
            desviacion=StdDev('valor'),
        )
        if stats['media'] is not None:
            evolution.append({
                'campana_id': campana.id,
                'campana_nombre': campana.nombre,
                'fecha_inicio': campana.fecha_inicio.isoformat(),
                'media': round(stats['media'], 2),
                'desviacion': round(stats['desviacion'], 2) if stats['desviacion'] else 0,
            })

    return Response(evolution)


# ──────────────────────────────────────────────
# Results summary for teacher dashboard
# ──────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_results_summary(request: Request, profesor_id: int) -> Response:
    """
    Return per-subject average scores for the latest campaign.
    """
    if not is_admin(request.user):
        mine = profesor_for_user(request.user)
        if not mine or cast(Any, mine).id != profesor_id:
            raise PermissionDenied('No puedes ver los resultados de otro profesor.')

    try:
        profesor = cast(Any, Profesor).objects.get(id=profesor_id)
    except ObjectDoesNotExist:
        return Response(
            {'detail': 'Profesor no encontrado.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Get the latest campaign that has responses for this teacher
    asignatura_ids = profesor.asignaturas.values_list('id', flat=True)
    latest_campana = (
        cast(Any, CampanaEvaluacion).objects.filter(
            respuestas__asignatura_grupo_id__in=asignatura_ids,
        )
        .order_by('-fecha_inicio')
        .first()
    )

    if not latest_campana:
        return Response({
            'campana': None,
            'asignaturas': [],
            'media_global': None,
            'desviacion_global': None,
        })

    # Per-subject averages
    asignaturas_data: List[Dict[str, Any]] = []
    for asig in profesor.asignaturas.all():
        stats: Dict[str, Any] = cast(Any, Respuesta).objects.filter(
            campana=latest_campana,
            asignatura_grupo=asig,
        ).aggregate(
            media=Avg('valor'),
            desviacion=StdDev('valor'),
        )
        if stats['media'] is not None:
            asignaturas_data.append({
                'asignatura_id': asig.id,
                'nombre': str(asig),
                'media': round(stats['media'], 2),
                'desviacion': round(stats['desviacion'], 2) if stats['desviacion'] else 0,
            })

    # Global averages
    global_stats: Dict[str, Any] = cast(Any, Respuesta).objects.filter(
        campana=latest_campana,
        asignatura_grupo_id__in=asignatura_ids,
    ).aggregate(
        media=Avg('valor'),
        desviacion=StdDev('valor'),
    )

    return Response({
        'campana': cast(Any, CampanaEvaluacionSerializer)(latest_campana).data,
        'asignaturas': asignaturas_data,
        'media_global': round(global_stats['media'], 2) if global_stats['media'] else None,
        'desviacion_global': round(global_stats['desviacion'], 2) if global_stats['desviacion'] else None,
    })
