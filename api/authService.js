import api from './axios';

// Auth services
export const authService = {
  // Đăng nhập
  login: async (email, password) => {
    try {
      // Su1eeda lu1ea1i: Lu01b0u request body u0111u1ec3 debug
      const loginData = { username: email, password };

      // u0110u0103ng nhu1eadp u0111u1ec3 lu1ea5y token - simpler, more direct
      const loginResponse = await api.post('/auth/login', loginData);
      
      // Return the response directly, whatever it is
      return loginResponse;
    } catch (error) {
      throw error.response || { message: 'Lu1ed7i ku1ebft nu1ed1i u0111u1ebfn server' };
    }
  },

  // Đăng ký
  register: async (userData) => {
    try {
      // Tạo username từ email nếu chưa có
      if (!userData.username) {
        userData.username = userData.email.split('@')[0];
      }
      const response = await api.post('/auth/registry', userData);
      return response; // axios.js đã trả về response.data trực tiếp
    } catch (error) {
      throw error.response || { message: 'Lỗi kết nối đến server' };
    }
  },
  
  // Xác nhận tài khoản (OTP)
  confirmAccount: async (username, otp) => {
    try {
      const response = await api.post('/auth/confirm-account', { username, otp });
      return response; // axios.js đã trả về response.data trực tiếp
    } catch (error) {
      throw error.response || { message: 'Lỗi xác nhận OTP' };
    }
  },

  // Quên mật khẩu - Gửi yêu cầu
  forgotPassword: async (email) => {
    try {
      // Backend mới sử dụng username thay vì email
      const username = email.split('@')[0];
      const response = await api.post('/auth/reset-otp', { username, email });
      return response; // axios.js đã trả về response.data trực tiếp
    } catch (error) {
      throw error.response || { message: 'Lỗi kết nối đến server' };
    }
  },

  // Xác thực mã OTP khi quên mật khẩu
  verifyOtp: async (email, otp) => {
    try {
      // Backend mới không cần bước xác thực OTP
      // Không có bước verify-otp riêng
      return { success: true, otp };
    } catch (error) {
      throw error.response || { message: 'Lỗi kết nối đến server' };
    }
  },

  // Đặt lại mật khẩu sau khi quên
  resetPassword: async (email, otp, newPassword) => {
    try {
      // Backend mới sử dụng username và password thay vì email và newPassword
      const username = email.split('@')[0];
      const response = await api.post('/auth/confirm-password', { 
        username, 
        otp, 
        password: newPassword 
      });
      return response; // axios.js đã trả về response.data trực tiếp
    } catch (error) {
      throw error.response || { message: 'Lỗi kết nối đến server' };
    }
  },

  // Đổi mật khẩu (khi đã đăng nhập)
  changePassword: async (currentPassword, newPassword) => {
    try {
      const response = await api.post('/me/change-password', {
        currentPassword,
        newPassword
      });
      return response; // axios.js đã trả về response.data trực tiếp
    } catch (error) {
      throw error.response || { message: 'Lỗi kết nối đến server' };
    }
  },

  // Đăng xuất
  logout: async () => {
    try {
      // Không gọi API /auth/logout nữa vì backend không có endpoint này
      // Chỉ xóa dữ liệu lưu trong local storage
      return { success: true, message: 'Đã đăng xuất' };
    } catch (error) {
      // Vấn về mặt UI để hiển thị lỗi
      return { success: false, message: 'Đăng xuất không thành công' };
    }
  },

  // Lấy thông tin người dùng
  getUserProfile: async () => {
    try {
      const response = await api.get('/me');
      return response; // axios.js đã trả về response.data trực tiếp
    } catch (error) {
      throw error.response || { message: 'Lỗi kết nối đến server' };
    }
  }
};
