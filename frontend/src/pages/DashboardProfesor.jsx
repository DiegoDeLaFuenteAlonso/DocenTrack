import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import EvolutionChart from '../components/EvolutionChart';
import {
  Target,
  Activity,
  Users,
  Award,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';

const DashboardProfesor = () => {
  const { user } = useContext(AuthContext);
  const [profesorId, setProfesorId] = useState(null);
  const [summary, setSummary] = useState(null);
  const [selectedAsignaturaId, setSelectedAsignaturaId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.profile?.role === 'PROFESOR') {
      fetchSummary();
    }
  }, [user]);

  const fetchSummary = async () => {
    try {
      const profRes = await api.get('profesores/');
      const profData = profRes.data.find((p) => p.username === user.username);

      if (profData) {
        setProfesorId(profData.id);
        const res = await api.get(`results/${profData.id}/`);
        setSummary(res.data);
      }
    } catch (err) {
      setError('Error cargando los resultados estadísticos.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const asignaturas = summary?.asignaturas || [];
  const selectedAsignatura =
    asignaturas.find((a) => a.asignatura_id === selectedAsignaturaId) || null;
  const showingGlobal = !selectedAsignatura;
  const mainTitle = showingGlobal
    ? 'Analítica Global (encuestas cerradas)'
    : selectedAsignatura.nombre;
  const mainSubtitle = showingGlobal
    ? 'Resumen consolidado de tus grupos con encuestas ya finalizadas.'
    : 'Vista filtrada por el grupo seleccionado.';
  const mediaActual = showingGlobal
    ? summary?.media_global
    : selectedAsignatura.media;
  const desviacionActual = showingGlobal
    ? summary?.desviacion_global
    : selectedAsignatura.desviacion;
  const encuestasCerradasActual = showingGlobal
    ? summary?.total_encuestas_cerradas
    : selectedAsignatura.total_encuestas_cerradas;
  const respuestasActual = showingGlobal
    ? summary?.total_respuestas
    : selectedAsignatura.total_respuestas;

  if (loading)
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
        <p className="text-slate-500 font-medium">
          Recopilando datos y analíticas...
        </p>
      </div>
    );

  if (error)
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3">
        <AlertCircle className="text-red-500" />
        <span className="font-medium">{error}</span>
      </div>
    );

  return (
    <div className="animate-fade-in pb-12">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          Analítica Docente
        </h1>
        <p className="text-slate-500 text-lg">
          Resumen de las evaluaciones realizadas por los alumnos.
        </p>
      </header>

      {summary?.total_encuestas_cerradas > 0 ? (
        <>
          <div
            className={`rounded-2xl shadow-lg mb-8 relative overflow-hidden ${showingGlobal ? 'bg-indigo-600' : 'bg-fuchsia-600'}`}
          >
            {/* Background elements */}
            <div
              className={`absolute right-0 top-0 w-64 h-64 rounded-full mix-blend-screen filter blur-[50px] opacity-70 translate-x-1/2 -translate-y-1/2 ${showingGlobal ? 'bg-indigo-500' : 'bg-fuchsia-500'}`}
            ></div>

            <div className="p-8 md:p-10 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-white w-full md:w-auto">
                <p className="text-indigo-200 font-semibold tracking-wider text-sm uppercase mb-1">
                  {showingGlobal ? 'Vista global' : 'Grupo seleccionado'}
                </p>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">
                  {mainTitle}
                </h2>
                <div className="flex items-center gap-4 text-indigo-100">
                  <span className="flex items-center gap-1 bg-white/15 px-3 py-1 rounded-full text-sm font-medium">
                    <Activity size={16} /> {encuestasCerradasActual} cerradas
                  </span>
                  <span className="text-sm">{mainSubtitle}</span>
                </div>
              </div>

              <div className="flex gap-4 w-full md:w-auto">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl flex-1 md:w-48 text-center text-white">
                  <div className="flex justify-center mb-2 text-indigo-300">
                    <Target size={32} />
                  </div>
                  <p className="text-sm font-medium text-indigo-200 uppercase tracking-widest mb-1">
                    Nota Media
                  </p>
                  <p className="text-5xl font-extrabold">
                    {mediaActual ?? '—'}
                  </p>
                  <p className="text-xs text-indigo-300 mt-1">
                    Nivel Global / 5
                  </p>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl flex-1 md:w-48 text-center text-white hidden sm:block">
                  <div className="flex justify-center mb-2 text-indigo-300">
                    <Users size={32} />
                  </div>
                  <p className="text-sm font-medium text-indigo-200 uppercase tracking-widest mb-1">
                    Desviación
                  </p>
                  <p className="text-5xl font-extrabold">
                    {desviacionActual ?? '—'}
                  </p>
                  <p className="text-xs text-indigo-300 mt-1">Típica (σ)</p>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
            {/* Detalle por asignaturas - Tabla */}
            <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <div className="bg-emerald-100 p-2 rounded-lg text-emerald-600">
                  <Award size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">
                  Desglose por Asignatura/Grupo
                </h3>
              </div>

              <div className="overflow-x-auto p-4">
                <button
                  type="button"
                  onClick={() => setSelectedAsignaturaId(null)}
                  className={`w-full text-left mb-3 rounded-xl border p-4 transition-all ${
                    showingGlobal
                      ? 'border-indigo-300 bg-indigo-50 shadow-sm'
                      : 'border-slate-200 bg-white hover:border-indigo-200'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-bold text-slate-900">Vista global</p>
                      <p className="text-sm text-slate-500">
                        Todas tus clases con encuestas cerradas
                      </p>
                    </div>
                    {showingGlobal && (
                      <CheckCircle2 size={20} className="text-indigo-600" />
                    )}
                  </div>
                </button>
                {asignaturas.map((asig) => {
                  const selected = selectedAsignaturaId === asig.asignatura_id;
                  return (
                    <button
                      type="button"
                      key={asig.asignatura_id}
                      onClick={() =>
                        setSelectedAsignaturaId(
                          selected ? null : asig.asignatura_id,
                        )
                      }
                      className={`w-full text-left mb-3 rounded-xl border p-4 transition-all ${
                        selected
                          ? 'border-fuchsia-300 bg-fuchsia-50 shadow-sm'
                          : 'border-slate-200 bg-white hover:border-indigo-200'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-slate-900">
                            {asig.nombre}
                          </p>
                          <p className="text-sm text-slate-500">
                            {asig.total_encuestas_cerradas} encuestas cerradas ·{' '}
                            {asig.total_respuestas} respuestas
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-bold text-slate-800">
                            {asig.media}
                          </p>
                          <p className="text-xs text-slate-500">
                            ± {asig.desviacion}
                          </p>
                        </div>
                      </div>
                      {selected && (
                        <p className="mt-2 text-xs font-semibold text-fuchsia-700">
                          Seleccionado: la cabecera y la gráfica muestran solo
                          este grupo.
                        </p>
                      )}
                    </button>
                  );
                })}

                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Grupo
                      </th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                        Puntuación Media
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider text-right">
                        Desviación
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {summary.asignaturas.map((asig) => (
                      <tr
                        key={asig.asignatura_id}
                        className="hover:bg-slate-50 transition-colors"
                      >
                        <td className="px-6 py-5 whitespace-nowrap">
                          <p className="text-sm font-bold text-slate-900">
                            {asig.nombre}
                          </p>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-slate-700 w-8">
                              {asig.media}
                            </span>
                            <div className="w-full max-w-50 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`h-2.5 rounded-full ${asig.media >= 4 ? 'bg-emerald-500' : asig.media >= 3 ? 'bg-amber-400' : 'bg-rose-500'}`}
                                style={{ width: `${(asig.media / 5) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap text-right">
                          <span className="inline-flex items-center px-2.5 py-0.5 text-sm font-medium text-slate-500">
                            ± {asig.desviacion}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Evolución Histórica - Gráfico */}
            <div className="xl:col-span-1 bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center gap-3">
                <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                  <Activity size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-800">
                  Evolución{' '}
                  {showingGlobal ? 'global' : 'del grupo seleccionado'}
                </h3>
              </div>
              <div className="p-6 flex-1 min-h-75">
                <EvolutionChart
                  profesorId={profesorId}
                  asignaturaId={selectedAsignaturaId}
                  lineLabel={
                    showingGlobal
                      ? 'Puntuación Media Global'
                      : 'Puntuación Media del Grupo'
                  }
                />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-slate-50 rounded-2xl p-12 text-center border border-slate-200 flex flex-col items-center justify-center">
          <Target size={64} className="text-slate-300 mb-6" />
          <h3 className="text-2xl font-bold text-slate-800 mb-2">
            Sin Datos Estadísticos
          </h3>
          <p className="text-slate-500 max-w-lg text-lg">
            Actualmente no hay encuestas cerradas con respuestas para poder
            generar métricas.
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardProfesor;
