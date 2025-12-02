import api from './api';

export const verifyService = {
  verifyByQR: (qrData) => api.post('/verify/qr', { qrData }),
  verifyById: (type, id, hash, ipfsHash) => 
    api.post(`/verify/${type}/${id}`, { hash, ipfsHash }),
  getVerificationHistory: (credentialId) => 
    api.get(`/verify/history/${credentialId}`),
  getStats: () => api.get('/verify/stats')
};


