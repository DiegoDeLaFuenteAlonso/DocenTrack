from typing import Any, Dict, List
from django.contrib.auth.models import User
from django.db import IntegrityError
from django.db.models import Avg, StdDev
from rest_framework import permissions, status, viewsets
from rest_framework.decorators import api_view, permission_classes
from rest_framework.request import Request
from rest_framework.response import Response

from .models import (
    AsignaturaGrupo,
    CampanaEvaluacion,
    Pregunta,
    Profesor,
    RegistroVoto,
    Respuesta,
)
from .serializers import (
    AsignaturaGrupoSerializer,
    CampanaEvaluacionSerializer,
    PreguntaSerializer,
    ProfesorSerializer,
    RespuestaSerializer,
    SurveySubmitSerializer,
    UserSerializer,
)


# ──────────────────────────────────────────────
# Standard CRUD ViewSets
# ──────────────────────────────────────────────
class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.select_related('profile').all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]


class ProfesorViewSet(viewsets.ModelViewSet):
    queryset = Profesor.objects.select_related('user').all()
    serializer_class = ProfesorSerializer
    permission_classes = [permissions.IsAuthenticated]


class AsignaturaGrupoViewSet(viewsets.ModelViewSet):
    queryset = AsignaturaGrupo.objects.select_related('profesor').all()
    serializer_class = AsignaturaGrupoSerializer
    permission_classes = [permissions.IsAuthenticated]


class CampanaEvaluacionViewSet(viewsets.ModelViewSet):
    queryset = CampanaEvaluacion.objects.all()
    serializer_class = CampanaEvaluacionSerializer
    permission_classes = [permissions.IsAuthenticated]


class PreguntaViewSet(viewsets.ModelViewSet):
    queryset = Pregunta.objects.all()
    serializer_class = PreguntaSerializer
    permission_classes = [permissions.IsAuthenticated]


class RespuestaViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Respuesta.objects.all()
    serializer_class = RespuestaSerializer
    permission_classes = [permissions.IsAuthenticated]


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

    data = serializer.validated_data
    asignatura_grupo_id = data['asignatura_grupo_id']
    campana_id = data['campana_id']
    respuestas_data = data['respuestas']

    # Verify campaign exists and is active
    try:
        campana = CampanaEvaluacion.objects.get(id=campana_id, activa=True)
    except CampanaEvaluacion.DoesNotExist:
        return Response(
            {'detail': 'La campaña no existe o no está activa.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Verify asignatura_grupo exists
    try:
        asignatura_grupo = AsignaturaGrupo.objects.get(id=asignatura_grupo_id)
    except AsignaturaGrupo.DoesNotExist:
        return Response(
            {'detail': 'La asignatura/grupo no existe.'},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # Check for duplicate vote
    if RegistroVoto.objects.filter(
        user=request.user,
        campana=campana,
        asignatura_grupo=asignatura_grupo,
    ).exists():
        return Response(
            {'detail': 'Ya has votado en esta asignatura para esta campaña.'},
            status=status.HTTP_403_FORBIDDEN,
        )

    # Save anonymous responses
    respuesta_objects: List[Respuesta] = []
    for item in respuestas_data:
        respuesta_objects.append(
            Respuesta(
                asignatura_grupo=asignatura_grupo,
                campana=campana,
                pregunta_id=item['pregunta_id'],
                valor=item['valor'],
            )
        )
    Respuesta.objects.bulk_create(respuesta_objects)

    # Record the vote (prevents future double-voting)
    try:
        RegistroVoto.objects.create(
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

    voted = RegistroVoto.objects.filter(
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
    try:
        profesor = Profesor.objects.get(id=profesor_id)
    except Profesor.DoesNotExist:
        return Response(
            {'detail': 'Profesor no encontrado.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    asignatura_ids = profesor.asignaturas.values_list('id', flat=True)

    campanas = CampanaEvaluacion.objects.all().order_by('fecha_inicio')

    evolution: List[Dict[str, Any]] = []
    for campana in campanas:
        stats: Dict[str, Any] = Respuesta.objects.filter(
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
    try:
        profesor = Profesor.objects.get(id=profesor_id)
    except Profesor.DoesNotExist:
        return Response(
            {'detail': 'Profesor no encontrado.'},
            status=status.HTTP_404_NOT_FOUND,
        )

    # Get the latest campaign that has responses for this teacher
    asignatura_ids = profesor.asignaturas.values_list('id', flat=True)
    latest_campana = (
        CampanaEvaluacion.objects.filter(
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
        stats: Dict[str, Any] = Respuesta.objects.filter(
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
    global_stats: Dict[str, Any] = Respuesta.objects.filter(
        campana=latest_campana,
        asignatura_grupo_id__in=asignatura_ids,
    ).aggregate(
        media=Avg('valor'),
        desviacion=StdDev('valor'),
    )

    return Response({
        'campana': CampanaEvaluacionSerializer(latest_campana).data,
        'asignaturas': asignaturas_data,
        'media_global': round(global_stats['media'], 2) if global_stats['media'] else None,
        'desviacion_global': round(global_stats['desviacion'], 2) if global_stats['desviacion'] else None,
    })
