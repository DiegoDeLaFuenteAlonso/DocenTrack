import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import api from '../api';

const EvolutionChart = ({ profesorId, asignaturaId, lineLabel }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profesorId) {
      fetchEvolution();
    }
  }, [profesorId, asignaturaId]);

  const fetchEvolution = async () => {
    try {
      const params = {};
      if (asignaturaId) params.asignatura_id = asignaturaId;
      const logRes = await api.get(`evolution/${profesorId}/`, { params });
      const chartData = logRes.data.map((item) => ({
        name: item.encuesta_nombre,
        Media: item.media,
        fecha: item.fecha_fin,
      }));
      setData(chartData);
    } catch (err) {
      console.error('Error fetching evolution data', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        Cargando gráfico...
      </div>
    );
  if (data.length === 0)
    return (
      <div className="text-gray-500 text-center mt-10">
        No hay datos históricos para mostrar.
      </div>
    );

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 40 }}
      >
        <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
        <XAxis
          dataKey="name"
          angle={-45}
          textAnchor="end"
          height={60}
          tick={{ fontSize: 12 }}
        />
        <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
        <Tooltip
          contentStyle={{
            borderRadius: '8px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          }}
          labelFormatter={(label, payload) => {
            const row = payload?.[0]?.payload;
            return row?.fecha ? `${label} · cierre ${row.fecha}` : label;
          }}
        />
        <Legend verticalAlign="top" height={36} />
        <Line
          type="monotone"
          dataKey="Media"
          stroke="#4f46e5"
          strokeWidth={3}
          activeDot={{ r: 8 }}
          name={lineLabel || 'Puntuación media'}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default EvolutionChart;
