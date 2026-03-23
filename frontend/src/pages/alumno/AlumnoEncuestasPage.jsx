import { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import {
  ClipboardList,
  ChevronRight,
  AlertCircle,
  Filter,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { encuestaEnPlazo } from '../../utils/surveyDates';

export default function AlumnoEncuestasPage() {
  const [encuestas, setEncuestas] = useState([]);
  const [clasesMap, setClasesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [claseFilter, setClaseFilter] = useState('');
  const [estado, setEstado] = useState('todas');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;
    if (ordering) params.ordering = ordering;
    Promise.all([
      api.get('encuestas-clase/', { params }),
      api.get('mis-clases/'),
    ])
      .then(([eRes, cRes]) => {
        const list = Array.isArray(eRes.data)
          ? eRes.data
          : eRes.data.results || [];
        setEncuestas(list);
        const clases = Array.isArray(cRes.data)
          ? cRes.data
          : cRes.data.results || [];
        const m = {};
        clases.forEach((c) => {
          m[c.id] = c;
        });
        setClasesMap(m);
        setError(null);
      })
      .catch(() => setError('No se pudieron cargar las encuestas.'))
      .finally(() => setLoading(false));
  }, [fromDate, toDate, ordering]);

  const filtradas = useMemo(() => {
    return encuestas.filter((e) => {
      if (q && !e.nombre?.toLowerCase().includes(q.toLowerCase())) return false;
      if (claseFilter && String(e.asignatura_grupo) !== claseFilter)
        return false;
      const enPlazo = encuestaEnPlazo(e);
      const pendiente = !e.ya_respondido && enPlazo;
      if (estado === 'pendientes' && !pendiente) return false;
      if (estado === 'hechas' && !e.ya_respondido) return false;
      if (estado === 'medias' && e.estado_encuesta !== 'EN_CURSO') return false;
      return true;
    });
  }, [encuestas, q, claseFilter, estado]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
        <p className="text-slate-500">Cargando…</p>
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

  const claseOptions = Object.values(clasesMap);

  return (
    <div className="animate-fade-in pb-12">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          Encuestas
        </h1>
        <p className="text-slate-500 text-lg">Listado completo con estado.</p>
      </header>

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
        <div
          className="flex items-center justify-between text-slate-700 font-semibold mb-4 cursor-pointer md:cursor-auto"
          onClick={() => setShowFilters(!showFilters)}
        >
          <div className="flex items-center gap-2">
            <Filter size={18} /> Filtros
          </div>
          <div className="md:hidden">
            {showFilters ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
        <div
          className={`${showFilters ? 'grid' : 'hidden'} md:grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4`}
        >
          <input
            type="search"
            placeholder="Buscar…"
            className="border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="border border-slate-200 rounded-xl px-4 py-2.5 bg-white"
            value={claseFilter}
            onChange={(e) => setClaseFilter(e.target.value)}
          >
            <option value="">Todas las clases</option>
            {claseOptions.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.nombre}
              </option>
            ))}
          </select>
          <select
            className="border border-slate-200 rounded-xl px-4 py-2.5 bg-white"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="todas">Todas</option>
            <option value="pendientes">Pendientes</option>
            <option value="medias">A medias</option>
            <option value="hechas">Realizadas</option>
          </select>
          <input
            type="date"
            className="border border-slate-200 rounded-xl px-4 py-2.5 bg-white"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
          />
          <input
            type="date"
            className="border border-slate-200 rounded-xl px-4 py-2.5 bg-white"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
          />
          <select
            className="border border-slate-200 rounded-xl px-4 py-2.5 bg-white"
            value={ordering}
            onChange={(e) => setOrdering(e.target.value)}
          >
            <option value="-created_at">Mas recientes</option>
            <option value="created_at">Mas antiguas</option>
            <option value="-fecha_inicio">Inicio (desc)</option>
            <option value="fecha_inicio">Inicio (asc)</option>
            <option value="-fecha_fin">Fin (desc)</option>
            <option value="fecha_fin">Fin (asc)</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filtradas.map((e) => {
          const c = clasesMap[e.asignatura_grupo];
          const estadoPublicacion =
            e.estado_publicacion ||
            (e.finalizada ? 'FINALIZADA' : e.activa ? 'ACTIVA' : 'INACTIVA');
          const enPlazo = encuestaEnPlazo(e);
          const puedeResponder =
            estadoPublicacion === 'ACTIVA' && !e.ya_respondido && enPlazo;
          const puedeVer =
            e.ya_respondido ||
            estadoPublicacion === 'FINALIZADA' ||
            puedeResponder;
          return (
            <div
              key={e.id}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white rounded-xl border border-slate-200 p-5"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl shrink-0">
                  <ClipboardList size={22} />
                </div>
                <div className="min-w-0">
                  <p className="font-bold text-slate-900 truncate">
                    {e.nombre}
                  </p>
                  <p className="text-sm text-slate-500 truncate">
                    {c?.nombre} · {e.fecha_inicio} — {e.fecha_fin}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {e.ya_respondido ? (
                  <span className="flex items-center gap-1 text-emerald-700 text-sm font-medium">
                    <CheckCircle size={18} /> Hecha
                  </span>
                ) : e.estado_encuesta === 'EN_CURSO' ? (
                  <span className="text-amber-700 text-sm font-medium">
                    A medias
                  </span>
                ) : (
                  <span className="text-amber-700 text-sm font-medium">
                    Pendiente
                  </span>
                )}
                {puedeVer && (
                  <Link
                    to={`/alumno/encuestas/${e.id}`}
                    className="inline-flex items-center gap-1 px-4 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700"
                  >
                    {puedeResponder ? 'Responder' : 'Ver'}
                    <ChevronRight size={16} />
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {filtradas.length === 0 && (
        <p className="text-center text-slate-500 mt-10">No hay resultados.</p>
      )}
    </div>
  );
}
