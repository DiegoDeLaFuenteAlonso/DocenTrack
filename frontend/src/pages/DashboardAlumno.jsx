import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { BookOpen, CheckCircle, Clock, ChevronRight, AlertCircle } from 'lucide-react';

const DashboardAlumno = () => {
  const [asignaturas, setAsignaturas] = useState([]);
  const [campanas, setCampanas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [votedStatus, setVotedStatus] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [asigRes, campRes] = await Promise.all([
        api.get('asignaturas/'),
        api.get('campanas/')
      ]);
      setAsignaturas(asigRes.data);
      setCampanas(campRes.data);

      const activeCampanas = campRes.data.filter(c => c.activa);
      
      const votedMap = {};
      for (const campana of activeCampanas) {
        for (const asig of asigRes.data) {
          try {
            const voteRes = await api.get('check-vote/', {
              params: {
                campana_id: campana.id,
                asignatura_grupo_id: asig.id
              }
            });
            votedMap[`${campana.id}-${asig.id}`] = voteRes.data.voted;
          } catch (e) {
            console.error(e);
          }
        }
      }
      setVotedStatus(votedMap);
    } catch (err) {
      setError('No se pudieron cargar las asignaturas. Verifica tu conexión.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4"></div>
      <p className="text-slate-500 font-medium">Cargando tus asignaturas...</p>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3">
      <AlertCircle className="text-red-500" />
      <span className="font-medium">{error}</span>
    </div>
  );

  const activeCampanas = campanas.filter(c => c.activa);

  return (
    <div className="animate-fade-in">
      <header className="mb-10">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Panel del Alumno</h1>
        <p className="text-slate-500 text-lg">Gestiona tus evaluaciones pendientes de forma anónima.</p>
      </header>
      
      {activeCampanas.length === 0 ? (
        <div className="bg-white rounded-2xl p-10 text-center border border-slate-200 shadow-sm flex flex-col items-center justify-center">
          <Clock size={48} className="text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">No hay encuestas activas</h3>
          <p className="text-slate-500 max-w-md">
            Actualmente no hay ninguna campaña de evaluación docente abierta. Te avisaremos cuando se abra el próximo periodo.
          </p>
        </div>
      ) : (
        activeCampanas.map(campana => (
          <div key={campana.id} className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <h2 className="text-2xl font-bold text-slate-800">
                {campana.nombre}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {asignaturas.map(asig => {
                const hasVoted = votedStatus[`${campana.id}-${asig.id}`];
                
                return (
                  <div 
                    key={asig.id} 
                    className="group bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative overflow-hidden"
                  >
                    {/* Decorative Background Element */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-bl-full -z-0 opacity-50 group-hover:bg-indigo-50/50 transition-colors"></div>

                    <div className="z-10 flex-1">
                      <div className="flex items-start justify-between mb-4">
                        <div className="bg-indigo-100 text-indigo-700 p-2.5 rounded-xl">
                          <BookOpen size={20} />
                        </div>
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800 border border-slate-200">
                          {asig.curso} - G.{asig.grupo}
                        </span>
                      </div>
                      
                      <h3 className="text-xl font-bold text-slate-900 mb-2 leading-tight">
                        {asig.nombre}
                      </h3>
                      <p className="text-slate-600 text-sm font-medium mb-6">
                        Prof: <span className="text-slate-900">{asig.profesor_nombre}</span>
                      </p>
                    </div>

                    <div className="z-10 mt-auto pt-4 border-t border-slate-100">
                      {hasVoted ? (
                        <div className="flex items-center justify-center gap-2 bg-emerald-50 text-emerald-700 py-3 px-4 rounded-xl font-medium border border-emerald-100">
                          <CheckCircle size={18} />
                          <span>Evaluación Completada</span>
                        </div>
                      ) : (
                        <Link
                          to={`/alumno/encuesta/${campana.id}/${asig.id}`}
                          className="flex items-center justify-center gap-2 w-full bg-indigo-600 text-white font-medium rounded-xl py-3 px-4 hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-100 transition-all group-hover:shadow-md"
                        >
                          <span>Realizar Encuesta</span>
                          <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                        </Link>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default DashboardAlumno;
