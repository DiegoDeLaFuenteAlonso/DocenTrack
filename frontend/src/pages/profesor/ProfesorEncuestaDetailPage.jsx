import { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api';
import {
  ArrowLeft,
  AlertCircle,
  BarChart3,
  Plus,
  ListOrdered,
} from 'lucide-react';

export default function ProfesorEncuestaDetailPage() {
  const { encuestaId } = useParams();
  const [encuesta, setEncuesta] = useState(null);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [textoP, setTextoP] = useState('');
  const [ordenP, setOrdenP] = useState('');
  const [adding, setAdding] = useState(false);
  const [addErr, setAddErr] = useState('');

  const loadEncuesta = () =>
    api.get(`encuestas-clase/${encuestaId}/`).then((res) => setEncuesta(res.data));

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
  const nextOrden =
    ordenP === ''
      ? (items.length ? Math.max(...items.map((i) => i.orden || 0)) + 1 : 1)
      : Number(ordenP);

  const handleAddPregunta = async (e) => {
    e.preventDefault();
    setAddErr('');
    if (!textoP.trim()) {
      setAddErr('Escribe el texto de la pregunta.');
      return;
    }
    setAdding(true);
    const ordenToSend = ordenP === '' ? nextOrden : Number(ordenP);
    try {
      await api.post('encuesta-preguntas/', {
        encuesta: Number(encuestaId),
        texto: textoP.trim(),
        orden: ordenToSend,
      });
      setTextoP('');
      setOrdenP('');
      await loadEncuesta();
      await loadResumen();
    } catch (err) {
      const d = err.response?.data;
      setAddErr(typeof d === 'string' ? d : d?.detail || 'Error al añadir.');
    } finally {
      setAdding(false);
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
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">{encuesta.nombre}</h1>
        <p className="text-slate-500">
          {encuesta.fecha_inicio} — {encuesta.fecha_fin}{' '}
          <span
            className={`ml-2 px-2 py-0.5 rounded-full text-xs font-semibold ${
              encuesta.activa ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'
            }`}
          >
            {encuesta.activa ? 'Activa' : 'Inactiva'}
          </span>
        </p>
      </header>

      {resumen && (
        <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl p-8 text-white mb-10 shadow-lg">
          <div className="flex items-center gap-2 mb-4 text-indigo-200">
            <BarChart3 size={22} />
            <span className="font-semibold uppercase tracking-wide text-sm">Resumen estadístico</span>
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
                  <li key={row.pregunta_id} className="flex justify-between gap-4 bg-white/10 rounded-lg px-3 py-2">
                    <span className="truncate">{row.texto}</span>
                    <span className="shrink-0 font-mono">{row.media ?? '—'}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
          <Plus size={20} className="text-indigo-600" />
          Añadir pregunta
        </h2>
        {addErr && (
          <div className="mb-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {addErr}
          </div>
        )}
        <form onSubmit={handleAddPregunta} className="space-y-4">
          <textarea
            className="w-full border border-slate-200 rounded-xl px-4 py-3 min-h-[100px] focus:ring-2 focus:ring-indigo-500 outline-none"
            placeholder="Texto de la pregunta"
            value={textoP}
            onChange={(e) => setTextoP(e.target.value)}
          />
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1">Orden (opcional)</label>
              <input
                type="number"
                min={1}
                className="border border-slate-200 rounded-xl px-4 py-2 w-28"
                placeholder={`Auto: ${nextOrden}`}
                value={ordenP}
                onChange={(e) => setOrdenP(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={adding}
              className="px-6 py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60"
            >
              {adding ? 'Guardando…' : 'Añadir pregunta'}
            </button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-2">
          <ListOrdered className="text-indigo-600" size={22} />
          <h2 className="text-lg font-bold text-slate-900">Preguntas ({items.length})</h2>
        </div>
        {items.length === 0 ? (
          <p className="p-8 text-slate-500 text-center">Añade al menos una pregunta para que los alumnos puedan responder.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {items
              .slice()
              .sort((a, b) => (a.orden || 0) - (b.orden || 0))
              .map((p, idx) => (
                <li key={p.id} className="px-6 py-4 flex gap-4">
                  <span className="text-indigo-500 font-bold w-8">{p.orden ?? idx + 1}.</span>
                  <p className="text-slate-800 flex-1">{p.texto}</p>
                </li>
              ))}
          </ul>
        )}
      </div>
    </div>
  );
}
