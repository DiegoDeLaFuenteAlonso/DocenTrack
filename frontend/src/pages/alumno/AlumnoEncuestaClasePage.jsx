import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api';
import { ChevronLeft, Send, AlertTriangle, CheckCircle } from 'lucide-react';
import { encuestaEnPlazo } from '../../utils/surveyDates';

export default function AlumnoEncuestaClasePage() {
  const { encuestaId } = useParams();
  const navigate = useNavigate();
  const [encuesta, setEncuesta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [respuestas, setRespuestas] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get(`encuestas-clase/${encuestaId}/`),
      api.get(`encuestas-clase/${encuestaId}/progreso/`),
    ])
      .then(([encRes, progRes]) => {
        setEncuesta(encRes.data);
        const borrador = progRes.data?.respuestas_borrador || {};
        setRespuestas(borrador);
      })
      .catch(() => setError('No se pudo cargar la encuesta.'))
      .finally(() => setLoading(false));
  }, [encuestaId]);

  const items = encuesta?.items ? [...encuesta.items].sort((a, b) => (a.orden || 0) - (b.orden || 0)) : [];
  const enPlazo = encuesta ? encuestaEnPlazo(encuesta) : false;

  const handleOptionChange = (preguntaId, valor) => {
    setRespuestas((prev) => {
      const next = { ...prev, [preguntaId]: valor };
      api.put(`encuestas-clase/${encuestaId}/progreso/`, { respuestas: next }).catch(() => {});
      return next;
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (Object.keys(respuestas).length < items.length) {
      setError('Responde todas las preguntas.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    setSubmitting(true);
    setError(null);
    const body = {
      encuesta_id: Number(encuestaId),
      respuestas: items.map((p) => ({
        pregunta_id: p.id,
        valor: respuestas[p.id],
      })),
    };
    try {
      await api.post('submit-encuesta-clase/', body);
      navigate('/alumno');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al enviar.');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
        <p className="text-slate-500">Cargando…</p>
      </div>
    );
  }

  if (!encuesta) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3">
        <AlertTriangle />
        {error || 'Encuesta no encontrada.'}
      </div>
    );
  }

  if (encuesta.ya_respondido) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Link
          to="/alumno"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 font-medium"
        >
          <ChevronLeft size={20} /> Volver al inicio
        </Link>
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-10 text-center">
          <CheckCircle className="mx-auto text-emerald-600 mb-4" size={56} />
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Ya has respondido</h1>
          <p className="text-slate-600">{encuesta.nombre}</p>
        </div>
      </div>
    );
  }

  if (!encuesta.activa || !enPlazo) {
    return (
      <div className="max-w-2xl mx-auto animate-fade-in">
        <Link
          to="/alumno"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 font-medium"
        >
          <ChevronLeft size={20} /> Volver
        </Link>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Encuesta no disponible</h1>
          <p className="text-slate-600">
            Esta encuesta está inactiva o fuera del periodo de respuesta ({encuesta.fecha_inicio} —{' '}
            {encuesta.fecha_fin}).
          </p>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Link to="/alumno" className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6">
          <ChevronLeft size={20} /> Volver
        </Link>
        <p className="text-slate-600">El profesor aún no ha añadido preguntas a esta encuesta.</p>
      </div>
    );
  }

  const answeredCount = Object.keys(respuestas).length;
  const progressPercent = items.length ? (answeredCount / items.length) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto pb-24 animate-fade-in">
      <button
        type="button"
        onClick={() => navigate('/alumno')}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 font-medium"
      >
        <ChevronLeft size={20} />
        Volver
      </button>

      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{encuesta.nombre}</h1>
        <p className="text-slate-600 text-lg leading-relaxed mb-4">
          Evalúa del <strong>1</strong> al <strong>5</strong>. Tus respuestas se guardan de forma anónima.
        </p>
        <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
          <div
            className="bg-indigo-500 h-3 rounded-full transition-all duration-500"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-right text-sm text-slate-500 font-mono">
          {answeredCount} / {items.length}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3 mb-8">
          <AlertTriangle className="shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {items.map((p, index) => {
          const isAnswered = !!respuestas[p.id];
          return (
            <div
              key={p.id}
              className={`bg-white p-6 md:p-8 rounded-2xl border transition-all ${
                isAnswered ? 'border-indigo-200 shadow-md bg-indigo-50/10' : 'border-slate-200 shadow-sm'
              }`}
            >
              <h3 className="text-xl font-semibold text-slate-800 mb-6">
                <span className="text-indigo-400 mr-2">{index + 1}.</span>
                {p.texto}
              </h3>
              <div className="grid grid-cols-5 gap-2 sm:gap-4">
                {[1, 2, 3, 4, 5].map((val) => {
                  const isSelected = respuestas[p.id] === val;
                  return (
                    <label
                      key={val}
                      className={`relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl cursor-pointer transition-all border-2 ${
                        isSelected
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg scale-[1.02]'
                          : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`p-${p.id}`}
                        className="sr-only"
                        checked={isSelected}
                        onChange={() => handleOptionChange(p.id, val)}
                      />
                      <span className="text-2xl font-bold">{val}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur border-t border-slate-200 p-4 z-50 md:left-72">
          <div className="max-w-4xl mx-auto flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate('/alumno')}
              className="px-6 py-3 border border-slate-300 rounded-xl text-slate-700 font-semibold hover:bg-slate-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting || answeredCount < items.length}
              className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Enviando…' : 'Enviar'}
              {!submitting && <Send size={20} />}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
