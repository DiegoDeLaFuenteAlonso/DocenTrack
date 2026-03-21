from __future__ import annotations

from typing import Any, cast

from django.contrib.auth.models import User
from rest_framework import permissions
from rest_framework.request import Request

from .models import AsignaturaGrupo, Encuesta, MiembroClase, Profesor


def user_role(user: User) -> str | None:
    if not user.is_authenticated:
        return None
    profile = getattr(user, 'profile', None)
    return profile.role if profile else None


def is_admin(user: User) -> bool:
    return user_role(user) == 'ADMIN'


def is_profesor(user: User) -> bool:
    return user_role(user) == 'PROFESOR'


def is_alumno(user: User) -> bool:
    return user_role(user) == 'ALUMNO'


def profesor_for_user(user: User) -> Profesor | None:
    if not user.is_authenticated:
        return None
    return getattr(user, 'profesor', None)


def owns_clase(user: User, clase: AsignaturaGrupo) -> bool:
    p = profesor_for_user(user)
    return p is not None and cast(Any, clase).profesor_id == cast(Any, p).id
    

def is_miembro_clase(user: User, clase: AsignaturaGrupo) -> bool:
    return cast(Any, MiembroClase).objects.filter(user=user, asignatura_grupo=clase).exists()


def can_view_clase(user: User, clase: AsignaturaGrupo) -> bool:
    if is_admin(user):
        return True
    if owns_clase(user, clase):
        return True
    if is_miembro_clase(user, clase):
        return True
    return False


def owns_encuesta(user: User, encuesta: Encuesta) -> bool:
    return owns_clase(user, cast(Any, encuesta).asignatura_grupo)


class IsAdminOrReadOnly(permissions.BasePermission):
    """Solo rol ADMIN puede escribir; cualquier autenticado puede leer."""

    def has_permission(self, request: Request, view: Any) -> bool:  # pyright: ignore[reportIncompatibleMethodOverride]
        user = cast(Any, request.user)
        if not user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return is_admin(cast(Any, user))


class IsProfesorOrAdmin(permissions.BasePermission):
    def has_permission(self, request: Request, view: Any) -> bool:  # pyright: ignore[reportIncompatibleMethodOverride]
        user = cast(Any, request.user)
        if not user.is_authenticated:
            return False
        return is_admin(cast(Any, user)) or is_profesor(cast(Any, user))
