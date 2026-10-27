import ShopChrome from "../../components/shop/ShopChrome";
import CatalogListing from "../../components/shop/CatalogListing";

export default function ShopPage() {
  return (
    <ShopChrome>
      <CatalogListing crumbPrefix={[{ name: "Shop", path: "/shop" }]} />
    </ShopChrome>
  );
}