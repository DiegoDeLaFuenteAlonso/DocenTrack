import { useContext, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import { AlertCircle, ChevronRight, ClipboardList, History, School } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';

export default function AlumnoHomePage() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    api
      .get('alumno/dashboard/')
      .then((res) => {
        setDashboard(res.data);
        setError(null);
      })
      .catch(() => setError('No se pudo cargar el inicio del alumno.'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
        <p className="text-slate-500">Cargando...</p>
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

  const ultimasClases = dashboard?.ultimas_clases_visitadas || [];
  const ultimasEncuestas = dashboard?.ultimas_encuestas_anadidas || [];
  const encuestasMedias = dashboard?.encuestas_a_medias || [];

  return (
    <div className="animate-fade-in pb-12">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          Hola, {user?.first_name || user?.username || 'alumno'}
        </h1>
        <p className="text-slate-500 text-lg">Este es tu resumen rapido del dia.</p>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-slate-800 font-semibold mb-4">
            <History size={18} /> Ultimas clases visitadas
          </div>
          {ultimasClases.length === 0 ? (
            <p className="text-slate-500 text-sm">Aun no hay clases visitadas recientemente.</p>
          ) : (
            <div className="space-y-3">
              {ultimasClases.map((item) => (
                <Link
                  key={item.clase.id}
                  to={`/alumno/clases/${item.clase.id}`}
                  className="block rounded-xl border border-slate-200 p-3 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
                >
                  <p className="font-semibold text-slate-900">{item.clase.nombre}</p>
                  <p className="text-sm text-slate-500">
                    {item.clase.curso} · Grupo {item.clase.grupo}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-slate-800 font-semibold mb-4">
            <ClipboardList size={18} /> Ultimas encuestas anadidas
          </div>
          {ultimasEncuestas.length === 0 ? (
            <p className="text-slate-500 text-sm">No hay encuestas recientes.</p>
          ) : (
            <div className="space-y-3">
              {ultimasEncuestas.map((encuesta) => (
                <Link
                  key={encuesta.id}
                  to={`/alumno/encuestas/${encuesta.id}`}
                  className="block rounded-xl border border-slate-200 p-3 hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors"
                >
                  <p className="font-semibold text-slate-900">{encuesta.nombre}</p>
                  <p className="text-sm text-slate-500">
                    {encuesta.fecha_inicio} - {encuesta.fecha_fin}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-amber-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-slate-800 font-semibold mb-4">
            <School size={18} /> Encuestas a medias
          </div>
          {encuestasMedias.length === 0 ? (
            <p className="text-slate-500 text-sm">No tienes encuestas a medias.</p>
          ) : (
            <div className="space-y-3">
              {encuestasMedias.map((encuesta) => (
                <Link
                  key={encuesta.id}
                  to={`/alumno/encuestas/${encuesta.id}`}
                  className="block rounded-xl border border-amber-300 bg-amber-50 p-3 hover:bg-amber-100/60 transition-colors"
                >
                  <p className="font-semibold text-amber-900">{encuesta.nombre}</p>
                  <p className="text-sm text-amber-800">Estado: en curso</p>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="mt-8">
        <button
          type="button"
          onClick={() => navigate('/alumno/encuestas')}
          className="inline-flex items-center gap-2 bg-indigo-600 text-white font-semibold px-5 py-3 rounded-xl hover:bg-indigo-700"
        >
          Ver todas las encuestas
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
