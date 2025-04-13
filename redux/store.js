import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import globalReducer from './globalSlice';
import chatReducer from './chatSlice';
import { registerStore } from '../utils/socketService';

// Tạo store với tất cả các reducer
const store = configureStore({
  reducer: {
    auth: authReducer,
    global: globalReducer,
    chat: chatReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

// Đăng ký store với socketService để tránh vòng lặp import
registerStore(store);

// Export store và type của RootState
export { store };
export default store;

// Export store để sử dụng trong ứng dụng
