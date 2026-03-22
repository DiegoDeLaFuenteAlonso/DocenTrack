import { useContext, useEffect, useState, useRef } from 'react';
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
  Menu,
  X,
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
  const [_collapsed, setCollapsed] = useState(window.innerWidth < 1280);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logoHovered, setLogoHovered] = useState(false);

  const collapsed = isMobile ? false : _collapsed;

  const mainRef = useRef(null);
  const [showTopbar, setShowTopbar] = useState(true);
  const topbarTimer = useRef(null);

  const handleUserActivity = () => {
    if (!isMobile || !mainRef.current) return;
    setShowTopbar(true);
    if (topbarTimer.current) clearTimeout(topbarTimer.current);
    
    topbarTimer.current = setTimeout(() => {
      if (mainRef.current && mainRef.current.scrollTop >= 20) {
        setShowTopbar(false);
      }
    }, 500);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const role = user?.profile?.role;
  const homePath =
    role === 'ALUMNO' ? '/alumno' : role === 'PROFESOR' ? '/profesor/clases' : '/admin/inicio';

  useEffect(() => {
    const onResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      if (!mobile) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [location.pathname, isMobile]);

  const renderNavItem = (to, Icon, label, exact = false) => {
    const isActive = exact
      ? location.pathname === to
      : location.pathname === to || location.pathname.startsWith(`${to}/`);
    return (
      <Link
        key={to}
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

  const SidebarContent = (
    <>
      <div className="p-4 flex items-center justify-between">
        <button
          type="button"
          onClick={() => {
            if (collapsed && !isMobile) {
              setCollapsed(false);
              return;
            }
            navigate(homePath);
            if (isMobile) setMobileOpen(false);
          }}
          onMouseEnter={() => setLogoHovered(true)}
          onMouseLeave={() => setLogoHovered(false)}
          className="flex items-center gap-3 hover:opacity-90 transition-opacity"
        >
          <div className="bg-indigo-600 p-2 rounded-lg">
            {collapsed && !isMobile && logoHovered ? (
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
        {!isMobile && (
          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            className={`hidden lg:flex p-2 rounded-lg hover:bg-slate-800 ${collapsed ? 'invisible' : ''}`}
          >
            <PanelLeftClose size={18} />
          </button>
        )}
        {isMobile && (
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg hover:bg-slate-800"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2 overflow-y-auto">
        {renderNavItem(homePath, House, 'Inicio', true)}

        {role === 'ALUMNO' && (
          <>
            {renderNavItem('/alumno/clases', BookOpen, 'Mis clases')}
            {renderNavItem('/alumno/encuestas', ClipboardList, 'Encuestas')}
          </>
        )}

        {role === 'PROFESOR' && (
          <>
            {renderNavItem('/profesor/clases', BookOpen, 'Mis clases')}
            {renderNavItem('/profesor/encuestas', ClipboardList, 'Mis encuestas')}
            {renderNavItem('/profesor/dashboard', BarChart3, 'Analitica global')}
          </>
        )}

        {role === 'ADMIN' && renderNavItem('/admin/inicio', Settings, 'Administracion')}
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
          {!collapsed && <span className="font-medium">Cerrar sesion</span>}
        </button>
      </div>
    </>
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {!isMobile && (
        <aside
          className={`${collapsed ? 'w-24' : 'w-72'} bg-slate-950 text-white flex flex-col border-r border-slate-800 shadow-xl z-20 transition-all`}
        >
          {SidebarContent}
        </aside>
      )}

      {isMobile && (
        <>
          <div
            className={`fixed top-0 left-0 right-0 z-40 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200 text-slate-900 shadow-sm transition-transform duration-300 flex items-center h-16 px-4 ${
              showTopbar ? 'translate-y-0' : '-translate-y-full'
            }`}
          >
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-200 transition"
              aria-label="Abrir menu"
            >
              <Menu size={20} />
            </button>
            <div className="ml-4 flex items-center gap-2">
              <div className="bg-indigo-600 p-1.5 rounded-md">
                <BookOpen size={16} className="text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight">DocenTrack</span>
            </div>
          </div>
          <div
            className={`fixed inset-0 z-40 bg-slate-950/60 transition-opacity ${
              mobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setMobileOpen(false)}
          />
          <aside
            className={`fixed inset-y-0 left-0 z-50 w-[88vw] max-w-sm bg-slate-950 text-white border-r border-slate-800 rounded-r-2xl shadow-2xl transition-transform ${
              mobileOpen ? 'translate-x-0' : '-translate-x-[110%]'
            }`}
          >
            <div className="h-full flex flex-col">{SidebarContent}</div>
          </aside>
        </>
      )}

      <CreateClassSurveyDialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        navigate={navigate}
        onSuccess={() => emitDocentrackRefresh()}
      />
      <JoinClassDialog open={joinOpen} onClose={() => setJoinOpen(false)} />

      <main
        ref={mainRef}
        onScroll={handleUserActivity}
        onTouchStart={handleUserActivity}
        className="flex-1 overflow-y-auto w-full relative"
      >
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-indigo-50/50 to-transparent pointer-events-none -z-10" />
        <div className={`max-w-7xl mx-auto min-h-full ${isMobile ? 'pt-20 px-4 pb-8' : 'p-8 md:p-12'}`}>
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
