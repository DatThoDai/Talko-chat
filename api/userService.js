import api from './axios';

// User profile services
export const userService = {
  // Lấy thông tin người dùng theo ID
  fetchUser: async (userId) => {
    try {
      const response = await api.get(`/users/${userId}`);
      return response;
    } catch (error) {
      throw error.response || { message: 'Lỗi kết nối đến server' };
    }
  },

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
  },
  
  // Lấy thông tin profile của người dùng hiện tại từ CNM_Chat-test
  getUserProfile: async (username) => {
    try {
      console.log('Calling API with username:', username);
      
      // Đảm bảo sử dụng đúng username trong database
      // Nếu username được cung cấp không phải là email đầy đủ, thêm @gmail.com
      let fullUsername = username;
      if (!username.includes('@')) {
        fullUsername = `${username}@gmail.com`;
        console.log('Converting to full email:', fullUsername);
      }
      
      const response = await api.get(`/auth/users/${fullUsername}`);
      console.log('API response successful:', response);
      return response; // axios.js đã trả về response.data trực tiếp
    } catch (error) {
      console.error('API error:', error);
      if (error.response) {
        console.error('Error response:', error.response);
      }
      throw error.response || { message: 'Lỗi khi lấy thông tin người dùng' };
    }
  },
  
  // Thay đổi mật khẩu người dùng
  changePassword: async (oldPassword, newPassword, username) => {
    try {
      console.log('Changing password for user:', username);
      
      // Đảm bảo sử dụng đúng username trong database
      // Nếu username được cung cấp không phải là email đầy đủ, thêm @gmail.com
      let fullUsername = username;
      if (!username.includes('@')) {
        fullUsername = `${username}@gmail.com`;
        console.log('Converting to full email for password change:', fullUsername);
      }
      
      const response = await api.post('/auth/change-password', { 
        username: fullUsername, 
        oldPassword, 
        newPassword 
      });
      console.log('Password change response:', response);
      return response; // axios.js đã trả về response.data trực tiếp
    } catch (error) {
      console.error('Password change error:', error);
      if (error.response) {
        console.error('Error response details:', error.response);
      }
      throw error.response || { message: 'Lỗi khi thay đổi mật khẩu' };
    }
  }
};

// Export default cho tương thích ngược
export default userService;