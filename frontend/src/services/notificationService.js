import api from './api';

export const notificationService = {
  list: () => api.get('/notifications'),
  listUnread: () => api.get('/notifications?unread=true'),
  create: (data) => api.post('/notifications', data),
  markRead: (id) => api.post(`/notifications/${id}/read`),
  markAllRead: () => api.post('/notifications/read-all')
};
