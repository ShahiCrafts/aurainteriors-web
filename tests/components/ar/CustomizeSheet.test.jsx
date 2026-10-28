// FE-21 — CustomizeSheet: a colour name outside the hardcoded
// COLOR_HEX_MAP updated the customization label but silently never
// recoloured the model (grey swatch, tap "vibrates" as if applied).
// Unknown colours must be treated as unavailable: the swatch is
// disabled and tapping it changes nothing.
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CustomizeSheet from "../../../src/components/ar/components/CustomizeSheet.jsx";

const product = {
  _id: "prod-a",
  name: "Chair A",
  price: 10000,
  colors: ["Walnut", "Chartreuse Mystery"],
  materials: [],
  images: [],
};

function renderSheet(props = {}) {
  const handlers = {
    onCustomize: vi.fn(),
    setModelColor: vi.fn(),
    triggerHaptic: vi.fn(),
    ...props,
  };
  render(
    <CustomizeSheet
      show
      onClose={vi.fn()}
      selectedProduct={product}
      customization={{}}
      currentAnchor="anchor-1"
      getProductImage={() => null}
      calculateTotalPrice={() => 10000}
      {...handlers}
    />,
  );
  return handlers;
}

describe("CustomizeSheet unknown colours (FE-21)", () => {
  it("a colour outside the hex map is disabled and tapping it applies nothing", () => {
    const { onCustomize, setModelColor, triggerHaptic } = renderSheet();
    const swatch = screen.getByRole("button", { name: /Chartreuse Mystery/ });
    expect(swatch).toBeDisabled();
    fireEvent.click(swatch);
    expect(onCustomize).not.toHaveBeenCalled();
    expect(setModelColor).not.toHaveBeenCalled();
    expect(triggerHaptic).not.toHaveBeenCalled();
  });

  it("a known colour still applies: label updates and the model is recoloured with its hex", () => {
    const { onCustomize, setModelColor } = renderSheet();
    const swatch = screen.getByRole("button", { name: /Walnut/ });
    expect(swatch).not.toBeDisabled();
    fireEvent.click(swatch);
    expect(onCustomize).toHaveBeenCalledWith({ color: "Walnut" });
    // walnut in COLOR_HEX_MAP
    expect(setModelColor).toHaveBeenCalledWith("anchor-1", "#5D432C");
  });
});
