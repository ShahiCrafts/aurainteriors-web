// Batch 2 — SecretKeyControl: secret inputs are never prefilled, status
// text reflects the server describe (source + masked tail), empty save is
// a no-op, Remove only exists for admin-stored secrets, and Test shows
// the server's result inline. The API layer is mocked — no real network.
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("../../../../src/api/integrationsApi.js", () => ({
  default: {
    getIntegrations: vi.fn(),
    getSettings: vi.fn(),
    updateSettingsSection: vi.fn(),
    saveSecret: vi.fn(),
    deleteSecret: vi.fn(),
    testSecret: vi.fn(),
  },
}));

vi.mock("../../../../src/lib/toast", () => ({
  toast: Object.assign(vi.fn(), {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    warning: vi.fn(),
  }),
}));

import integrationsApi from "../../../../src/api/integrationsApi.js";
import SecretKeyControl from "../../../../src/components/admin/integrations/SecretKeyControl.jsx";

const ADMIN_DESCRIBE = {
  service: "ai.groq",
  configured: true,
  source: "admin",
  masked: "••••ab12",
  lastTestedAt: null,
  lastTestStatus: null,
};
const ENV_DESCRIBE = {
  service: "ai.groq",
  configured: true,
  source: "env",
  masked: "••••xy34",
  lastTestedAt: null,
  lastTestStatus: null,
};
const NONE_DESCRIBE = {
  service: "ai.groq",
  configured: false,
  source: "none",
  masked: null,
  lastTestedAt: null,
  lastTestStatus: null,
};

function renderControl(describe, props = {}) {
  return render(
    <SecretKeyControl
      label="Groq API key"
      service="ai.groq"
      describe={describe}
      onDescribeChange={vi.fn()}
      {...props}
    />,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("SecretKeyControl", () => {
  it("(b) renders empty input + admin status with masked tail", () => {
    renderControl(ADMIN_DESCRIBE);
    const input = screen.getByLabelText("Groq API key");
    expect(input).toHaveValue("");
    expect(input).toHaveAttribute("type", "password");
    expect(screen.getByText(/Set in admin ••••ab12/)).toBeInTheDocument();
  });

  it("(b) renders env status as 'From server config'", () => {
    renderControl(ENV_DESCRIBE);
    expect(screen.getByLabelText("Groq API key")).toHaveValue("");
    expect(
      screen.getByText(/From server config ••••xy34/),
    ).toBeInTheDocument();
  });

  it("(b) renders 'Not set' when nothing is configured", () => {
    renderControl(NONE_DESCRIBE);
    expect(screen.getByText("Not set")).toBeInTheDocument();
  });

  it("(c) Save with a typed value calls PUT secret with { value }", async () => {
    integrationsApi.saveSecret.mockResolvedValue({
      data: { secret: { ...ADMIN_DESCRIBE, masked: "••••zz99" } },
    });
    const onDescribeChange = vi.fn();
    renderControl(NONE_DESCRIBE, { onDescribeChange });
    fireEvent.change(screen.getByLabelText("Groq API key"), {
      target: { value: "gsk_new_key" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() =>
      expect(integrationsApi.saveSecret).toHaveBeenCalledWith("ai.groq", "gsk_new_key"),
    );
    expect(onDescribeChange).toHaveBeenCalledWith(
      "ai.groq",
      expect.objectContaining({ masked: "••••zz99" }),
    );
    // Input is cleared after a successful save — the value is never kept.
    await waitFor(() =>
      expect(screen.getByLabelText("Groq API key")).toHaveValue(""),
    );
  });

  it("(d) Save with an empty input makes NO api call", () => {
    renderControl(NONE_DESCRIBE);
    const saveButton = screen.getByRole("button", { name: "Save" });
    expect(saveButton).toBeDisabled();
    fireEvent.click(saveButton);
    expect(integrationsApi.saveSecret).not.toHaveBeenCalled();
  });

  it("(e) Remove renders only for source==='admin' and calls DELETE", async () => {
    integrationsApi.deleteSecret.mockResolvedValue({
      data: { secret: NONE_DESCRIBE },
    });
    const { unmount } = renderControl(ADMIN_DESCRIBE);
    fireEvent.click(screen.getByRole("button", { name: /Remove/ }));
    await waitFor(() =>
      expect(integrationsApi.deleteSecret).toHaveBeenCalledWith("ai.groq"),
    );
    unmount();

    renderControl(ENV_DESCRIBE);
    expect(
      screen.queryByRole("button", { name: /Remove/ }),
    ).not.toBeInTheDocument();

    renderControl(NONE_DESCRIBE);
    expect(
      screen.queryByRole("button", { name: /Remove/ }),
    ).not.toBeInTheDocument();
  });

  it("(f) Test calls POST .../test and displays the returned message", async () => {
    integrationsApi.testSecret.mockResolvedValue({
      data: {
        test: { ok: true, status: "ok", message: "Connection OK", latencyMs: 42 },
      },
    });
    renderControl(ADMIN_DESCRIBE);
    fireEvent.click(screen.getByRole("button", { name: "Test" }));
    await waitFor(() =>
      expect(integrationsApi.testSecret).toHaveBeenCalledWith(
        "ai.groq",
        undefined,
      ),
    );
    expect(
      await screen.findByText(/Test passed — Connection OK \(42 ms\)/),
    ).toBeInTheDocument();
  });

  it("(f) Test with an unsaved typed value sends { value } and shows failures", async () => {
    integrationsApi.testSecret.mockResolvedValue({
      data: {
        test: { ok: false, status: "error", message: "Invalid API key", latencyMs: 7 },
      },
    });
    renderControl(NONE_DESCRIBE);
    fireEvent.change(screen.getByLabelText("Groq API key"), {
      target: { value: "bad-key" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Test" }));
    await waitFor(() =>
      expect(integrationsApi.testSecret).toHaveBeenCalledWith(
        "ai.groq",
        "bad-key",
      ),
    );
    expect(
      await screen.findByText(/Test failed — Invalid API key/),
    ).toBeInTheDocument();
  });
});
