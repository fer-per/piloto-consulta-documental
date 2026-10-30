import { useAuth } from '../context/AuthContext.jsx';
import { IconoLibro, IconoSalir } from './Iconos.jsx';

const ETIQUETA_PERFIL = {
  admin: 'Administrador',
  archivero: 'Archivista',
  viewer: 'Usuario externo',
};

export default function BarraNavegacion() {
  const { usuario, cerrarSesion } = useAuth();

  return (
    <header className="navbar-siarc">
      <div className="navbar-marca">
        <img src="/marcas/logo-ara.png" alt="Archivo Regional de Arequipa" className="navbar-logo" />
        <div className="navbar-textos">
          <p className="navbar-titulo">Sistema de consultas documentarias ARA</p>
        </div>
      </div>

      <div className="navbar-sesion">
        <div className="navbar-usuario">
          <span className="navbar-nombre">{usuario?.name}</span>
          <span className="navbar-perfil">{ETIQUETA_PERFIL[usuario?.role] ?? usuario?.perfil}</span>
        </div>
        <button type="button" className="navbar-salir" onClick={cerrarSesion}>
          <IconoSalir />
          <span>Salir</span>
        </button>
      </div>

      <div className="navbar-marca-secundaria">
        <img src="/marcas/logo-gra.png" alt="Gobierno Regional de Arequipa" className="navbar-logo-gra" />
      </div>

      <div className="navbar-movil">
        <div className="navbar-movil-usuario">
          <IconoLibro size={16} />
          <span>{usuario?.name}</span>
        </div>
        <button type="button" className="navbar-salir" onClick={cerrarSesion} aria-label="Cerrar sesión">
          <IconoSalir />
        </button>
      </div>
    </header>
  );
}
