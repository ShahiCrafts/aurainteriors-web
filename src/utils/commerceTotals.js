// Batch 4 — storefront mirror of the server's commerce math
// (aurainteriors-server/services/commerceTotals.service.js). The
// SERVER is authoritative for the totals on a placed order; this
// mirror exists so checkout can show the delivery fee / VAT /
// minimum-order state live as the shopper types their address.
// The two implementations must agree: same zone rules (Kathmandu
// Valley by city/state, International for non-Nepal, else the
// default zone), same free-shipping threshold, VAT on the
// discounted goods amount, paisa rounding.

const VALLEY_CITIES = ["kathmandu", "lalitpur", "bhaktapur", "patan"];
const VALLEY_STATES = ["bagmati", "bagmati province", "province 3"];

const normalise = (value) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

export function isKathmanduValleyAddress(address) {
  if (!address) return false;
  return (
    VALLEY_CITIES.includes(normalise(address.city)) ||
    VALLEY_STATES.includes(normalise(address.state))
  );
}

export function matchShippingZone(commerce, address) {
  const zones = (commerce?.shipping?.zones || []).filter(
    (z) => z && z.enabled && typeof z.name === "string",
  );
  if (isKathmanduValleyAddress(address)) {
    const valley = zones.find((z) => z.name === "Kathmandu Valley");
    if (valley) return valley;
  }
  const country = normalise(address?.country) || "nepal";
  if (country !== "nepal") {
    const international = zones.find((z) => z.name === "International");
    if (international) return international;
  }
  return zones.find((z) => z.name === commerce?.shipping?.defaultZone) || null;
}

export function computeDeliveryFee(commerce, address, goodsAmount) {
  const shipping = commerce?.shipping || {};
  if (!shipping.enabled) return 0;
  const threshold = commerce?.freeShippingThreshold;
  if (
    typeof threshold === "number" &&
    threshold > 0 &&
    goodsAmount >= threshold
  ) {
    return 0;
  }
  const zone = matchShippingZone(commerce, address);
  if (!zone) return 0;
  const rate = Number(zone.rate);
  return Number.isFinite(rate) && rate > 0 ? rate : 0;
}

export function computeVat(commerce, goodsAmount) {
  const tax = commerce?.tax || {};
  if (!tax.vatEnabled) return 0;
  const rate = Number(tax.vatRate);
  if (!Number.isFinite(rate) || rate <= 0) return 0;
  return Math.round(goodsAmount * rate) / 100;
}
