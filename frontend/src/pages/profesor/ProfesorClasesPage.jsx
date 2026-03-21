import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api';
import { DOCENTRACK_REFRESH } from '../../utils/docentrackEvents';
import { BookOpen, ChevronRight, AlertCircle, Hash } from 'lucide-react';

export default function ProfesorClasesPage() {
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(() => {
    setLoading(true);
    api
      .get('mis-clases/')
      .then((res) => setClases(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(() => setError('No se pudieron cargar las clases.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const h = () => load();
    window.addEventListener(DOCENTRACK_REFRESH, h);
    return () => window.removeEventListener(DOCENTRACK_REFRESH, h);
  }, [load]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
        <p className="text-slate-500 font-medium">Cargando clases…</p>
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

  return (
    <div className="animate-fade-in pb-12">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Mis clases</h1>
        <p className="text-slate-500 text-lg">Gestiona tus asignaturas y sus encuestas.</p>
      </header>

      {clases.length === 0 ? (
        <div className="bg-slate-50 rounded-2xl p-12 text-center border border-slate-200">
          <BookOpen className="mx-auto text-slate-300 mb-4" size={48} />
          <p className="text-slate-600">Aún no tienes clases. Usa el botón + para crear una.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {clases.map((c) => (
            <Link
              key={c.id}
              to={`/profesor/clases/${c.id}`}
              className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="bg-indigo-100 text-indigo-700 p-2.5 rounded-xl">
                  <BookOpen size={22} />
                </div>
                <span className="text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full border border-slate-200">
                  {c.curso} · Gr. {c.grupo}
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 mb-2">{c.nombre}</h2>
              {c.codigo_invitacion && (
                <p className="text-sm text-slate-500 flex items-center gap-1.5 mb-4">
                  <Hash size={14} />
                  Código invitación:{' '}
                  <code className="bg-slate-100 px-2 py-0.5 rounded font-mono text-slate-800">
                    {c.codigo_invitacion}
                  </code>
                </p>
              )}
              <span className="mt-auto flex items-center gap-1 text-indigo-600 font-semibold text-sm group-hover:gap-2 transition-all">
                Ver encuestas <ChevronRight size={18} />
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
