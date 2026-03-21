import { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogIn, BookOpenCheck } from 'lucide-react';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!username || !password) {
      setError('Por favor, rellene todos los campos.');
      return;
    }

    setIsSubmitting(true);
    const success = await login(username, password);
    if (success) {
      navigate('/');
    } else {
      setError('Credenciales inválidas. Inténtelo de nuevo.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left side: Branding / Illustration */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-indigo-900 overflow-hidden items-center justify-center">
        {/* Glow effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
          <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-indigo-600 rounded-full mix-blend-screen filter blur-[100px] opacity-50"></div>
          <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-600 rounded-full mix-blend-screen filter blur-[100px] opacity-50"></div>
        </div>

        <div className="z-10 flex flex-col items-center text-center p-12 text-white">
          <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/20 mb-8 shadow-2xl">
            <BookOpenCheck size={64} className="text-indigo-300" />
          </div>
          <h1 className="text-5xl font-bold mb-6 tracking-tight">Bienvenido a DocenTrack</h1>
          <p className="text-lg text-indigo-200 max-w-lg leading-relaxed">
            La plataforma definitiva para gestionar, evaluar y mejorar la calidad docente mediante el feedback constructivo y analítico.
          </p>
        </div>
      </div>

      {/* Right side: Login Form */}
      <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 bg-white relative">
        <div className="w-full max-w-md">
          {/* Mobile Header only */}
          <div className="lg:hidden flex justify-center mb-8">
            <div className="bg-indigo-50 p-4 rounded-full">
              <BookOpenCheck size={48} className="text-indigo-600" />
            </div>
          </div>
          <div className="lg:hidden text-center mb-10">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">DocenTrack</h1>
            <p className="text-slate-500">Inicia sesión en tu cuenta</p>
          </div>

          <div className="hidden lg:block mb-10">
            <h2 className="text-3xl font-bold text-slate-900 mb-2">Iniciar Sesión</h2>
            <p className="text-slate-500">Ingresa tus credenciales para acceder a tu panel.</p>
          </div>
          
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-md mb-8 animate-fade-in shadow-sm">
              <p className="font-medium">Error de acceso</p>
              <p className="text-sm">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Nombre de Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
                placeholder="Ej: alumno1"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-semibold text-slate-700">Contraseña</label>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-50 text-slate-900 border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-sm"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-medium rounded-xl py-3 px-4 hover:bg-indigo-700 hover:shadow-lg focus:ring-4 focus:ring-indigo-200 transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isSubmitting ? 'Iniciando sesión...' : 'Entrar a la plataforma'}
              {!isSubmitting && <LogIn size={20} />}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-100 text-center text-sm text-slate-500">
            <p>¿Problemas para entrar? Contacta con el administrador del centro.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
