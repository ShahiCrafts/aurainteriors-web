// Phase 6 (REUSE-013) — addressApi return-shape normalisation.
// The module used to return the raw axios response; it now resolves
// to the response body, matching cartApi/orderApi. These tests pin
// the new contract (and that path encoding survived the rewrite).
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../../src/api/index.js", () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

import api from "../../src/api/index.js";
import * as addressApi from "../../src/api/addressApi.js";

beforeEach(() => {
  vi.clearAllMocks();
  api.get.mockResolvedValue({
    data: { status: "success", data: { addresses: [] } },
  });
  api.post.mockResolvedValue({
    data: { status: "success", data: { address: {} } },
  });
  api.patch.mockResolvedValue({
    data: { status: "success", data: { address: {} } },
  });
  api.delete.mockResolvedValue({ data: { status: "success" } });
});

describe("addressApi normalised shape (Phase 6)", () => {
  it("getAllAddresses resolves to the body, not the raw response", async () => {
    await expect(addressApi.getAllAddresses()).resolves.toEqual({
      status: "success",
      data: { addresses: [] },
    });
    expect(api.get).toHaveBeenCalledWith("/addresses");
  });

  it("getAddress resolves to the body and encodes the id", async () => {
    await expect(addressApi.getAddress("a/b")).resolves.toEqual({
      status: "success",
      data: { addresses: [] },
    });
    expect(api.get).toHaveBeenCalledWith("/addresses/a%2Fb");
  });

  it("createAddress resolves to the body", async () => {
    await expect(addressApi.createAddress({ city: "KTM" })).resolves.toEqual({
      status: "success",
      data: { address: {} },
    });
    expect(api.post).toHaveBeenCalledWith("/addresses", { city: "KTM" });
  });

  it("updateAddress / deleteAddress / setDefaultAddress resolve to the body", async () => {
    await expect(addressApi.updateAddress("id 1", {})).resolves.toEqual({
      status: "success",
      data: { address: {} },
    });
    expect(api.patch).toHaveBeenCalledWith("/addresses/id%201", {});
    await expect(addressApi.deleteAddress("id 1")).resolves.toEqual({
      status: "success",
    });
    await expect(addressApi.setDefaultAddress("id 1")).resolves.toEqual({
      status: "success",
      data: { address: {} },
    });
    expect(api.patch).toHaveBeenCalledWith("/addresses/id%201/set-default");
  });
});
