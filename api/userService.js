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
      const response = await api.put('/me/update', userData);
      return response;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error.response || { message: 'Lỗi kết nối đến server' };
    }
  },

  // Upload avatar
  uploadAvatar: async (formData) => {
    try {
      const response = await api.put('/me/avatar', {
        avatarUrl: formData.get('avatar')
      });
      return response;
    } catch (error) {
      console.error('Upload avatar error:', error);
      throw error.response || { message: 'Lỗi kết nối đến server' };
    }
  },

  /**
   * Tìm kiếm người dùng theo username
   * @param {string} username - Username cần tìm
   */
  searchByUsername: async (username) => {
    try {
      if (!username || username.trim() === '') {
        return { data: [] };
      }
      
      // Sử dụng đúng endpoint từ UserController: /search/username/:username
      console.log(`Tìm kiếm người dùng với username: "${username}"`);
      const response = await api.get(`/users/search/username/${encodeURIComponent(username)}`);
      console.log('Kết quả tìm kiếm theo username:', response);
      return response;
    } catch (error) {
      console.error('Error searching by username:', error);
      return { data: [] };
    }
  },
  
  /**
   * Tìm kiếm người dùng theo ID
   * @param {string} userId - ID người dùng cần tìm
   */
  searchById: async (userId) => {
    try {
      if (!userId) {
        return { data: null };
      }
      
      // Sử dụng đúng endpoint từ UserController: /search/id/:userId
      const response = await api.get(`/search/id/${userId}`);
      return response;
    } catch (error) {
      console.error('Error searching by ID:', error);
      return { data: null };
    }
  },
  
  /**
   * Tìm kiếm người dùng (hàm chung)
   * @param {string} query - Từ khóa tìm kiếm (có thể là username hoặc query string)
   */
  searchUsers: async (query = '') => {
    try {
      if (!query || query.trim() === '') {
        return { data: [] };
      }
      
      console.log(`Tìm kiếm người dùng với query: "${query}"`);
      
      // Kiểm tra xem query có phải là email hay không
      if (query.includes('@')) {
        // Nếu là email, sử dụng endpoint tìm kiếm theo username
        return await userService.searchByUsername(query);
      } else {
        // Nếu không phải email, thử gọi API /users/search với query params
        try {
          const response = await api.get('/users/search', {
            params: { q: query.trim() }
          });
          console.log('Kết quả tìm kiếm API:', response);
          return response;
        } catch (searchError) {
          console.error('Error with /users/search:', searchError);
          
          // Thử phương án dự phòng - tìm kiếm theo username
          console.log('Thử tìm kiếm dự phòng theo username');
          return await userService.searchByUsername(query);
        }
      }
    } catch (error) {
      console.error('Error searching users:', error);
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      }
      return { data: [] };
    }
  },

  // Lấy thông tin chi tiết của một người dùng
  getUserById: async (userId) => {
    try {
      // Sử dụng endpoint có sẵn từ backend
      const response = await api.get(`/search/id/${userId}`);
      return response;
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw error.response || { message: 'Lỗi kết nối đến server' };
    }
  },
  
  // Lấy thông tin profile của người dùng hiện tại
  getUserProfile: async (username) => {
    try {
      console.log('Calling API with username:', username);
      
      // Đảm bảo sử dụng đúng username trong database
      let fullUsername = username;
      if (!username.includes('@') && !username.startsWith('@')) {
        fullUsername = `${username}@gmail.com`;
        console.log('Converting to full email:', fullUsername);
      }
      
      const response = await api.get(`/auth/users/${encodeURIComponent(fullUsername)}`);
      console.log('API response successful:', response);
      
      return response;
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
      
      let fullUsername = username;
      if (!username.includes('@')) {
        fullUsername = `${username}@gmail.com`;
      }
      
      const response = await api.post('/auth/change-password', { 
        username: fullUsername, 
        oldPassword, 
        newPassword 
      });
      return response;
    } catch (error) {
      console.error('Password change error:', error);
      throw error.response || { message: 'Lỗi khi thay đổi mật khẩu' };
    }
  },
  
  // Lấy gợi ý kết bạn
  getSuggestedUsers: async () => {
    try {
      // Kiểm tra xem backend có sẵn API này không, nếu không thì cần cập nhật
      const response = await api.get('/users/suggestions');
      return response;
    } catch (error) {
      console.error('Error getting suggested users:', error);
      return { data: [] };
    }
  }
};

// Export default cho tương thích ngược
export default userService;

// Trong FriendSuggestionsScreen.js
const handleSearch = async () => {
  try {
    setIsSearching(true);
    const results = await userService.searchUsers(searchText);
    console.log('Search results:', results);
    
    if (results && results.data) {
      setSuggestedUsers(Array.isArray(results.data) ? results.data : [results.data]);
    }
  } catch (error) {
    console.error('Search error:', error);
    Alert.alert('Lỗi', 'Không thể tìm kiếm người dùng');
  } finally {
    setIsSearching(false);
  }
};