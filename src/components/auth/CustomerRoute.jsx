import { Navigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";

export default function CustomerRoute({ children }) {
  const { loading, isAuthenticated, user } = useAuthStore();
  if (loading) return null;

  if (isAuthenticated && user?.role === "admin") {
    return <Navigate to="/admin" replace />;
  }

  return children;
}
