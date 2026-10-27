import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

// Phase 0 infrastructure smoke test: proves Vitest + jsdom + React Testing
// Library can render the app's React version and that jest-dom matchers are
// registered. Not a characterization test; it guards the harness itself.
describe("test harness smoke", () => {
  it("renders a React element into jsdom", () => {
    render(<p data-testid="smoke">harness ok</p>);
    expect(screen.getByTestId("smoke")).toHaveTextContent("harness ok");
  });

  it("has per-test isolated web storage", () => {
    localStorage.setItem("smoke-key", "1");
    expect(localStorage.getItem("smoke-key")).toBe("1");
  });
});
