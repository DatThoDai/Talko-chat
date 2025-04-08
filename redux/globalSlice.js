import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isLogin: false,
  currentUserId: '',
  isLoading: false,
  error: null,
  keyboardHeight: 0,
};

const globalSlice = createSlice({
  name: 'global',
  initialState,
  reducers: {
    setLogin: (state, action) => {
      state.isLogin = action.payload;
    },
    setCurrentUserId: (state, action) => {
      state.currentUserId = action.payload;
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setKeyboardHeight: (state, action) => {
      state.keyboardHeight = action.payload;
    },
    resetGlobalState: () => initialState,
  },
});

export const {
  setLogin,
  setCurrentUserId,
  setLoading,
  setError,
  setKeyboardHeight,
  resetGlobalState,
} = globalSlice.actions;

export default globalSlice.reducer;
