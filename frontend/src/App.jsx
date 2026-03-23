import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ProtectedRoute from './context/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardProfesor from './pages/DashboardProfesor';
import EncuestaForm from './pages/EncuestaForm';
import AdminHomePage from './pages/AdminHomePage';
import ProfesorClasesPage from './pages/profesor/ProfesorClasesPage';
import ProfesorClaseDetailPage from './pages/profesor/ProfesorClaseDetailPage';
import ProfesorEncuestasPage from './pages/profesor/ProfesorEncuestasPage';
import ProfesorEncuestaDetailPage from './pages/profesor/ProfesorEncuestaDetailPage';
import ProfesorEncuestaCreatePage from './pages/profesor/ProfesorEncuestaCreatePage';
import ProfesorHomePage from './pages/profesor/ProfesorHomePage';
import AlumnoHomePage from './pages/alumno/AlumnoHomePage';
import AlumnoClasesPage from './pages/alumno/AlumnoClasesPage';
import AlumnoClaseDetailPage from './pages/alumno/AlumnoClaseDetailPage';
import AlumnoEncuestasPage from './pages/alumno/AlumnoEncuestasPage';
import AlumnoEncuestaClasePage from './pages/alumno/AlumnoEncuestaClasePage';
import LandingPage from './pages/LandingPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />

          <Route element={<Layout />}>
            <Route element={<ProtectedRoute allowedRoles={['ALUMNO']} />}>
              <Route path="/alumno" element={<AlumnoHomePage />} />
              <Route
                path="/alumno/dashboard"
                element={<Navigate to="/alumno" replace />}
              />
              <Route path="/alumno/clases" element={<AlumnoClasesPage />} />
              <Route
                path="/alumno/clases/:claseId"
                element={<AlumnoClaseDetailPage />}
              />
              <Route
                path="/alumno/encuestas"
                element={<AlumnoEncuestasPage />}
              />
              <Route
                path="/alumno/encuestas/:encuestaId"
                element={<AlumnoEncuestaClasePage />}
              />
              <Route
                path="/alumno/encuesta/:campanaId/:asignaturaId"
                element={<EncuestaForm />}
              />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['PROFESOR']} />}>
              <Route path="/profesor" element={<ProfesorHomePage />} />
              <Route path="/profesor/clases" element={<ProfesorClasesPage />} />
              <Route
                path="/profesor/clases/:claseId"
                element={<ProfesorClaseDetailPage />}
              />
              <Route
                path="/profesor/encuestas"
                element={<ProfesorEncuestasPage />}
              />
              <Route
                path="/profesor/encuestas/nueva"
                element={<ProfesorEncuestaCreatePage />}
              />
              <Route
                path="/profesor/encuestas/:encuestaId"
                element={<ProfesorEncuestaDetailPage />}
              />
              <Route
                path="/profesor/dashboard"
                element={<DashboardProfesor />}
              />
            </Route>

            <Route element={<ProtectedRoute allowedRoles={['ADMIN']} />}>
              <Route path="/admin/inicio" element={<AdminHomePage />} />
            </Route>

            <Route path="/app" element={<HomeRedirect />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

const HomeRedirect = () => {
  const { user, loading } = React.useContext(AuthContext);
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-slate-500">
        Cargando…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  const role = user.profile?.role;
  if (role === 'ALUMNO') return <Navigate to="/alumno" replace />;
  if (role === 'PROFESOR') return <Navigate to="/profesor" replace />;
  if (role === 'ADMIN') return <Navigate to="/admin/inicio" replace />;
  return <Navigate to="/login" replace />;
};

export default App;
