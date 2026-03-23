import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { DOCENTRACK_REFRESH } from '../../utils/docentrackEvents';
import {
  ClipboardList,
  ChevronRight,
  AlertCircle,
  Filter,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  Power,
  Trash2,
  Settings2,
} from 'lucide-react';

function statusInfo(encuesta) {
  const estado =
    encuesta.estado_publicacion ||
    (encuesta.finalizada
      ? 'FINALIZADA'
      : encuesta.activa
        ? 'ACTIVA'
        : 'INACTIVA');
  if (estado === 'FINALIZADA') {
    return {
      label: 'Finalizada',
      className: 'bg-violet-100 text-violet-800 border border-violet-200',
    };
  }
  if (estado === 'ACTIVA') {
    return {
      label: 'Activa',
      className: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
    };
  }
  return {
    label: 'Inactiva',
    className: 'bg-slate-100 text-slate-700 border border-slate-200',
  };
}

export default function ProfesorEncuestasPage() {
  const [encuestas, setEncuestas] = useState([]);
  const [clasesMap, setClasesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [q, setQ] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [claseFilter, setClaseFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [ordering, setOrdering] = useState('-created_at');
  const [showFilters, setShowFilters] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);

  const load = useCallback(() => {
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
      const estado =
        e.estado_publicacion ||
        (e.finalizada ? 'FINALIZADA' : e.activa ? 'ACTIVA' : 'INACTIVA');
      if (filtroEstado === 'activa' && estado !== 'ACTIVA') return false;
      if (filtroEstado === 'inactiva' && estado !== 'INACTIVA') return false;
      if (filtroEstado === 'finalizada' && estado !== 'FINALIZADA')
        return false;
      if (claseFilter && String(e.asignatura_grupo) !== claseFilter)
        return false;
      return true;
    });
  }, [encuestas, q, filtroEstado, claseFilter]);

  const selectedSet = useMemo(() => new Set(selectedIds), [selectedIds]);
  const selectedById = useMemo(() => {
    const map = {};
    encuestas.forEach((e) => {
      map[e.id] = e;
    });
    return map;
  }, [encuestas]);
  const selectedMutablesCount = useMemo(
    () =>
      selectedIds.filter((id) => {
        const e = selectedById[id];
        return e && e.estado_publicacion !== 'FINALIZADA' && !e.finalizada;
      }).length,
    [selectedIds, selectedById],
  );
  const allFilteredSelected =
    filtradas.length > 0 && filtradas.every((e) => selectedSet.has(e.id));

  const toggleSelect = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !filtradas.some((e) => e.id === id)),
      );
      return;
    }
    const idsToAdd = filtradas
      .map((e) => e.id)
      .filter((id) => !selectedSet.has(id));
    setSelectedIds((prev) => [...prev, ...idsToAdd]);
  };

  const runAction = async (ids, action, isSingle = false) => {
    if (ids.length === 0 || actionLoading) return;
    if (action === 'delete') {
      const ok = window.confirm(
        'Las encuestas seleccionadas se ocultarán para todos (borrado lógico). ¿Continuar?',
      );
      if (!ok) return;
    }
    setActionLoading(true);
    try {
      await api.post('encuestas-clase/bulk-action/', {
        encuesta_ids: ids,
        action,
      });
      if (!isSingle) setSelectedIds([]);
      await load();
    } catch {
      setError(
        isSingle
          ? 'No se pudo aplicar la acción en la encuesta.'
          : 'No se pudo aplicar la acción masiva.',
      );
    } finally {
      setActionLoading(false);
    }
  };

  const applyBulkAction = async (action) =>
    runAction(selectedIds, action, false);
  const applySingleAction = async (id, action) => runAction([id], action, true);

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
      <header className="mb-8 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
            Mis encuestas
          </h1>
          <p className="text-slate-500 text-lg">
            Todas las encuestas que has creado en tus clases.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setEditMode((v) => !v);
            setSelectedIds([]);
          }}
          className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border font-semibold transition-colors ${
            editMode
              ? 'bg-slate-900 text-white border-slate-900'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Settings2 size={18} />{' '}
          {editMode ? 'Salir de edición' : 'Modo edición'}
        </button>
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
            placeholder="Buscar por nombre…"
            className="border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
          <select
            className="border border-slate-200 rounded-xl px-4 py-2.5 bg-white"
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
          >
            <option value="todas">Estado: todas</option>
            <option value="activa">Solo activas</option>
            <option value="inactiva">Solo inactivas</option>
            <option value="finalizada">Solo finalizadas</option>
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

      {editMode && filtradas.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-sm flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={toggleSelectAllFiltered}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            {allFilteredSelected ? (
              <CheckSquare size={16} />
            ) : (
              <Square size={16} />
            )}
            {allFilteredSelected
              ? 'Deseleccionar visibles'
              : 'Seleccionar visibles'}
          </button>
          <span className="text-sm text-slate-600">
            Seleccionadas: {selectedIds.length}
          </span>
          <div className="ml-auto flex flex-wrap gap-2">
            <button
              type="button"
              disabled={selectedMutablesCount === 0 || actionLoading}
              onClick={() => applyBulkAction('activate')}
              title={
                selectedMutablesCount === 0
                  ? 'No hay encuestas seleccionadas que puedan activarse.'
                  : ''
              }
              className="px-3 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-50"
            >
              Activar
            </button>
            <button
              type="button"
              disabled={selectedMutablesCount === 0 || actionLoading}
              onClick={() => applyBulkAction('deactivate')}
              title={
                selectedMutablesCount === 0
                  ? 'No hay encuestas seleccionadas que puedan desactivarse.'
                  : ''
              }
              className="px-3 py-2 rounded-lg bg-amber-600 text-white disabled:opacity-50"
            >
              Desactivar
            </button>
            <button
              type="button"
              disabled={selectedIds.length === 0 || actionLoading}
              onClick={() => applyBulkAction('delete')}
              className="px-3 py-2 rounded-lg bg-rose-600 text-white disabled:opacity-50"
            >
              Ocultar (borrado lógico)
            </button>
          </div>
        </div>
      )}

      {filtradas.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-12 text-center border border-slate-200 text-slate-600">
          No hay encuestas visibles con esos filtros.
        </div>
      ) : (
        <div className="space-y-3">
          {filtradas.map((e) => {
            const c = clasesMap[e.asignatura_grupo];
            const s = statusInfo(e);
            return (
              <div
                key={e.id}
                className={`flex items-center justify-between bg-white rounded-xl border p-4 transition-all ${
                  selectedSet.has(e.id)
                    ? 'border-indigo-300 ring-1 ring-indigo-200'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {editMode && (
                    <button
                      type="button"
                      onClick={() => toggleSelect(e.id)}
                      className="text-slate-500 hover:text-indigo-600"
                      aria-label={
                        selectedSet.has(e.id)
                          ? 'Deseleccionar encuesta'
                          : 'Seleccionar encuesta'
                      }
                    >
                      {selectedSet.has(e.id) ? (
                        <CheckSquare size={20} />
                      ) : (
                        <Square size={20} />
                      )}
                    </button>
                  )}
                  <div className="bg-indigo-50 text-indigo-600 p-3 rounded-xl shrink-0">
                    <ClipboardList size={22} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-slate-900 truncate">
                      {e.nombre}
                    </p>
                    <p className="text-sm text-slate-500 truncate">
                      {c
                        ? `${c.nombre} · ${c.curso}`
                        : `Clase #${e.asignatura_grupo}`}{' '}
                      · {e.fecha_inicio} — {e.fecha_fin}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${s.className}`}
                  >
                    {s.label}
                  </span>
                  {!editMode && (
                    <Link
                      to={`/profesor/encuestas/${e.id}`}
                      className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-semibold text-sm"
                    >
                      Ver <ChevronRight size={16} />
                    </Link>
                  )}
                  {editMode && (
                    <div className="flex gap-1">
                      {(() => {
                        const esFinalizada =
                          e.estado_publicacion === 'FINALIZADA' || e.finalizada;
                        return (
                          <button
                            type="button"
                            onClick={() =>
                              applySingleAction(
                                e.id,
                                e.activa ? 'deactivate' : 'activate',
                              )
                            }
                            className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            title={
                              esFinalizada
                                ? 'Una encuesta finalizada no puede activarse ni desactivarse.'
                                : e.activa
                                  ? 'Desactivar'
                                  : 'Activar'
                            }
                            disabled={actionLoading || esFinalizada}
                          >
                            <Power size={16} />
                          </button>
                        );
                      })()}
                      <button
                        type="button"
                        onClick={() => applySingleAction(e.id, 'delete')}
                        className="p-2 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50"
                        title="Ocultar"
                        disabled={actionLoading}
                      >
                        <Trash2 size={16} />
                      </button>
                      <Link
                        to={`/profesor/encuestas/${e.id}`}
                        className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                        title="Abrir detalle"
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
