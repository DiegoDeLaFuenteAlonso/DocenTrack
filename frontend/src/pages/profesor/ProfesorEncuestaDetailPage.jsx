import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import api from '../../api';
import {
  ArrowLeft,
  AlertCircle,
  BarChart3,
  Lock,
  ListOrdered,
  Power,
  Trash2,
} from 'lucide-react';

function estadoInfo(encuesta) {
  const estado =
    encuesta?.estado_publicacion ||
    (encuesta?.finalizada
      ? 'FINALIZADA'
      : encuesta?.activa
        ? 'ACTIVA'
        : 'INACTIVA');
  if (estado === 'FINALIZADA') {
    return {
      label: 'Finalizada',
      className: 'bg-violet-100 text-violet-800',
    };
  }
  if (estado === 'ACTIVA') {
    return {
      label: 'Activa',
      className: 'bg-emerald-100 text-emerald-800',
    };
  }
  return {
    label: 'Inactiva',
    className: 'bg-slate-200 text-slate-700',
  };
}

export default function ProfesorEncuestaDetailPage() {
  const navigate = useNavigate();
  const { encuestaId } = useParams();
  const [encuesta, setEncuesta] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadEncuesta = () =>
    api
      .get(`encuestas-clase/${encuestaId}/`)
      .then((res) => setEncuesta(res.data));

  const loadResumen = () =>
    api
      .get(`encuestas-clase/${encuestaId}/resumen/`)
      .then((res) => setResumen(res.data))
      .catch(() => setResumen(null));

  useEffect(() => {
    setLoading(true);
    Promise.all([loadEncuesta(), loadResumen()])
      .then(() => setError(null))
      .catch(() => setError('No se pudo cargar la encuesta.'))
      .finally(() => setLoading(false));
  }, [encuestaId]);

  const items = encuesta?.items || [];
  const estado = estadoInfo(encuesta);
  const esFinalizada =
    encuesta?.estado_publicacion === 'FINALIZADA' || encuesta?.finalizada;

  const runAction = async (action) => {
    if (!encuesta || actionLoading) return;
    setError(null);
    setActionLoading(true);
    try {
      if (action === 'activate') {
        await api.patch(`encuestas-clase/${encuesta.id}/`, { activa: true });
      } else if (action === 'deactivate') {
        await api.patch(`encuestas-clase/${encuesta.id}/`, { activa: false });
      } else if (action === 'delete') {
        const ok = window.confirm(
          'Esta encuesta se ocultará para todos (borrado lógico). ¿Continuar?',
        );
        if (!ok) {
          setActionLoading(false);
          return;
        }
        await api.delete(`encuestas-clase/${encuesta.id}/`);
        navigate('/profesor/encuestas');
        return;
      }
      await Promise.all([loadEncuesta(), loadResumen()]);
    } catch {
      setError('No se pudo aplicar la acción sobre la encuesta.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
        <p className="text-slate-500">Cargando…</p>
      </div>
    );
  }

  if (error || !encuesta) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3">
        <AlertCircle />
        {error || 'Encuesta no encontrada.'}
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-12 max-w-4xl">
      <Link
        to="/profesor/encuestas"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 font-medium"
      >
        <ArrowLeft size={20} /> Volver a encuestas
      </Link>

      <header className="mb-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
              {encuesta.nombre}
            </h1>
            <p className="text-slate-500">
              {encuesta.fecha_inicio} — {encuesta.fecha_fin}{' '}
              <span
                className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${estado.className}`}
              >
                {estado.label}
              </span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={actionLoading || esFinalizada}
              onClick={() =>
                runAction(encuesta.activa ? 'deactivate' : 'activate')
              }
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
              title={
                esFinalizada
                  ? 'Una encuesta finalizada no puede activarse ni desactivarse.'
                  : ''
              }
            >
              <Power size={16} /> {encuesta.activa ? 'Desactivar' : 'Activar'}
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => runAction('delete')}
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 disabled:opacity-60"
            >
              <Trash2 size={16} /> Ocultar
            </button>
          </div>
        </div>
      </header>

      {resumen?.disponible && (
        <div className="bg-linear-to-br from-indigo-600 to-indigo-800 rounded-2xl p-8 text-white mb-10 shadow-lg">
          <div className="flex items-center gap-2 mb-4 text-indigo-200">
            <BarChart3 size={22} />
            <span className="font-semibold uppercase tracking-wide text-sm">
              Resumen estadístico
            </span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
            <div>
              <p className="text-indigo-200 text-sm">Participantes</p>
              <p className="text-3xl font-bold">{resumen.n_participantes}</p>
            </div>
            <div>
              <p className="text-indigo-200 text-sm">Media global</p>
              <p className="text-3xl font-bold">
                {resumen.media_global != null ? resumen.media_global : '—'}
              </p>
            </div>
          </div>
          {resumen.por_pregunta?.length > 0 && (
            <div className="mt-8 pt-6 border-t border-white/20">
              <p className="text-sm text-indigo-200 mb-3">Por pregunta</p>
              <ul className="space-y-2 text-sm">
                {resumen.por_pregunta.map((row) => (
                  <li
                    key={row.pregunta_id}
                    className="flex justify-between gap-4 bg-white/10 rounded-lg px-3 py-2"
                  >
                    <span className="truncate">{row.texto}</span>
                    <span className="shrink-0 font-mono">
                      {row.media ?? '—'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {resumen && !resumen.disponible && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-10">
          <div className="flex items-start gap-3">
            <Lock size={20} className="text-amber-700 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-900 mb-1">
                {encuesta.estado_publicacion === 'INACTIVA'
                  ? 'Resultados no disponibles'
                  : 'Resultados bloqueados hasta cierre'}
              </p>
              <p className="text-sm text-amber-800">
                {encuesta.estado_publicacion === 'INACTIVA'
                  ? 'La encuesta está inactiva y no finalizada, por lo que no se muestran estadísticas finales.'
                  : 'Esta encuesta solo mostrará métricas cuando se cierre automáticamente: al completar todos los alumnos o al finalizar el plazo.'}
              </p>
              <p className="text-sm text-amber-800 mt-2">
                Participación actual:{' '}
                <span className="font-semibold">{resumen.n_participantes}</span>
                {' / '}
                <span className="font-semibold">{resumen.n_esperados}</span>
              </p>
              {resumen.detail && (
                <p className="text-sm text-amber-900 mt-2">{resumen.detail}</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-6 mb-8">
        <p className="text-sm text-blue-800">
          Las preguntas de esta encuesta quedaron fijadas en el momento de
          creación y no se pueden modificar.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <ListOrdered className="text-indigo-600" size={22} />
          <h2 className="text-lg font-bold text-slate-900">
            Preguntas ({items.length})
          </h2>
        </div>
        {items.length === 0 ? (
          <p className="p-8 text-slate-500 text-center">
            Añade al menos una pregunta para que los alumnos puedan responder.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items
              .slice()
              .sort((a, b) => (a.orden || 0) - (b.orden || 0))
              .map((p, idx) => (
                <li key={p.id} className="px-6 py-4 flex gap-4">
                  <span className="text-indigo-500 font-bold w-8">
                    {p.orden ?? idx + 1}.
                  </span>
                  <p className="text-slate-800 flex-1">{p.texto}</p>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
