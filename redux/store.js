import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import globalReducer from './globalSlice';
import chatReducer from './chatSlice';
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

// Export store và type của RootState
export { store };
export default store;
