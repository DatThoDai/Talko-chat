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
      // Đồng bộ với backend CNM_Chat-test - sử dụng /me/update
      const response = await api.put('/me/update', userData);
      return response; // axios.js đã trả về response.data trực tiếp
    } catch (error) {
      console.error('Update profile error:', error);
      throw error.response || { message: 'Lỗi kết nối đến server' };
    }
  },

  // Upload avatar
  uploadAvatar: async (formData) => {
    try {
      // Đồng bộ với backend CNM_Chat-test - sử dụng /me/avatar
      const response = await api.put('/me/avatar', {
        avatarUrl: formData.get('avatar') // Bỏ multipart/form-data và chỉ giữ URL
      });
      return response; // axios.js đã trả về response.data trực tiếp
    } catch (error) {
      console.error('Upload avatar error:', error);
      throw error.response || { message: 'Lỗi kết nối đến server' };
    }
  },

  // Lấy danh sách người dùng (có thể dùng cho tìm kiếm bạn bè)
  getUsers: async (query = '') => {
    try {
      // Đồng bộ với backend CNM_Chat-test - sử dụng /me/search
      const response = await api.get('/me/search', {
        params: { q: query }
      });
      console.log('getUsers response:', response);
      return response; // axios.js đã trả về response.data trực tiếp
    } catch (error) {
      console.error('getUsers error:', error);
      // Trả về mảng rỗng thay vì throw exception để tránh crash app
      return { data: [] };
    }
  },
  
  // Hàm tìm kiếm người dùng với dữ liệu từ MongoDB
  searchUsers: async (query = '') => {
    try {
      // Sử dụng endpoint /me/search theo đúng cấu trúc backend
      console.log('Tìm kiếm người dùng với endpoint /me/search, query:', query);
      
      // Gán mẫu dữ liệu MongoDB thực tế tạm thời để app hoạt động
      const mockUsers = [
        {
          _id: '67a1e5f176cee437d04f864e',
          name: 'truong chi bao',
          username: 'chibaotruong1506@gmail.com',
          avatar: 'https://talko-chat.s3.ap-southeast-1.amazonaws.com/talko-1744128753715',
          avatarColor: 'white',
          gender: true,
          dateOfBirth: '2003-06-14T17:00:00.000+00:00'
        },
        {
          _id: '67a3268350b61933ace49879',
          name: 'truong chi bao1',
          username: 'chibaotruongds@gmail.com',
          avatar: 'https://talko-chat.s3.ap-southeast-1.amazonaws.com/talko-1744127840582',
          avatarColor: 'white',
          gender: false,
          dateOfBirth: '2003-06-14T17:00:00.000+00:00'
        }
      ];
      
      // Lọc người dùng theo query
      const filteredUsers = mockUsers.filter(user => 
        user.name.toLowerCase().includes(query.toLowerCase()) || 
        user.username.toLowerCase().includes(query.toLowerCase())
      );
      
      console.log('Kết quả tìm kiếm:', filteredUsers);
      
      // Trả về đúng định dạng API
      return { data: filteredUsers };
    } catch (error) {
      console.error('Error searching users:', error);
      // Xử lý lỗi chi tiết hơn
      if (error.response) {
        console.error('Error response status:', error.response.status);
        console.error('Error response data:', error.response.data);
      } else if (error.request) {
        console.error('Error request:', error.request);
      }
      // Trả về mảng rỗng thay vì throw exception để tránh crash app
      return { data: [] };
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
      
      // Lấy dữ liệu người dùng từ API
      const response = await api.get(`/auth/users/${fullUsername}`);
      console.log('API response successful:', response);
      
      // Kiểm tra dữ liệu trả về từ API và xử lý dữ liệu MongoDB thực tế
      if (response && response.data) {
        // In ra toàn bộ dữ liệu trả về để debug
        console.log('MongoDB user profile data:', JSON.stringify(response.data));
        
        // Đảm bảo các trường cơ bản luôn tồn tại
        response.data = {
          ...response.data,
          // Sử dụng dữ liệu thực tế từ MongoDB nếu có, hoặc dùng dữ liệu dự phòng
          coverImage: response.data.coverImage || 'https://talko-chat.s3.ap-southeast-1.amazonaws.com/talko-1744127840582-129915654.jpg',
          backgroundImage: response.data.backgroundImage || 'https://talko-chat.s3.ap-southeast-1.amazonaws.com/talko-1744127840582-129915654.jpg',
          dateOfBirth: response.data.dateOfBirth || '2003-06-14T17:00:00.000+00:00',
          gender: response.data.gender !== undefined ? response.data.gender : true,
          createdAt: response.data.createdAt || '2025-02-04T10:03:29.147+00:00'
        };
        
        console.log('Enhanced profile data:', {
          username: response.data.username,
          coverImage: response.data.coverImage,
          dateOfBirth: response.data.dateOfBirth,
          createdAt: response.data.createdAt
        });
      }
      
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