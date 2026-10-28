import api from "./index";

export const getAllAddresses = async () => {
  const response = await api.get("/addresses");
  return response.data;
};
export const getAddress = async (id) => {
  const response = await api.get(`/addresses/${encodeURIComponent(id)}`);
  return response.data;
};
export const createAddress = async (data) => {
  const response = await api.post("/addresses", data);
  return response.data;
};
export const updateAddress = async (id, data) => {
  const response = await api.patch(
    `/addresses/${encodeURIComponent(id)}`,
    data,
  );
  return response.data;
};
export const deleteAddress = async (id) => {
  const response = await api.delete(`/addresses/${encodeURIComponent(id)}`);
  return response.data;
};
export const setDefaultAddress = async (id) => {
  const response = await api.patch(
    `/addresses/${encodeURIComponent(id)}/set-default`,
  );
  return response.data;
};
