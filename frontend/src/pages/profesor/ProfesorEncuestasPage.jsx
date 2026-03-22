import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { DOCENTRACK_REFRESH } from '../../utils/docentrackEvents';
import { ClipboardList, ChevronRight, AlertCircle, Filter, ChevronDown, ChevronUp } from 'lucide-react';

export default function ProfesorEncuestasPage() {
  const [encuestas, setEncuestas] = useState([]);
  const [clasesMap, setClasesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [filtroActiva, setFiltroActiva] = useState('todas');
  const [claseFilter, setClaseFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [showFilters, setShowFilters] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    const params = {};
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;
    if (ordering) params.ordering = ordering;
    Promise.all([api.get('encuestas-clase/', { params }), api.get('mis-clases/')])
      .then(([eRes, cRes]) => {
        const list = Array.isArray(eRes.data) ? eRes.data : eRes.data.results || [];
        setEncuestas(list);
        const clases = Array.isArray(cRes.data) ? cRes.data : cRes.data.results || [];
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

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const h = () => load();
    window.addEventListener(DOCENTRACK_REFRESH, h);
    return () => window.removeEventListener(DOCENTRACK_REFRESH, h);
  }, [load]);

  const filtradas = useMemo(() => {
    return encuestas.filter((e) => {
      if (q && !e.nombre?.toLowerCase().includes(q.toLowerCase())) return false;
      if (filtroActiva === 'activa' && !e.activa) return false;
      if (filtroActiva === 'inactiva' && e.activa) return false;
      if (claseFilter && String(e.asignatura_grupo) !== claseFilter) return false;
      return true;
    });
  }, [encuestas, q, filtroActiva, claseFilter]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
        <p className="text-slate-500">Cargando encuestas…</p>
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
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Mis encuestas</h1>
        <p className="text-slate-500 text-lg">Todas las encuestas que has creado en tus clases.</p>
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
        <div className={`${showFilters ? 'grid' : 'hidden'} md:grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4`}>
          <input
            type="search"
            placeholder="Buscar por nombre…"
            className="border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="border border-slate-200 rounded-xl px-4 py-2.5 bg-white"
            value={filtroActiva}
            onChange={(e) => setFiltroActiva(e.target.value)}
          >
            <option value="todas">Estado: todas</option>
            <option value="activa">Solo activas</option>
            <option value="inactiva">Solo inactivas</option>
          </select>
          <select
            className="border border-slate-200 rounded-xl px-4 py-2.5 bg-white"
            value={claseFilter}
            onChange={(e) => setClaseFilter(e.target.value)}
          >
            <option value="">Todas las clases</option>
            {claseOptions.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.nombre} — {c.curso}
              </option>
            ))}
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

      {filtradas.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-12 text-center border border-slate-200 text-slate-600">
          No hay encuestas. Crea una con el botón +.
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((e) => {
            const c = clasesMap[e.asignatura_grupo];
            return (
              <Link
                key={e.id}
                to={`/profesor/encuestas/${e.id}`}
                className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl shrink-0">
                    <ClipboardList size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">{e.nombre}</p>
                    <p className="text-sm text-slate-500 truncate">
                      {c ? `${c.nombre} · ${c.curso}` : `Clase #${e.asignatura_grupo}`} ·{' '}
                      {e.fecha_inicio} — {e.fecha_fin}
                    </p>
                  </div>
                </div>
                <ChevronRight className="text-slate-400 shrink-0 group-hover:text-indigo-600" />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
