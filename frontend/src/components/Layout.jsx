import { useContext, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import {
  BookOpen,
  ClipboardList,
  BarChart3,
  Settings,
  LogOut,
  UserCircle,
  Plus,
  UserPlus,
  PanelLeftClose,
  PanelLeftOpen,
  House,
} from 'lucide-react';
import CreateClassSurveyDialog from './CreateClassSurveyDialog';
import JoinClassDialog from './JoinClassDialog';
import { emitDocentrackRefresh } from '../utils/docentrackEvents';

const Layout = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(window.innerWidth < 1024);
  const [logoHovered, setLogoHovered] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const role = user?.profile?.role;
  const homePath =
    role === 'ALUMNO' ? '/alumno' : role === 'PROFESOR' ? '/profesor/clases' : '/admin/inicio';

  const NavItem = ({ to, icon: Icon, label }) => {
    const isActive = location.pathname === to || location.pathname.startsWith(`${to}/`);
    return (
      <Link
        to={to}
        className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} px-4 py-3 rounded-xl transition-all ${
          isActive
            ? 'bg-indigo-600 text-white shadow-md shadow-indigo-900/20'
            : 'text-slate-300 hover:bg-slate-800 hover:text-white'
        }`}
        title={collapsed ? label : undefined}
      >
        <Icon size={20} className={isActive ? 'text-indigo-200' : 'text-slate-400'} />
        {!collapsed && <span className="font-medium">{label}</span>}
      </Link>
    );
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <aside className={`${collapsed ? 'w-24' : 'w-72'} bg-slate-950 text-white flex flex-col border-r border-slate-800 shadow-xl z-20 transition-all`}>
        <div className="p-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => {
              if (collapsed) {
                setCollapsed(false);
                return;
              }
              navigate(homePath);
            }}
            onMouseEnter={() => setLogoHovered(true)}
            onMouseLeave={() => setLogoHovered(false)}
            className="flex items-center gap-3 hover:opacity-90 transition-opacity"
          >
            <div className="bg-indigo-600 p-2 rounded-lg">
              {collapsed && logoHovered ? (
                <PanelLeftOpen size={24} className="text-white" />
              ) : (
                <BookOpen size={24} className="text-white" />
              )}
            </div>
            {!collapsed && (
              <div>
                <h1 className="text-xl font-bold tracking-tight">DocenTrack</h1>
                <p className="text-xs text-indigo-300 font-medium">Evaluacion Docente</p>
              </div>
            )}
          </button>
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className={`hidden lg:flex p-2 rounded-lg hover:bg-slate-800 ${collapsed ? 'invisible' : ''}`}
          >
            {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
          </button>
        </div>

        <Link to={homePath} className="px-4 pb-3 flex items-center gap-3 hover:opacity-90 transition-opacity lg:hidden">
          <div className="bg-indigo-600 p-2 rounded-lg">
            <BookOpen size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">DocenTrack</h1>
            <p className="text-xs text-indigo-300 font-medium">Evaluación Docente</p>
          </div>
        </Link>

        <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
          <NavItem to={homePath} icon={House} label="Inicio" />

          {role === 'ALUMNO' && (
            <>
              <NavItem to="/alumno/clases" icon={BookOpen} label="Mis clases" />
              <NavItem to="/alumno/encuestas" icon={ClipboardList} label="Encuestas" />
            </>
          )}

          {role === 'PROFESOR' && (
            <>
              <NavItem to="/profesor/clases" icon={BookOpen} label="Mis clases" />
              <NavItem to="/profesor/encuestas" icon={ClipboardList} label="Mis encuestas" />
              <NavItem to="/profesor/dashboard" icon={BarChart3} label="Analítica global" />
            </>
          )}

          {role === 'ADMIN' && (
            <NavItem to="/admin/inicio" icon={Settings} label="Administración" />
          )}
        </nav>

        <div className="p-6 border-t border-slate-800 bg-slate-900/50">
          {role === 'PROFESOR' && (
            <button
              type="button"
              onClick={() => setCreateOpen(true)}
              className="flex items-center justify-center gap-2 w-full mb-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/30"
              aria-label="Crear clase o encuesta"
            >
              <Plus size={22} strokeWidth={2.5} />
              {!collapsed && <span>Crear</span>}
            </button>
          )}

          {role === 'ALUMNO' && (
            <button
              type="button"
              onClick={() => setJoinOpen(true)}
              className="flex items-center justify-center gap-2 w-full mb-4 py-3 rounded-xl bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-900/30"
              aria-label="Unirme a una clase"
            >
              <UserPlus size={22} strokeWidth={2.5} />
              {!collapsed && <span>Unirme</span>}
            </button>
          )}

          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} mb-6`}>
            <div className="bg-slate-800 p-2 rounded-full border border-slate-700">
              <UserCircle size={24} className="text-indigo-400" />
            </div>
            <div className={`overflow-hidden ${collapsed ? 'hidden' : ''}`}>
              <p className="text-sm font-semibold text-white truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-slate-400 truncate">Rol: {user?.profile?.role}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className={`flex items-center justify-center ${collapsed ? '' : 'gap-2'} w-full px-4 py-2.5 bg-slate-800 text-slate-300 hover:bg-red-500/10 hover:text-red-400 border border-slate-700 hover:border-red-500/30 rounded-xl transition-all`}
          >
            <LogOut size={18} />
            {!collapsed && <span className="font-medium">Cerrar sesión</span>}
          </button>
        </div>
      </aside>

      <CreateClassSurveyDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        navigate={navigate}
        onSuccess={() => emitDocentrackRefresh()}
      />
      <JoinClassDialog open={joinOpen} onClose={() => setJoinOpen(false)} />

      <main className="flex-1 overflow-y-auto w-full relative">
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none -z-10" />
        <div className="p-8 md:p-12 max-w-7xl mx-auto min-h-full">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
