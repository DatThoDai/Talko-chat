import api from './axios';
import { REACT_APP_API_URL } from '../constants';

// Auth services
export const authService = {
  // Đăng nhập
  login: async (email, password) => {
    try {
      console.log('Attempting login with:', { email, password: '****' });
      
      // Đảm bảo format request phù hợp với backend CNM_Chat-test
      // Backend mong đợi { username, password }
      // Kiểm tra các giá trị input
      if (!email || !password) {
        throw new Error('Email và mật khẩu là bắt buộc');
      }
      
      // Mặc định cho login API của CNM_Chat-test
      const loginData = { 
        username: email, 
        password: password,
      };

      console.log('Login request data:', { username: loginData.username, password: '****' });
      console.log('API endpoint:', '/auth/login');
      
      // Gọi API login với Content-Type rõ ràng
      const loginResponse = await api.post('/auth/login', loginData, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      // Log kết quả trả về (an toàn)
      console.log('Login response received:', loginResponse ? 'Success' : 'Empty response');
      
      // Kiểm tra cấu trúc response
      if (!loginResponse) {
        console.error('Empty login response');
        throw new Error('Empty response from server');
      }
      
      return loginResponse;
    } catch (error) {
      console.error('Login error details:', error);
      
      // Log chi tiết hơn về lỗi để debug
      if (error.response) {
        console.error('Server response error:', error.response);
        
        // Kiểm tra các lỗi cụ thể và đưa ra thông báo hữu ích
        if (error.response.status === 404) {
          // Lỗi User not found - đảm bảo thông báo rõ ràng cho người dùng
          throw { message: 'Tài khoản không tồn tại. Vui lòng kiểm tra lại email hoặc đăng ký mới.' };
        } else if (error.response.status === 401) {
          // Lỗi mật khẩu không đúng
          throw { message: 'Mật khẩu không chính xác. Vui lòng thử lại hoặc sử dụng chức năng quên mật khẩu.' };
        }
      } else if (error.request) {
        console.error('No response received:', error.request);
        // Lỗi không nhận được phản hồi từ server
        throw { message: 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.' };
      } else {
        console.error('Error details:', error.message);
      }
      
      // Trả về thông báo mặc định nếu không xác định được lỗi cụ thể
      throw error.response || { message: 'Lỗi đăng nhập. Vui lòng thử lại sau.' };
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