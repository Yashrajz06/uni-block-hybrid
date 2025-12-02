import api from './api';

export const facultyService = {
  getProfile: () => api.get('/faculty/profile'),
  getPendingTranscripts: () => api.get('/faculty/transcripts/pending'),
  uploadGrade: (data) => api.post('/faculty/grade/upload', data),
  uploadCourse: (data) => api.post('/faculty/course/upload', data),
  approveTranscript: (requestId) => api.post(`/faculty/transcript/approve/${requestId}`),
  rejectTranscript: (requestId) => api.post(`/faculty/transcript/reject/${requestId}`),
  getAuditLogs: () => api.get('/faculty/audit-logs')
};

