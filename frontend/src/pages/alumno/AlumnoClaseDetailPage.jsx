import { useState, useEffect, useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api';
import { ArrowLeft, ClipboardList, ChevronRight, AlertCircle, Filter, CheckCircle } from 'lucide-react';
import { encuestaEnPlazo } from '../../utils/surveyDates';

export default function AlumnoClaseDetailPage() {
  const { claseId } = useParams();
  const [clase, setClase] = useState(null);
  const [encuestas, setEncuestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [estado, setEstado] = useState('todas');

  useEffect(() => {
    setLoading(true);
    api.post(`clases/${claseId}/visita/`).catch(() => {});
    Promise.all([
      api.get(`asignaturas/${claseId}/`),
      api.get('encuestas-clase/', { params: { asignatura_grupo: claseId } }),
    ])
      .then(([cRes, eRes]) => {
        setClase(cRes.data);
        const list = Array.isArray(eRes.data) ? eRes.data : eRes.data.results || [];
        setEncuestas(list);
        setError(null);
      })
      .catch(() => setError('No se pudo cargar la clase.'))
      .finally(() => setLoading(false));
  }, [claseId]);

  const filtradas = useMemo(() => {
    return encuestas.filter((e) => {
      if (q && !e.nombre?.toLowerCase().includes(q.toLowerCase())) return false;
      const enPlazo = encuestaEnPlazo(e);
      const pendiente = !e.ya_respondido && enPlazo;
      if (estado === 'pendientes' && !pendiente) return false;
      if (estado === 'hechas' && !e.ya_respondido) return false;
      return true;
    });
  }, [encuestas, q, estado]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
        <p className="text-slate-500">Cargando…</p>
      </div>
    );
  }

  if (error || !clase) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3">
        <AlertCircle />
        {error || 'Clase no encontrada.'}
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-12">
      <Link
        to="/alumno/clases"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 font-medium"
      >
        <ArrowLeft size={20} /> Volver a mis clases
      </Link>

      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">{clase.nombre}</h1>
        <p className="text-slate-500 text-lg">
          {clase.curso} · Grupo {clase.grupo}
        </p>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
        <div className="flex items-center gap-2 text-slate-700 font-semibold mb-4">
          <Filter size={18} /> Filtros
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            type="search"
            placeholder="Buscar encuesta…"
            className="border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="border border-slate-200 rounded-xl px-4 py-2.5 bg-white"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="todas">Todas</option>
            <option value="pendientes">Pendientes (en plazo)</option>
            <option value="hechas">Ya realizadas</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filtradas.map((e) => {
          const enPlazo = encuestaEnPlazo(e);
          const puedeHacer = !e.ya_respondido && enPlazo;
          return (
            <div
              key={e.id}
              className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col"
            >
              <div className="flex items-start justify-between mb-2">
                <ClipboardList className="text-indigo-600" size={24} />
                {e.ya_respondido ? (
                  <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-1 rounded-full font-medium">
                    Hecha
                  </span>
                ) : e.estado_encuesta === 'EN_CURSO' ? (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
                    A medias
                  </span>
                ) : (
                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
                    Pendiente
                  </span>
                )}
              </div>
              <h3 className="font-bold text-slate-900 text-lg mb-1">{e.nombre}</h3>
              <p className="text-sm text-slate-500 mb-4">
                {e.fecha_inicio} — {e.fecha_fin}
              </p>
              <div className="mt-auto pt-3 border-t border-slate-100">
                {e.ya_respondido ? (
                  <div className="flex items-center gap-2 text-emerald-700 text-sm font-medium">
                    <CheckCircle size={18} /> Completada
                  </div>
                ) : puedeHacer ? (
                  <Link
                    to={`/alumno/encuestas/${e.id}`}
                    className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white font-medium rounded-xl py-2.5 hover:bg-indigo-700"
                  >
                    Responder <ChevronRight size={18} />
                  </Link>
                ) : (
                  <p className="text-slate-500 text-sm text-center">No disponible</p>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtradas.length === 0 && (
        <p className="text-center text-slate-500 mt-8">No hay encuestas con estos filtros.</p>
      )}
    </div>
  );
}
