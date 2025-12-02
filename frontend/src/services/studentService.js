import api from './api';

export const studentService = {
  getProfile: () => api.get('/student/profile'),
  getAcademicHistory: () => api.get('/student/academic-history'),
  requestTranscript: () => api.post('/student/transcript/request'),
  getTranscripts: () => api.get('/student/transcripts'),
  getCertificates: () => api.get('/student/certificates'),
  downloadCredential: (type, id) => api.get(`/student/credential/${type}/${id}`),
  grantAccess: (data) => api.post('/student/access/grant', data),
  revokeAccess: (data) => api.post('/student/access/revoke', data)
};


