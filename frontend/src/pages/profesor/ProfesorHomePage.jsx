import { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  BookOpen,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  GraduationCap,
  History,
  Sparkles,
} from 'lucide-react';
import api from '../../api';
import { AuthContext } from '../../context/AuthContext';
import { DOCENTRACK_REFRESH } from '../../utils/docentrackEvents';
import { asList } from '../../utils/apiList';
import { getProfesorRecentClaseIds } from '../../utils/profesorActivity';

function daysUntil(dateIso) {
  const end = new Date(`${dateIso}T00:00:00`);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffMs = end.getTime() - today.getTime();
  return Math.ceil(diffMs / 86400000);
}

export default function ProfesorHomePage() {
  const { user } = useContext(AuthContext);
  const [clases, setClases] = useState([]);
  const [encuestas, setEncuestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([api.get('mis-clases/'), api.get('encuestas-clase/')])
      .then(([clasesRes, encuestasRes]) => {
        setClases(asList(clasesRes.data));
        setEncuestas(asList(encuestasRes.data));
        setError(null);
      })
      .catch(() => setError('No se pudo cargar el inicio del profesor.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const h = () => load();
    window.addEventListener(DOCENTRACK_REFRESH, h);
    return () => window.removeEventListener(DOCENTRACK_REFRESH, h);
  }, [load]);

  const clasesMap = useMemo(() => {
    const map = new Map();
    clases.forEach((clase) => map.set(clase.id, clase));
    return map;
  }, [clases]);

  const ultimasClasesVisitadas = useMemo(() => {
    const ids = getProfesorRecentClaseIds(5);
    return ids.map((id) => clasesMap.get(id)).filter(Boolean);
  }, [clasesMap]);

  const ultimasEncuestasCreadas = useMemo(() => {
    return [...encuestas]
      .sort((a, b) =>
        String(b.created_at || '').localeCompare(String(a.created_at || '')),
      )
      .slice(0, 5);
  }, [encuestas]);

  const encuestasActivas = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return encuestas.filter(
      (e) => e.activa && e.fecha_inicio <= today && today <= e.fecha_fin,
    );
  }, [encuestas]);

  const cierreProximo = useMemo(() => {
    return [...encuestasActivas]
      .map((e) => ({ ...e, diasRestantes: daysUntil(e.fecha_fin) }))
      .filter((e) => e.diasRestantes >= 0)
      .sort((a, b) => a.diasRestantes - b.diasRestantes)
      .slice(0, 4);
  }, [encuestasActivas]);

  const ultimasEncuestasCompletadas = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return [...encuestas]
      .filter((e) => !e.activa)
      .map((e) => ({
        ...e,
        motivo:
          e.fecha_fin < today
            ? 'Completada por plazo'
            : 'Completada por respuestas',
      }))
      .sort((a, b) =>
        String(b.fecha_fin || '').localeCompare(String(a.fecha_fin || '')),
      )
      .slice(0, 5);
  }, [encuestas]);

  const totalEncuestasCerradas = useMemo(
    () => encuestas.filter((e) => !e.activa).length,
    [encuestas],
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
        <p className="text-slate-500">Cargando inicio del profesor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3">
        <AlertCircle />
        {error}
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-12 space-y-8">
      <header className="bg-linear-to-br from-indigo-700 via-indigo-700 to-sky-700 rounded-3xl px-8 py-8 md:px-10 md:py-10 text-white shadow-lg">
        <p className="text-indigo-200 font-semibold tracking-wide uppercase text-xs mb-2">
          Panel del profesor
        </p>
        <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2">
          Hola, {user?.first_name || user?.username || 'profe'}
        </h1>
        <p className="text-indigo-100 text-base md:text-lg max-w-3xl">
          Bienvenido a tu centro de operaciones. Desde aqui puedes retomar tus
          clases, revisar encuestas recientes y controlar lo que vence esta
          semana.
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-2">
            Total de clases
          </p>
          <p className="text-3xl font-extrabold text-slate-900">
            {clases.length}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-2">
            Encuestas creadas
          </p>
          <p className="text-3xl font-extrabold text-slate-900">
            {encuestas.length}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-2">
            Encuestas activas
          </p>
          <p className="text-3xl font-extrabold text-emerald-600">
            {encuestasActivas.length}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-2">
            Encuestas cerradas
          </p>
          <p className="text-3xl font-extrabold text-fuchsia-600">
            {totalEncuestasCerradas}
          </p>
        </div>
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-2">
            Cierres proximos (7 dias)
          </p>
          <p className="text-3xl font-extrabold text-amber-600">
            {cierreProximo.filter((e) => e.diasRestantes <= 7).length}
          </p>
        </div>
      </section>

      <section className="grid grid-cols-1 xl:grid-cols-4 gap-6">
        <article className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm xl:col-span-1">
          <div className="flex items-center gap-2 text-slate-800 font-semibold mb-4">
            <History size={18} /> Ultimas clases visitadas
          </div>
          {ultimasClasesVisitadas.length === 0 ? (
            <p className="text-slate-500 text-sm">
              Aun no hay clases visitadas recientemente. Entra en una clase y
              aparecera aqui.
            </p>
          ) : (
            <div className="space-y-3">
              {ultimasClasesVisitadas.map((clase) => (
                <Link
                  key={clase.id}
                  to={`/profesor/clases/${clase.id}`}
                  className="block rounded-xl border border-slate-200 p-3 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
                >
                  <p className="font-semibold text-slate-900">{clase.nombre}</p>
                  <p className="text-sm text-slate-500">
                    {clase.curso} · Grupo {clase.grupo}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </article>

        <article className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm xl:col-span-1">
          <div className="flex items-center gap-2 text-slate-800 font-semibold mb-4">
            <ClipboardList size={18} /> Ultimas encuestas creadas
          </div>
          {ultimasEncuestasCreadas.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No has creado encuestas todavia.
            </p>
          ) : (
            <div className="space-y-3">
              {ultimasEncuestasCreadas.map((encuesta) => {
                const clase = clasesMap.get(encuesta.asignatura_grupo);
                return (
                  <Link
                    key={encuesta.id}
                    to={`/profesor/encuestas/${encuesta.id}`}
                    className="block rounded-xl border border-slate-200 p-3 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
                  >
                    <p className="font-semibold text-slate-900">
                      {encuesta.nombre}
                    </p>
                    <p className="text-sm text-slate-500 truncate">
                      {clase
                        ? `${clase.nombre} · ${clase.curso}`
                        : `Clase #${encuesta.asignatura_grupo}`}
                    </p>
                  </Link>
                );
              })}
            </div>
          )}
        </article>

        <article className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm xl:col-span-1">
          <div className="flex items-center gap-2 text-slate-800 font-semibold mb-4">
            <CheckCircle2 size={18} /> Ultimas encuestas completadas
          </div>
          {ultimasEncuestasCompletadas.length === 0 ? (
            <p className="text-slate-500 text-sm">
              Aun no hay encuestas completadas por plazo o por respuestas del
              alumnado.
            </p>
          ) : (
            <div className="space-y-3">
              {ultimasEncuestasCompletadas.map((encuesta) => (
                <Link
                  key={encuesta.id}
                  to={`/profesor/encuestas/${encuesta.id}`}
                  className="block rounded-xl border border-emerald-200 bg-emerald-50 p-3 hover:bg-emerald-100/80 transition-colors"
                >
                  <p className="font-semibold text-emerald-900">
                    {encuesta.nombre}
                  </p>
                  <p className="text-sm text-emerald-800">{encuesta.motivo}</p>
                  <p className="text-xs text-emerald-700 mt-1">
                    Fecha cierre: {encuesta.fecha_fin}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </article>

        <article className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm xl:col-span-1">
          <div className="flex items-center gap-2 text-slate-800 font-semibold mb-4">
            <CalendarClock size={18} /> Cierres proximos
          </div>
          {cierreProximo.length === 0 ? (
            <p className="text-slate-500 text-sm">
              No hay encuestas activas con fecha de cierre pendiente.
            </p>
          ) : (
            <div className="space-y-3">
              {cierreProximo.map((encuesta) => (
                <Link
                  key={encuesta.id}
                  to={`/profesor/encuestas/${encuesta.id}`}
                  className="block rounded-xl border border-amber-200 bg-amber-50 p-3 hover:bg-amber-100/80 transition-colors"
                >
                  <p className="font-semibold text-amber-900">
                    {encuesta.nombre}
                  </p>
                  <p className="text-sm text-amber-800">
                    Cierra en {encuesta.diasRestantes}{' '}
                    {encuesta.diasRestantes === 1 ? 'dia' : 'dias'}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </article>
      </section>

      <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
        <div className="flex items-center gap-2 text-slate-800 font-semibold mb-4">
          <Sparkles size={18} /> Acciones rapidas
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Link
            to="/profesor/clases"
            className="group flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
          >
            <span className="inline-flex items-center gap-2 text-slate-700 font-medium">
              <BookOpen size={18} /> Ir a mis clases
            </span>
            <ArrowRight
              size={16}
              className="text-slate-400 group-hover:text-indigo-600"
            />
          </Link>
          <Link
            to="/profesor/encuestas"
            className="group flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
          >
            <span className="inline-flex items-center gap-2 text-slate-700 font-medium">
              <ClipboardList size={18} /> Gestionar encuestas
            </span>
            <ArrowRight
              size={16}
              className="text-slate-400 group-hover:text-indigo-600"
            />
          </Link>
          <Link
            to="/profesor/dashboard"
            className="group flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
          >
            <span className="inline-flex items-center gap-2 text-slate-700 font-medium">
              <GraduationCap size={18} /> Ver analitica global
            </span>
            <ArrowRight
              size={16}
              className="text-slate-400 group-hover:text-indigo-600"
            />
          </Link>
        </div>
      </section>
    </div>
  );
}
