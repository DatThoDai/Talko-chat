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
      // Su1eed du1ee5ng email tru1ef1c tiu1ebfp lu00e0m username
      // Khu00f4ng tu1ef1 u0111u1ed9ng tu00e1ch username nu1eefa vu00ec username cu00f3 thu1ec3 lu00e0 email u0111u1ea7y u0111u1ee7
      const username = email; // Su1eed du1ee5ng ngu1ecdi gi00e1 tru1ecb ngu01b0u1eddi du00f9ng nhu1eadp

      // Gu1ecdi API reset-otp
      const response = await api.post('/auth/reset-otp', { username });
      return response;
    } catch (error) {
      throw error.response || { message: 'Lu1ed7i yu00eau cu1ea7u lu1ea5y lu1ea1i mu1eadt khu1ea9u' };
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
      // Su1eed du1ee5ng email tru1ef1c tiu1ebfp lu00e0m username
      // Khu00f4ng tu1ef1 u0111u1ed9ng tu00e1ch username nu1eefa
      const username = email; // Su1eed du1ee5ng ngu1ecdi gi00e1 tru1ecb ngu01b0u1eddi du00f9ng nhu1eadp
      
      // Truy1ec1n u0111u00fang params theo API cu1ee7a CNM_Chat-test
      const response = await api.post('/auth/confirm-password', { 
        username, 
        otp, 
        password: newPassword 
      });
      
      return response;
    } catch (error) {
      throw error.response || { message: 'Lu1ed7i u0111u1eb7t lu1ea1i mu1eadt khu1ea9u' };
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
