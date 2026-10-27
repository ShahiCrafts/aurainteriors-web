import api from './index';

// Phase 6 (REUSE-013): return-shape normalised to the house
// contract — every function resolves to the response BODY
// (response.data), exactly like cartApi/orderApi. This module used
// to return the raw axios response, which forced its one consumer
// (hooks/profile/useAddressTan) to unwrap an extra level compared
// with every other hook. Callers now receive the same values the
// hook previously derived from the raw response.
export const getAllAddresses = async () => {
    const response = await api.get('/addresses');
    return response.data;
};
export const getAddress = async (id) => {
    const response = await api.get(`/addresses/${encodeURIComponent(id)}`);
    return response.data;
};
export const createAddress = async (data) => {
    const response = await api.post('/addresses', data);
    return response.data;
};
export const updateAddress = async (id, data) => {
    const response = await api.patch(`/addresses/${encodeURIComponent(id)}`, data);
    return response.data;
};
export const deleteAddress = async (id) => {
    const response = await api.delete(`/addresses/${encodeURIComponent(id)}`);
    return response.data;
};
export const setDefaultAddress = async (id) => {
    const response = await api.patch(`/addresses/${encodeURIComponent(id)}/set-default`);
    return response.data;
};
