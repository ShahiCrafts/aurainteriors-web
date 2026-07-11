import api from './index';

export const uploadDocument = async (file) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post('/documents', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const listDocuments = async ({ page = 1, limit = 20 } = {}) => {
    const params = new URLSearchParams();
    params.append('page', page);
    params.append('limit', limit);

    const response = await api.get(`/documents?${params}`);
    return response.data;
};

export const deleteDocument = async (id) => {
    const response = await api.delete(`/documents/${id}`);
    return response.data;
};

export const retryDocument = async (id) => {
    const response = await api.post(`/documents/${id}/retry`);
    return response.data;
};
