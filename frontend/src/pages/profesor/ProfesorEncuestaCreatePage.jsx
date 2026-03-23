import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ClipboardList,
  ListOrdered,
  Plus,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import api from '../../api';
import { asList } from '../../utils/apiList';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export default function ProfesorEncuestaCreatePage() {
  const navigate = useNavigate();
  const [clases, setClases] = useState([]);
  const [loadingClases, setLoadingClases] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const [asignaturaId, setAsignaturaId] = useState('');
  const [nombre, setNombre] = useState('');
  const [fechaInicio, setFechaInicio] = useState(todayIso());
  const [fechaFin, setFechaFin] = useState(todayIso());
  const [activa, setActiva] = useState(true);

  const [textoPregunta, setTextoPregunta] = useState('');
  const [ordenPregunta, setOrdenPregunta] = useState('');
  const [preguntas, setPreguntas] = useState([]);

  useEffect(() => {
    setLoadingClases(true);
    api
      .get('mis-clases/')
      .then((res) => setClases(asList(res.data)))
      .catch(() => setError('No se pudieron cargar tus clases.'))
      .finally(() => setLoadingClases(false));
  }, []);

  const nextOrden = useMemo(() => {
    if (preguntas.length === 0) return 1;
    return Math.max(...preguntas.map((p) => p.orden)) + 1;
  }, [preguntas]);

  const sortedPreguntas = useMemo(
    () =>
      [...preguntas].sort((a, b) => a.orden - b.orden || a.idLocal - b.idLocal),
    [preguntas],
  );

  const handleAddPregunta = (e) => {
    e.preventDefault();
    setError('');
    const texto = textoPregunta.trim();
    if (!texto) {
      setError('Escribe el texto de la pregunta antes de añadirla.');
      return;
    }

    const ordenSolicitado =
      ordenPregunta === '' ? nextOrden : Number(ordenPregunta);
    if (!Number.isInteger(ordenSolicitado) || ordenSolicitado <= 0) {
      setError('El orden debe ser un número entero mayor que 0.');
      return;
    }

    setPreguntas((prev) => {
      const current = [...prev].sort(
        (a, b) => a.orden - b.orden || a.idLocal - b.idLocal,
      );

      // Insertamos por posición (1..n+1), acotando valores fuera de rango al siguiente disponible.
      const posicionInsercion = Math.min(
        Math.max(ordenSolicitado, 1),
        current.length + 1,
      );

      const nuevo = {
        idLocal: Date.now() + Math.floor(Math.random() * 1000),
        texto,
      };

      current.splice(posicionInsercion - 1, 0, nuevo);

      return current.map((p, idx) => ({
        ...p,
        orden: idx + 1,
      }));
    });

    setTextoPregunta('');
    setOrdenPregunta('');
  };

  const handleDeletePregunta = (idLocal) => {
    setPreguntas((prev) => prev.filter((p) => p.idLocal !== idLocal));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!asignaturaId || !nombre.trim() || !fechaInicio || !fechaFin) {
      setError('Completa los campos de clase, nombre y fechas.');
      return;
    }
    if (preguntas.length === 0) {
      setError('Añade al menos una pregunta antes de crear la encuesta.');
      return;
    }

    setSaving(true);
    try {
      const res = await api.post('encuestas-clase/crear-completa/', {
        asignatura_grupo: Number(asignaturaId),
        nombre: nombre.trim(),
        fecha_inicio: fechaInicio,
        fecha_fin: fechaFin,
        activa,
        preguntas: sortedPreguntas.map((p) => ({
          texto: p.texto,
          orden: p.orden,
        })),
      });
      navigate(`/profesor/encuestas/${res.data.id}`);
    } catch (err) {
      const d = err.response?.data;
      setError(
        typeof d === 'string'
          ? d
          : d?.detail || JSON.stringify(d) || 'No se pudo crear la encuesta.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="animate-fade-in pb-12 max-w-5xl">
      <Link
        to="/profesor/encuestas"
        className="inline-flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-6 font-medium"
      >
        <ArrowLeft size={20} /> Volver a encuestas
      </Link>

      <header className="mb-8">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">
          Nueva encuesta
        </h1>
        <p className="text-slate-500 text-lg">
          Define los datos y fija las preguntas desde el inicio. Después no se
          podrán modificar.
        </p>
      </header>

      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl flex items-center gap-3">
          <AlertCircle />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-slate-800 font-semibold mb-4">
            <ClipboardList size={18} /> Datos de la encuesta
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Clase
              </label>
              {loadingClases ? (
                <p className="text-slate-500 text-sm">Cargando clases...</p>
              ) : clases.length === 0 ? (
                <p className="text-amber-700 text-sm bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                  No tienes clases. Crea una clase antes de crear encuestas.
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
                      {c.nombre} - {c.curso} {c.grupo}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Nombre
              </label>
              <input
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej: Evaluación 2º Trimestre"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Fecha inicio
              </label>
              <input
                type="date"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={fechaInicio}
                onChange={(e) => setFechaInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Fecha fin
              </label>
              <input
                type="date"
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={fechaFin}
                onChange={(e) => setFechaFin(e.target.value)}
              />
            </div>
          </div>

          <label className="mt-4 inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={activa}
              onChange={(e) => setActiva(e.target.checked)}
            />
            <span className="text-sm font-medium text-slate-700">
              Activar encuesta al crear
            </span>
          </label>
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-slate-800 font-semibold mb-4">
            <ListOrdered size={18} /> Preguntas (fijas)
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_auto] gap-3 items-end mb-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Texto de la pregunta
              </label>
              <textarea
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 min-h-25 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={textoPregunta}
                onChange={(e) => setTextoPregunta(e.target.value)}
                placeholder="Escribe la pregunta"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1">
                Orden
              </label>
              <input
                type="number"
                min={1}
                className="w-full border border-slate-200 rounded-xl px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={ordenPregunta}
                onChange={(e) => setOrdenPregunta(e.target.value)}
                placeholder={String(nextOrden)}
              />
            </div>
            <button
              type="button"
              onClick={handleAddPregunta}
              className="h-11 px-4 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 inline-flex items-center justify-center gap-2"
            >
              <Plus size={16} /> Añadir
            </button>
          </div>

          {sortedPreguntas.length === 0 ? (
            <p className="text-slate-500 text-sm">
              Aún no has añadido preguntas.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {sortedPreguntas.map((p) => (
                <li
                  key={p.idLocal}
                  className="px-4 py-3 flex items-start justify-between gap-4"
                >
                  <div>
                    <p className="text-sm font-bold text-slate-900">
                      {p.orden}. {p.texto}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeletePregunta(p.idLocal)}
                    className="text-slate-400 hover:text-red-600"
                    aria-label="Eliminar pregunta"
                  >
                    <Trash2 size={16} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving || clases.length === 0}
            className="px-6 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-60"
          >
            {saving ? 'Creando encuesta...' : 'Crear encuesta'}
          </button>
        </div>
      </form>
    </div>
  );
}
