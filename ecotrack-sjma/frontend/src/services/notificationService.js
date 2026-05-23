import api from './api';

const notificationService = {
  getAll() {
    return api.get('/notifications').then(r => r.data);
  },

  getUnreadCount() {
    return api.get('/notifications/unread-count').then(r => r.data);
  },

  markAsRead(id) {
    return api.put(`/notifications/${id}/read`).then(r => r.data);
  },

  delete(id) {
    return api.delete(`/notifications/${id}`).then(r => r.data);
  },
};

export default notificationService;
