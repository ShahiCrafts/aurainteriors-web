import { Navigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";

export default function ProtectedRoute({ children }) {
  const { loading, isAuthenticated, user } = useAuthStore();
  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  if (user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
