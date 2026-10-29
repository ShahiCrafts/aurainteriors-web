import { beforeEach, describe, expect, it } from "vitest";

// Unit tests for src/store/loadingStore.js — the global loading
// indicator store. Plain zustand; state is reset between cases.

import useLoadingStore from "../../src/store/loadingStore.js";

const state = () => useLoadingStore.getState();

beforeEach(() => {
  useLoadingStore.setState({ isLoading: false, message: "" });
});

describe("loadingStore", () => {
  it("should start idle with no message", () => {
    expect(state().isLoading).toBe(false);
    expect(state().message).toBe("");
  });

  it("should show loading with the given message when showLoading is called", () => {
    state().showLoading("Saving your order…");

    expect(state().isLoading).toBe(true);
    expect(state().message).toBe("Saving your order…");
  });

  it("should show loading with an empty message when showLoading is called without one", () => {
    state().showLoading();

    expect(state().isLoading).toBe(true);
    expect(state().message).toBe("");
  });

  it("should hide loading and clear the message when hideLoading is called", () => {
    state().showLoading("Working…");

    state().hideLoading();

    expect(state().isLoading).toBe(false);
    expect(state().message).toBe("");
  });
});
