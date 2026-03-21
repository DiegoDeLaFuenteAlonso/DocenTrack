from django.contrib import admin

from .models import (
    AsignaturaGrupo,
    CampanaEvaluacion,
    Pregunta,
    Profesor,
    RegistroVoto,
    Respuesta,
    UserProfile,
)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ("user", "role")
    list_filter = ("role",)
    search_fields = ("user__username",)

    fieldsets = (
        (
            "Usuario",
            {
                "fields": ("user",),
            },
        ),
        (
            "Rol",
            {
                "fields": ("role",),
            },
        ),
    )


@admin.register(Profesor)
class ProfesorAdmin(admin.ModelAdmin):
    list_display = ("nombre", "apellidos", "departamento", "user")
    list_filter = ("departamento",)
    search_fields = ("nombre", "apellidos")

    fieldsets = (
        (
            "Datos del profesor",
            {
                "fields": ("nombre", "apellidos", "departamento"),
            },
        ),
        (
            "Usuario asociado",
            {
                "fields": ("user",),
            },
        ),
    )


@admin.register(AsignaturaGrupo)
class AsignaturaGrupoAdmin(admin.ModelAdmin):
    list_display = ("nombre", "curso", "grupo", "profesor_nombre")
    list_filter = ("curso", "grupo", "profesor__departamento")
    search_fields = ("nombre", "profesor__nombre", "profesor__apellidos")
    list_select_related = ("profesor",)

    ordering = ("nombre", "curso", "grupo")

    fieldsets = (
        (
            "Asignatura y grupo",
            {
                "fields": ("nombre", "curso", "grupo"),
            },
        ),
        (
            "Profesor asignado",
            {
                "fields": ("profesor",),
            },
        ),
    )

    @admin.display(description="Profesor")
    def profesor_nombre(self, obj: AsignaturaGrupo) -> str:
        return str(obj.profesor)


@admin.register(CampanaEvaluacion)
class CampanaEvaluacionAdmin(admin.ModelAdmin):
    list_display = ("nombre", "fecha_inicio", "fecha_fin", "activa")
    list_filter = ("activa",)
    search_fields = ("nombre",)
    ordering = ("fecha_inicio",)

    fieldsets = (
        (
            "Datos de la campaña",
            {
                "fields": ("nombre",),
            },
        ),
        (
            "Periodo",
            {
                "fields": ("fecha_inicio", "fecha_fin"),
            },
        ),
        (
            "Estado",
            {
                "fields": ("activa",),
            },
        ),
    )


@admin.register(Pregunta)
class PreguntaAdmin(admin.ModelAdmin):
    list_display = ("orden", "texto")
    search_fields = ("texto",)
    ordering = ("orden",)

    fieldsets = (
        (
            "Pregunta",
            {
                "fields": ("texto", "orden"),
            },
        ),
    )


@admin.register(Respuesta)
class RespuestaAdmin(admin.ModelAdmin):
    list_display = ("campana", "asignatura_grupo", "pregunta", "valor")
    list_filter = ("campana", "asignatura_grupo__grupo")
    search_fields = ("campana__nombre", "asignatura_grupo__nombre", "pregunta__texto")
    list_select_related = ("campana", "asignatura_grupo", "pregunta", "asignatura_grupo__profesor")

    fieldsets = (
        (
            "Contexto",
            {
                "fields": ("campana", "asignatura_grupo", "pregunta"),
            },
        ),
        (
            "Puntuación",
            {
                "fields": ("valor",),
            },
        ),
    )


@admin.register(RegistroVoto)
class RegistroVotoAdmin(admin.ModelAdmin):
    list_display = ("user", "campana", "asignatura_grupo")
    list_filter = ("campana", "asignatura_grupo__grupo")
    search_fields = (
        "user__username",
        "campana__nombre",
        "asignatura_grupo__nombre",
        "asignatura_grupo__profesor__nombre",
        "asignatura_grupo__profesor__apellidos",
    )
    list_select_related = ("campana", "asignatura_grupo", "asignatura_grupo__profesor", "user")

    fieldsets = (
        (
            "Voto",
            {
                "fields": ("user", "campana", "asignatura_grupo"),
            },
        ),
    )
