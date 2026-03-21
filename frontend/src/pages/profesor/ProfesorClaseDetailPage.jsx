import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api';
import { DOCENTRACK_REFRESH } from '../../utils/docentrackEvents';
import { ArrowLeft, ClipboardList, ChevronRight, AlertCircle, Filter } from 'lucide-react';

export default function ProfesorClaseDetailPage() {
  const { claseId } = useParams();
  const [clase, setClase] = useState(null);
  const [encuestas, setEncuestas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [q, setQ] = useState('');
  const [filtroActiva, setFiltroActiva] = useState('todas');
  const [desde, setDesde] = useState('');
  const [hasta, setHasta] = useState('');

  const load = useCallback(() => {
    setLoading(true);
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
      .catch(() => setError('No se pudo cargar la clase o las encuestas.'))
      .finally(() => setLoading(false));
  }, [claseId]);

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
      if (desde && e.fecha_fin < desde) return false;
      if (hasta && e.fecha_inicio > hasta) return false;
      return true;
    });
  }, [encuestas, q, filtroActiva, desde, hasta]);

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
        to="/profesor/clases"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <input
            type="search"
            placeholder="Buscar por nombre…"
            className="border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            value={filtroActiva}
            onChange={(e) => setFiltroActiva(e.target.value)}
          >
            <option value="todas">Todas (activa/inactiva)</option>
            <option value="activa">Solo activas</option>
            <option value="inactiva">Solo inactivas</option>
          </select>
          <input
            type="date"
            className="border border-slate-200 rounded-xl px-4 py-2.5"
            value={desde}
            onChange={(e) => setDesde(e.target.value)}
            title="Encuestas que terminan en o después de"
          />
          <input
            type="date"
            className="border border-slate-200 rounded-xl px-4 py-2.5"
            value={hasta}
            onChange={(e) => setHasta(e.target.value)}
            title="Encuestas que empiezan en o antes de"
          />
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-800 mb-4">Encuestas de esta clase</h2>

      {filtradas.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-10 text-center border border-slate-200 text-slate-600">
          No hay encuestas con estos filtros. Crea una con el botón +.
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((e) => (
            <Link
              key={e.id}
              to={`/profesor/encuestas/${e.id}`}
              className="flex items-center justify-between bg-white rounded-xl border border-slate-200 p-5 hover:border-indigo-300 hover:shadow-md transition-all group"
            >
              <div className="flex items-center gap-4">
                <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl">
                  <ClipboardList size={22} />
                </div>
                <div>
                  <p className="font-bold text-slate-900">{e.nombre}</p>
                  <p className="text-sm text-slate-500">
                    {e.fecha_inicio} → {e.fecha_fin}{' '}
                    <span
                      className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                        e.activa ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {e.activa ? 'Activa' : 'Inactiva'}
                    </span>
                  </p>
                </div>
              </div>
              <ChevronRight className="text-slate-400 group-hover:text-indigo-600" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
