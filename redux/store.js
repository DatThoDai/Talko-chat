import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import globalReducer from './globalSlice';
import chatReducer from './chatSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    global: globalReducer,
    chat: chatReducer,
  },
});

export default store;
