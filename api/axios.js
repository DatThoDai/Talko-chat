import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { REACT_APP_API_URL } from '../constants';

const api = axios.create({
  baseURL: REACT_APP_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor để thêm token vào headers
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor để xử lý response và lỗi
api.interceptors.response.use(
  (response) => {
    // Trả về dữ liệu trực tiếp nếu có
    if (response.data) {
      return response.data;
    }
    return response;
  },
  async (error) => {
    // Không log lỗi trên màn hình
    // console.error('API Error:', error.response || error.message);

    // Xử lý lỗi 401 Unauthorized (token hết hạn)
    if (error.response && error.response.status === 401) {
      // Xóa token và thông tin người dùng
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('user');
      
      // Thêm thông báo cho người dùng
      if (global.showToast) {
        global.showToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
      }
      
      // Redirect về màn hình đăng nhập sẽ được xử lý bởi Redux
      // Bạn có thể dispatch một action logout ở đây nếu cần
      // store.dispatch(logout());
    } else if (error.response && error.response.data && error.response.data.message) {
      // Hiển thị thông báo lỗi từ server nếu có
      if (global.showToast) {
        global.showToast(error.response.data.message);
      }
    } else if (!error.response && error.message === 'Network Error') {
      // Xử lý lỗi không có kết nối mạng
      if (global.showToast) {
        global.showToast('Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng.');
      }
    }
    
    // Trả về lỗi để xử lý tiếp
    return Promise.reject(error);
  }
);

export default api;
