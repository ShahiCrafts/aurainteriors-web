import { Navigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { useShallow } from "zustand/react/shallow";

export default function AdminRoute({ children }) {
  const { loading, isAuthenticated, user } = useAuthStore(useShallow((state) => ({ loading: state.loading, isAuthenticated: state.isAuthenticated, user: state.user })));
  if (loading) return null;

  if (!isAuthenticated || user?.role !== "admin") {
    return <Navigate to="/login" replace />;
  }

  return children;
}
