import { useState } from 'react';
import { UserPlus, X } from 'lucide-react';
import api from '../api';
import { emitDocentrackRefresh } from '../utils/docentrackEvents';

export default function JoinClassDialog({ open, onClose }) {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);

  if (!open) return null;

  const submit = async (e) => {
    e.preventDefault();
    if (!codigo.trim()) return;
    setLoading(true);
    setMessage('');
    setIsError(false);
    try {
      const res = await api.post('clases/unirse/', { codigo_invitacion: codigo.trim() });
      setMessage(res.data?.nuevo ? 'Te has unido a la clase.' : 'Ya estabas en esta clase.');
      setCodigo('');
      emitDocentrackRefresh();
    } catch (err) {
      const d = err.response?.data;
      setIsError(true);
      setMessage(d?.detail || d?.codigo_invitacion?.[0] || 'Codigo no valido.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="absolute inset-0" aria-hidden onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200">
        <div className="flex items-center justify-between p-6 border-b border-slate-100">
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserPlus size={20} /> Unirme a una clase
          </h2>
          <button type="button" onClick={onClose} className="p-2 rounded-lg text-slate-500 hover:bg-slate-100">
            <X size={20} />
          </button>
        </div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <input
            className="w-full border border-slate-200 rounded-xl px-4 py-2.5 font-mono"
            placeholder="Introduce el codigo de invitacion"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value)}
          />
          {message && (
            <p className={`text-sm ${isError ? 'text-red-600' : 'text-emerald-700'}`}>{message}</p>
          )}
          <button
            type="submit"
            disabled={loading || !codigo.trim()}
            className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-60"
          >
            {loading ? 'Uniendo...' : 'Unirme'}
          </button>
        </form>
      </div>
    </div>
  );
}
