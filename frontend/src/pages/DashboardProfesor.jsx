import { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api';
import EvolutionChart from '../components/EvolutionChart';
import { Target, Activity, Users, Award, AlertCircle } from 'lucide-react';

const DashboardProfesor = () => {
  const { user } = useContext(AuthContext);
  const [summary, setSummary] = useState(null);
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
      const profData = profRes.data.find(p => p.username === user.username);
      
      if (profData) {
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
      <p className="text-slate-500 font-medium">Recopilando datos y analíticas...</p>
    </div>
  );
  
  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3">
      <AlertCircle className="text-red-500" />
      <span className="font-medium">{error}</span>
    </div>
  );

  return (
    <div className="animate-fade-in pb-12">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Analítica Docente</h1>
        <p className="text-slate-500 text-lg">Resumen de las evaluaciones realizadas por los alumnos.</p>
      </header>

      {summary?.campana ? (
        <>
          <div className="bg-indigo-600 rounded-2xl shadow-lg mb-8 relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500 rounded-full mix-blend-screen filter blur-[50px] opacity-70 translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="p-8 md:p-10 relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
              <div className="text-white w-full md:w-auto">
                <p className="text-indigo-200 font-semibold tracking-wider text-sm uppercase mb-1">Campaña Actual</p>
                <h2 className="text-3xl md:text-4xl font-bold mb-2">{summary.campana.nombre}</h2>
                <div className="flex items-center gap-4 text-indigo-100">
                  <span className="flex items-center gap-1 bg-indigo-500/30 px-3 py-1 rounded-full text-sm font-medium">
                    <Activity size={16} /> Activa
                  </span>
                  <span className="text-sm">Finaliza: {summary.campana.fecha_fin}</span>
                </div>
              </div>

              <div className="flex gap-4 w-full md:w-auto">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl flex-1 md:w-48 text-center text-white">
                  <div className="flex justify-center mb-2 text-indigo-300"><Target size={32} /></div>
                  <p className="text-sm font-medium text-indigo-200 uppercase tracking-widest mb-1">Nota Media</p>
                  <p className="text-5xl font-extrabold">{summary.media_global}</p>
                  <p className="text-xs text-indigo-300 mt-1">Nivel Global / 5</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md border border-white/20 p-6 rounded-2xl flex-1 md:w-48 text-center text-white hidden sm:block">
                  <div className="flex justify-center mb-2 text-indigo-300"><Users size={32} /></div>
                  <p className="text-sm font-medium text-indigo-200 uppercase tracking-widest mb-1">Desviación</p>
                  <p className="text-5xl font-extrabold">{summary.desviacion_global}</p>
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
                <h3 className="text-xl font-bold text-slate-800">Desglose por Asignatura</h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Asignatura</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Puntuación Media</th>
                      <th className="px-6 py-4 text-center text-xs font-bold text-slate-500 uppercase tracking-wider text-right">Desviación</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 bg-white">
                    {summary.asignaturas.map(asig => (
                      <tr key={asig.asignatura_id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-5 whitespace-nowrap">
                          <p className="text-sm font-bold text-slate-900">{asig.nombre}</p>
                        </td>
                        <td className="px-6 py-5 whitespace-nowrap">
                          <div className="flex items-center gap-4">
                            <span className="text-sm font-bold text-slate-700 w-8">{asig.media}</span>
                            <div className="w-full max-w-[200px] bg-slate-100 rounded-full h-2.5 overflow-hidden">
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
                <h3 className="text-xl font-bold text-slate-800">Evolución</h3>
              </div>
              <div className="p-6 flex-1 min-h-[300px]">
                <EvolutionChart username={user?.username} />
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-slate-50 rounded-2xl p-12 text-center border border-slate-200 flex flex-col items-center justify-center">
          <Target size={64} className="text-slate-300 mb-6" />
          <h3 className="text-2xl font-bold text-slate-800 mb-2">Sin Datos Estadísticos</h3>
          <p className="text-slate-500 max-w-lg text-lg">
            Actualmente no hay respuestas de alumnos registradas en ninguna campaña para poder generar métricas.
          </p>
        </div>
      )}
    </div>
  );
};

export default DashboardProfesor;
