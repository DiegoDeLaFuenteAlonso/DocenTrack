from typing import Any, List

from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet, basename='user')
router.register(r'profesores', views.ProfesorViewSet, basename='profesor')
router.register(r'asignaturas', views.AsignaturaGrupoViewSet, basename='asignatura')
router.register(r'campanas', views.CampanaEvaluacionViewSet)
router.register(r'preguntas', views.PreguntaViewSet)
router.register(r'respuestas', views.RespuestaViewSet, basename='respuesta')
router.register(r'encuestas-clase', views.EncuestaViewSet, basename='encuestaclase')
router.register(
    r'encuesta-preguntas', views.EncuestaPreguntaViewSet, basename='encuestapregunta'
)

urlpatterns: List[Any] = [
    path('encuestas-clase/crear-completa/', views.crear_encuesta_completa, name='crear_encuesta_completa'),
    path('encuestas-clase/bulk-action/', views.encuestas_bulk_action, name='encuestas_bulk_action'),
    path(
        'encuestas-clase/<int:encuesta_id>/resumen/',
        views.resumen_encuesta_clase,
        name='resumen_encuesta_clase',
    ),
    path('submit-encuesta-clase/', views.submit_encuesta_clase, name='submit_encuesta_clase'),
    path('alumno/dashboard/', views.alumno_dashboard, name='alumno_dashboard'),
    path(
        'encuestas-clase/<int:encuesta_id>/progreso/',
        views.progreso_encuesta_clase,
        name='progreso_encuesta_clase',
    ),
    path('mis-clases/', views.mis_clases, name='mis_clases'),
    path('clases/unirse/', views.unirse_clase_por_codigo, name='unirse_clase'),
    path('clases/<int:clase_id>/abandonar/', views.abandonar_clase, name='abandonar_clase'),
    path('clases/<int:clase_id>/alumnos/', views.listar_alumnos_clase, name='listar_alumnos_clase'),
    path(
        'clases/<int:clase_id>/alumnos/anadir/',
        views.anadir_alumno_clase,
        name='anadir_alumno_clase',
    ),
    path(
        'clases/<int:clase_id>/alumnos/<int:user_id>/',
        views.quitar_alumno_clase,
        name='quitar_alumno_clase',
    ),
    path(
        'clases/<int:clase_id>/visita/',
        views.registrar_visita_clase,
        name='registrar_visita_clase',
    ),
    path(
        'clases/<int:clase_id>/regenerar-codigo/',
        views.regenerar_codigo_invitacion,
        name='regenerar_codigo',
    ),
    path('', include(router.urls)),
    path('me/', views.me, name='me'),
    path('submit-survey/', views.submit_survey, name='submit_survey'),
    path('check-vote/', views.check_vote, name='check_vote'),
    path('evolution/<int:profesor_id>/', views.get_evolution, name='get_evolution'),
    path('results/<int:profesor_id>/', views.get_results_summary, name='get_results_summary'),
]
