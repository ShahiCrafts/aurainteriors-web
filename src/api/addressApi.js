import api from './index';

export const getAllAddresses = () => api.get('/addresses');
export const getAddress = (id) => api.get(`/addresses/${encodeURIComponent(id)}`);
export const createAddress = (data) => api.post('/addresses', data);
export const updateAddress = (id, data) => api.patch(`/addresses/${encodeURIComponent(id)}`, data);
export const deleteAddress = (id) => api.delete(`/addresses/${encodeURIComponent(id)}`);
export const setDefaultAddress = (id) => api.patch(`/addresses/${encodeURIComponent(id)}/set-default`);
