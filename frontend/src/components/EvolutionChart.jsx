import { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import api from '../api';

const EvolutionChart = ({ username }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (username) {
      fetchEvolution();
    }
  }, [username]);

  const fetchEvolution = async () => {
    try {
      const profRes = await api.get('profesores/');
      const profData = profRes.data.find(p => p.username === username);
      
      if (profData) {
        const logRes = await api.get(`evolution/${profData.id}/`);
        // Format data for Recharts
        const chartData = logRes.data.map(item => ({
          name: item.campana_nombre,
          Media: item.media,
        }));
        setData(chartData);
      }
    } catch (err) {
      console.error("Error fetching evolution data", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-full">Cargando gráfico...</div>;
  if (data.length === 0) return <div className="text-gray-500 text-center mt-10">No hay datos históricos para mostrar.</div>;

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
          tick={{fontSize: 12}}
        />
        <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} />
        <Tooltip 
          contentStyle={{ borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
        />
        <Legend verticalAlign="top" height={36} />
        <Line 
          type="monotone" 
          dataKey="Media" 
          stroke="#4f46e5" 
          strokeWidth={3}
          activeDot={{ r: 8 }} 
          name="Puntuación Media Global"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default EvolutionChart;
