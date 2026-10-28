import { Navigate } from "react-router-dom";
import useAuthStore from "../../store/authStore";
import { useShallow } from "zustand/react/shallow";

export default function ProtectedRoute({ children }) {
  const { loading, isAuthenticated } = useAuthStore(
    useShallow((state) => ({
      loading: state.loading,
      isAuthenticated: state.isAuthenticated,
    })),
  );
  if (loading) return null;

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // FE-16: authenticated admins render the children — the previous bounce
  // to the /admin path targeted a route that does not exist in the customer app
  // (404 catch-all), and no admin-origin config exists in this codebase.
  return children;
}
