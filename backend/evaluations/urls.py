from typing import Any, List
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from . import views

router = DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'profesores', views.ProfesorViewSet)
router.register(r'asignaturas', views.AsignaturaGrupoViewSet)
router.register(r'campanas', views.CampanaEvaluacionViewSet)
router.register(r'preguntas', views.PreguntaViewSet)
router.register(r'respuestas', views.RespuestaViewSet)

urlpatterns: List[Any] = [
    path('', include(router.urls)),
    path('me/', views.me, name='me'),
    path('submit-survey/', views.submit_survey, name='submit_survey'),
    path('check-vote/', views.check_vote, name='check_vote'),
    path('evolution/<int:profesor_id>/', views.get_evolution, name='get_evolution'),
    path('results/<int:profesor_id>/', views.get_results_summary, name='get_results_summary'),
]
