import { useState, useEffect } from 'react';
import api from '../api';
import { X, BookOpen, ClipboardList } from 'lucide-react';

const tabBtn = (active) =>
  `flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
    active ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
  }`;

export default function CreateClassSurveyDialog({
  open,
  onClose,
  onSuccess,
  navigate,
}) {
  const [tab, setTab] = useState('clase');

  const [nombreClase, setNombreClase] = useState('');
  const [curso, setCurso] = useState('');
  const [grupo, setGrupo] = useState('');
  const [submittingClase, setSubmittingClase] = useState(false);
  const [errorClase, setErrorClase] = useState('');

  useEffect(() => {
    if (!open) {
      setTab('clase');
      setErrorClase('');
      setNombreClase('');
      setCurso('');
      setGrupo('');
    }
  }, [open]);

  if (!open) return null;

  const handleCreateClase = async (e) => {
    e.preventDefault();
    setErrorClase('');
    if (!nombreClase.trim() || !curso.trim() || !grupo.trim()) {
      setErrorClase('Completa todos los campos.');
      return;
    }
    setSubmittingClase(true);
    try {
      await api.post('asignaturas/', {
        nombre: nombreClase.trim(),
        curso: curso.trim(),
        grupo: grupo.trim(),
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      const d = err.response?.data;
      setErrorClase(
        typeof d === 'string'
          ? d
          : d?.detail || JSON.stringify(d) || 'No se pudo crear la clase.',
      );
    } finally {
      setSubmittingClase(false);
    }
  };

  const openEncuestaCreatorInNewTab = () => {
    const url = `${window.location.origin}/profesor/encuestas/nueva`;
    const newTab = window.open(url, '_blank', 'noopener,noreferrer');
    if (!newTab && navigate) {
      navigate('/profesor/encuestas/nueva');
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="absolute inset-0" aria-hidden onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-slate-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900">Crear</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
            aria-label="Cerrar"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-6">
            <button
              type="button"
              className={tabBtn(tab === 'clase')}
              onClick={() => setTab('clase')}
            >
              <span className="flex items-center justify-center gap-2">
                <BookOpen size={16} /> Nueva clase
              </span>
            </button>
            <button
              type="button"
              className={tabBtn(tab === 'encuesta')}
              onClick={() => setTab('encuesta')}
            >
              <span className="flex items-center justify-center gap-2">
                <ClipboardList size={16} /> Nueva encuesta
              </span>
            </button>
          </div>

          {tab === 'clase' && (
            <form onSubmit={handleCreateClase} className="space-y-4">
              {errorClase && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {errorClase}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Nombre asignatura
                </label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={nombreClase}
                  onChange={(e) => setNombreClase(e.target.value)}
                  placeholder="Ej: Desarrollo Web"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Curso
                </label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={curso}
                  onChange={(e) => setCurso(e.target.value)}
                  placeholder="Ej: 2º DAW"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">
                  Grupo
                </label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={grupo}
                  onChange={(e) => setGrupo(e.target.value)}
                  placeholder="Ej: A"
                />
              </div>
              <button
                type="submit"
                disabled={submittingClase}
                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60"
              >
                {submittingClase ? 'Creando…' : 'Crear clase'}
              </button>
            </form>
          )}

          {tab === 'encuesta' && (
            <div className="space-y-4">
              <p className="text-slate-600 text-sm leading-relaxed">
                La creación de encuestas ahora se hace en una vista dedicada
                para definir el formulario completo (preguntas y orden) en una
                sola vez.
              </p>
              <button
                type="button"
                onClick={openEncuestaCreatorInNewTab}
                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700"
              >
                Abrir creador de encuestas en nueva pestaña
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
