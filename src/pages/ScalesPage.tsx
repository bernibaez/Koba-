import { Navigate } from 'react-router-dom';

/** Redirecciona la antigua ruta de Balanzas a Cajas Registradoras */
export default function ScalesPage() {
  return <Navigate to="/cajas" replace />;
}
