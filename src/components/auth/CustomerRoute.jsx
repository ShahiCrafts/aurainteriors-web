import useAuthStore from "../../store/authStore";
import { useShallow } from "zustand/react/shallow";

export default function CustomerRoute({ children }) {
  const { loading } = useAuthStore(useShallow((state) => ({ loading: state.loading })));
  if (loading) return null;

  // FE-16: admins are no longer bounced to the /admin path — that route does not
  // exist in the customer app (it rendered the 404 catch-all) and no
  // admin-origin config exists in this codebase. Admins render the
  // customer pages like any other visitor.
  return children;
}
