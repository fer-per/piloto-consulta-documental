import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';
import LoginPage from './pages/LoginPage.jsx';
import BusquedaPage from './pages/BusquedaPage.jsx';

function RutaPrivada({ children }) {
  const { usuario } = useAuth();
  return usuario ? children : <Navigate to="/login" replace />;
}

function Inicio() {
  const { usuario } = useAuth();
  return <Navigate to={usuario ? '/busqueda' : '/login'} replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/busqueda"
            element={
              <RutaPrivada>
                <BusquedaPage />
              </RutaPrivada>
            }
          />
          <Route path="/" element={<Inicio />} />
          <Route path="*" element={<Inicio />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
