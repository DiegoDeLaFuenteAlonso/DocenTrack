import { useContext } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { BookOpen, BarChart3, Settings, LogOut, UserCircle } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const NavItem = ({ to, icon: Icon, label, disabled = false }) => {
    const isActive = location.pathname.startsWith(to);
    
    if (disabled) {
      return (
        <div className="flex items-center gap-3 px-4 py-3 text-slate-500 cursor-not-allowed">
          <Icon size={20} />
          <span className="font-medium">{label}</span>
          <span className="ml-auto text-xs bg-slate-800 text-slate-400 py-1 px-2 rounded-md">Próximamente</span>
        </div>
      );
    }

    return (
      <Link 
        to={to} 
        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
          isActive 
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20' 
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
      >
        <Icon size={20} className={isActive ? 'text-indigo-200' : 'text-slate-400'} />
        <span className="font-medium">{label}</span>
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <aside className="w-72 bg-slate-950 text-white flex flex-col border-r border-slate-800 shadow-xl z-20">
        <div className="p-6 flex items-center gap-3">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <BookOpen size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">DocenTrack</h1>
            <p className="text-xs text-indigo-300 font-medium">Evaluación Docente</p>
          </div>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4 px-4">
            Menú Principal
          </div>
          
          {user?.profile?.role === 'ALUMNO' && (
            <NavItem to="/alumno/dashboard" icon={BookOpen} label="Mis Asignaturas" />
          )}
          
          {user?.profile?.role === 'PROFESOR' && (
            <NavItem to="/profesor/dashboard" icon={BarChart3} label="Resultados UI" />
          )}
          
          {user?.profile?.role === 'ADMIN' && (
            <NavItem to="/admin" icon={Settings} label="Panel Admin" disabled />
          )}
        </nav>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-slate-800 p-2 rounded-full border border-slate-700">
              <UserCircle size={24} className="text-indigo-400" />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-semibold text-white truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-slate-400 truncate">
                Rol: {user?.profile?.role}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-slate-800 text-slate-300 hover:bg-red-500/10 hover:text-red-400 border border-slate-700 hover:border-red-500/30 rounded-xl transition-all"
          >
            <LogOut size={18} />
            <span className="font-medium">Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto w-full relative">
        {/* Subtle top gradient */}
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none -z-10"></div>
        <div className="p-8 md:p-12 max-w-7xl mx-auto min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
