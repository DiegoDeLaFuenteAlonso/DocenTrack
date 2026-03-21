import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import ProtectedRoute from './context/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import DashboardAlumno from './pages/DashboardAlumno';
import EncuestaForm from './pages/EncuestaForm';
import DashboardProfesor from './pages/DashboardProfesor';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          
          <Route element={<Layout />}>
            {/* Rutas de Alumno */}
            <Route element={<ProtectedRoute allowedRoles={['ALUMNO']} />}>
              <Route path="/alumno/dashboard" element={<DashboardAlumno />} />
              <Route path="/alumno/encuesta/:campanaId/:asignaturaId" element={<EncuestaForm />} />
            </Route>

            {/* Rutas de Profesor */}
            <Route element={<ProtectedRoute allowedRoles={['PROFESOR']} />}>
              <Route path="/profesor/dashboard" element={<DashboardProfesor />} />
            </Route>

            {/* Default redirect if authenticated */}
            <Route path="/" element={<HomeRedirect />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

const HomeRedirect = () => {
  const { user, loading } = React.useContext(AuthContext);
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (user.profile?.role === 'ALUMNO') return <Navigate to="/alumno/dashboard" replace />;
  if (user.profile?.role === 'PROFESOR') return <Navigate to="/profesor/dashboard" replace />;
  return <Navigate to="/login" replace />;
};

export default App;
