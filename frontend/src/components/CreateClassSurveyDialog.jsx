import { useState, useEffect } from 'react';
import api from '../api';
import { X, BookOpen, ClipboardList } from 'lucide-react';

const tabBtn = (active) =>
  `flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-colors ${
    active ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-100'
  }`;

export default function CreateClassSurveyDialog({ open, onClose, onSuccess, navigate }) {
  const [tab, setTab] = useState('clase');
  const [clases, setClases] = useState([]);
  const [loadingClases, setLoadingClases] = useState(false);

  const [nombreClase, setNombreClase] = useState('');
  const [curso, setCurso] = useState('');
  const [grupo, setGrupo] = useState('');
  const [submittingClase, setSubmittingClase] = useState(false);
  const [errorClase, setErrorClase] = useState('');

  const [asignaturaId, setAsignaturaId] = useState('');
  const [nombreEnc, setNombreEnc] = useState('');
  const [ini, setIni] = useState('');
  const [fin, setFin] = useState('');
  const [activa, setActiva] = useState(true);
  const [submittingEnc, setSubmittingEnc] = useState(false);
  const [errorEnc, setErrorEnc] = useState('');

  useEffect(() => {
    if (!open) return;
    setLoadingClases(true);
    api
      .get('mis-clases/')
      .then((res) => setClases(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => setClases([]))
      .finally(() => setLoadingClases(false));
  }, [open]);

  useEffect(() => {
    if (!open) {
      setTab('clase');
      setErrorClase('');
      setErrorEnc('');
      setNombreClase('');
      setCurso('');
      setGrupo('');
      setNombreEnc('');
      setIni('');
      setFin('');
      setActiva(true);
      setAsignaturaId('');
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
        typeof d === 'string' ? d : d?.detail || JSON.stringify(d) || 'No se pudo crear la clase.'
      );
    } finally {
      setSubmittingClase(false);
    }
  };

  const handleCreateEncuesta = async (e) => {
    e.preventDefault();
    setErrorEnc('');
    if (!asignaturaId || !nombreEnc.trim() || !ini || !fin) {
      setErrorEnc('Selecciona clase y completa nombre y fechas.');
      return;
    }
    setSubmittingEnc(true);
    try {
      const res = await api.post('encuestas-clase/', {
        asignatura_grupo: Number(asignaturaId),
        nombre: nombreEnc.trim(),
        fecha_inicio: ini,
        fecha_fin: fin,
        activa,
      });
      onSuccess?.();
      onClose();
      if (navigate && res.data?.id) {
        navigate(`/profesor/encuestas/${res.data.id}`);
      }
    } catch (err) {
      const d = err.response?.data;
      setErrorEnc(
        typeof d === 'string' ? d : d?.detail || JSON.stringify(d) || 'No se pudo crear la encuesta.'
      );
    } finally {
      setSubmittingEnc(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div
        className="absolute inset-0"
        aria-hidden
        onClick={onClose}
      />
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
            <button type="button" className={tabBtn(tab === 'clase')} onClick={() => setTab('clase')}>
              <span className="flex items-center justify-center gap-2">
                <BookOpen size={16} /> Nueva clase
              </span>
            </button>
            <button type="button" className={tabBtn(tab === 'encuesta')} onClick={() => setTab('encuesta')}>
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
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre asignatura</label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={nombreClase}
                  onChange={(e) => setNombreClase(e.target.value)}
                  placeholder="Ej: Desarrollo Web"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Curso</label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={curso}
                  onChange={(e) => setCurso(e.target.value)}
                  placeholder="Ej: 2º DAW"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Grupo</label>
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
            <form onSubmit={handleCreateEncuesta} className="space-y-4">
              {errorEnc && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">
                  {errorEnc}
                </div>
              )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Clase</label>
                {loadingClases ? (
                  <p className="text-slate-500 text-sm">Cargando clases…</p>
                ) : clases.length === 0 ? (
                  <p className="text-amber-700 text-sm bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                    Primero crea una clase.
                  </p>
                ) : (
                  <select
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                    value={asignaturaId}
                    onChange={(e) => setAsignaturaId(e.target.value)}
                  >
                    <option value="">Selecciona una clase</option>
                    {clases.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.nombre} — {c.curso} {c.grupo}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Nombre encuesta</label>
                <input
                  className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                  value={nombreEnc}
                  onChange={(e) => setNombreEnc(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Inicio</label>
                  <input
                    type="date"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={ini}
                    onChange={(e) => setIni(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Fin</label>
                  <input
                    type="date"
                    className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={fin}
                    onChange={(e) => setFin(e.target.value)}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={activa} onChange={(e) => setActiva(e.target.checked)} />
                <span className="text-sm font-medium text-slate-700">Encuesta activa</span>
              </label>
              <button
                type="submit"
                disabled={submittingEnc || clases.length === 0}
                className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60"
              >
                {submittingEnc ? 'Creando…' : 'Crear encuesta'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
