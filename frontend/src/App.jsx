import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import RutaProtegida from './routes/RutaProtegida.jsx';
import LayoutPrincipal from './layouts/LayoutPrincipal.jsx';
import LoginPage from './pages/LoginPage.jsx';
import ConsultaPage from './pages/ConsultaPage.jsx';
import DocumentoPage from './pages/DocumentoPage.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RutaProtegida />}>
          <Route element={<LayoutPrincipal />}>
            <Route path="/" element={<Navigate to="/consulta" replace />} />
            <Route path="/consulta" element={<ConsultaPage />} />
            <Route path="/documentos/:id" element={<DocumentoPage />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/consulta" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
