import { Navigate, useLocation, useParams } from "react-router-dom";
import { shopCategoryUrl } from "../../utils/shopFilters";

export default function LegacyShopCategoryRedirect() {
  const { categorySlug } = useParams();
  const { search, hash } = useLocation();
  return <Navigate replace to={shopCategoryUrl(categorySlug, search, hash)} />;
}
