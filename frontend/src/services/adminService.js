import api from './api';

export const adminService = {
  getProfile: () => api.get('/admin/profile'),
  getPendingTranscripts: () => api.get('/admin/transcripts/pending'),
  getStudentCourses: (studentId) => api.get(`/admin/student/${studentId}/courses`),
  issueCertificate: (data) => api.post('/admin/certificate/issue', data),
  issueTranscript: (data) => api.post('/admin/transcript/issue', data),
  getAuditLogs: () => api.get('/admin/audit-logs'),
  manageUsers: (data) => api.post('/admin/users/manage', data),
  getAnalyticsOverview: () => api.get('/admin/analytics/overview'),
  getVerificationStats: () => api.get('/admin/analytics/verification')
};

