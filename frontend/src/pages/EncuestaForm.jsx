import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import { ChevronLeft, Send, AlertTriangle } from 'lucide-react';

const EncuestaForm = () => {
  const { campanaId, asignaturaId } = useParams();
  const navigate = useNavigate();
  const [preguntas, setPreguntas] = useState([]);
  const [respuestas, setRespuestas] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPreguntas();
    checkIfVoted();
  }, [campanaId, asignaturaId]);

  const checkIfVoted = async () => {
    try {
      const res = await api.get('check-vote/', {
        params: { campana_id: campanaId, asignatura_grupo_id: asignaturaId }
      });
      if (res.data.voted) {
        navigate('/alumno/dashboard');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPreguntas = async () => {
    try {
      const res = await api.get('preguntas/');
      setPreguntas(res.data);
    } catch (err) {
      setError('No se pudieron cargar las preguntas del cuestionario.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOptionChange = (preguntaId, valor) => {
    setRespuestas({
      ...respuestas,
      [preguntaId]: valor
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (Object.keys(respuestas).length < preguntas.length) {
      setError('Por favor, responde a todas las preguntas antes de enviar.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setSubmitting(true);
    setError(null);

    const formatRespuestas = Object.entries(respuestas).map(([pregunta_id, valor]) => ({
      pregunta_id: parseInt(pregunta_id),
      valor: parseInt(valor)
    }));

    try {
      await api.post('submit-survey/', {
        asignatura_grupo_id: parseInt(asignaturaId),
        campana_id: parseInt(campanaId),
        respuestas: formatRespuestas
      });
      navigate('/alumno/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al enviar la encuesta.');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
      <p className="text-slate-500 font-medium">Cargando cuestionario...</p>
    </div>
  );

  const answeredCount = Object.keys(respuestas).length;
  const progressPercent = preguntas.length > 0 ? (answeredCount / preguntas.length) * 100 : 0;

  return (
    <div className="max-w-4xl mx-auto pb-24 animate-fade-in">
      <button 
        onClick={() => navigate('/alumno/dashboard')}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 font-medium transition-colors"
      >
        <ChevronLeft size={20} />
        Volver a mis asignaturas
      </button>

      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-sm border border-slate-200 mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 mb-4 tracking-tight">Evaluación Docente Anónima</h1>
        <p className="text-slate-600 text-lg leading-relaxed mb-6">
          Tu opinión es fundamental para mejorar la calidad educativa. Evalúa cada aspecto del <span className="font-bold text-slate-800">1 (Totalmente en desacuerdo)</span> al <span className="font-bold text-slate-800">5 (Totalmente de acuerdo)</span>.
        </p>
        
        {/* Progress Bar */}
        <div className="w-full bg-slate-100 rounded-full h-3 mb-2">
          <div 
            className="bg-indigo-500 h-3 rounded-full transition-all duration-500 ease-out" 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
        <div className="text-right text-sm text-slate-500 font-medium font-mono">
          {answeredCount} / {preguntas.length} completadas
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3 mb-8 shadow-sm">
          <AlertTriangle className="text-red-500 shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {preguntas.map((p, index) => {
          const isAnswered = !!respuestas[p.id];
          return (
            <div 
              key={p.id} 
              className={`bg-white p-6 md:p-8 rounded-2xl border transition-all duration-300 ${
                isAnswered ? 'border-indigo-200 shadow-md bg-indigo-50/10' : 'border-slate-200 shadow-sm'
              }`}
            >
              <h3 className="text-xl font-semibold text-slate-800 mb-6">
                <span className="text-indigo-400 mr-2">{index + 1}.</span> 
                {p.texto}
              </h3>
              
              <div className="grid grid-cols-5 gap-2 sm:gap-4">
                {[1, 2, 3, 4, 5].map(val => {
                  const isSelected = respuestas[p.id] === val;
                  return (
                    <label 
                      key={val} 
                      className={`
                        relative flex flex-col items-center justify-center p-3 sm:p-4 rounded-xl cursor-pointer
                        transition-all duration-200 border-2
                        ${isSelected 
                          ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/30 transform scale-[1.02]' 
                          : 'bg-slate-50 border-slate-100 text-slate-600 hover:bg-slate-100 hover:border-slate-300'
                        }
                      `}
                    >
                      <input
                        type="radio"
                        name={`pregunta-${p.id}`}
                        value={val}
                        checked={isSelected}
                        onChange={() => handleOptionChange(p.id, val)}
                        className="sr-only"
                      />
                      <span className="text-2xl font-bold">{val}</span>
                      <span className={`text-[10px] sm:text-xs mt-1 text-center hidden sm:block opacity-70`}>
                        {val === 1 && 'No de acuerdo'}
                        {val === 3 && 'Neutral'}
                        {val === 5 && 'Muy de acuerdo'}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Sticky Submit Bar */}
        <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 z-50 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="hidden sm:block text-slate-500 font-medium">
              {answeredCount === preguntas.length 
                ? '¡Listo para enviar! 🎉' 
                : `Faltan ${preguntas.length - answeredCount} preguntas por responder`
              }
            </div>
            <div className="flex gap-4 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => navigate('/alumno/dashboard')}
                className="flex-1 sm:flex-none px-6 py-3 border border-slate-300 bg-white rounded-xl text-slate-700 font-semibold hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || answeredCount < preguntas.length}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-xl"
              >
                {submitting ? 'Enviando...' : 'Enviar Respuestas'}
                {!submitting && <Send size={20} />}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default EncuestaForm;
