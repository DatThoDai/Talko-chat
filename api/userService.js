import api from './axios';

// User profile services
export const userService = {
  // Cập nhật thông tin profile
  updateProfile: async (userData) => {
    try {
      const response = await api.put('/api/me', userData);
      return response; // axios.js đã trả về response.data trực tiếp
    } catch (error) {
      throw error.response || { message: 'Lỗi kết nối đến server' };
    }
  },

  // Upload avatar
  uploadAvatar: async (formData) => {
    try {
      const response = await api.put('/api/me/avatar', {
        avatarUrl: formData.get('avatar') // Bỏ multipart/form-data và chỉ giữ URL
      });
      return response; // axios.js đã trả về response.data trực tiếp
    } catch (error) {
      throw error.response || { message: 'Lỗi kết nối đến server' };
    }
  },

  // Lấy danh sách người dùng (có thể dùng cho tìm kiếm bạn bè)
  getUsers: async (query = '') => {
    try {
      const response = await api.get(`/api/me/search?q=${query}`);
      return response; // axios.js đã trả về response.data trực tiếp
    } catch (error) {
      throw error.response || { message: 'Lỗi kết nối đến server' };
    }
  },

  // Lấy thông tin chi tiết của một người dùng
  getUserById: async (userId) => {
    try {
      const response = await api.get(`/api/auth/users/${userId}`);
      return response; // axios.js đã trả về response.data trực tiếp
    } catch (error) {
      throw error.response || { message: 'Lỗi kết nối đến server' };
    }
  }
};
