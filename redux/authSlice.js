import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';

const initialState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  passwordResetEmail: null,
  passwordResetRequested: false,
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      // This would normally be an API call, but for now we'll simulate one
      // In a real app, replace with actual API call to your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (credentials.email === 'test@example.com' && credentials.password === 'password') {
        const userData = {
          id: '1',
          name: 'Hào Nguyễn',
          email: 'test@example.com',
          avatar: null,
          gender: 'Nam',
          birthdate: '20/11/2000',
          phone: '0798662438'
        };
        
        const token = 'fake-jwt-token';
        
        // Save to AsyncStorage
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('token', token);
        
        return { user: userData, token };
      }
      
      return rejectWithValue('Invalid email or password');
    } catch (error) {
      return rejectWithValue(error.message || 'Login failed');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      return null;
    } catch (error) {
      return rejectWithValue(error.message || 'Logout failed');
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/check',
  async (_, { rejectWithValue }) => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      
      if (userJson && token) {
        return { user: JSON.parse(userJson), token };
      }
      
      return null;
    } catch (error) {
      return rejectWithValue(error.message || 'Auth check failed');
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (profileData, { getState, rejectWithValue }) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const { auth } = getState();
      const updatedUser = {
        ...auth.user,
        ...profileData
      };
      
      // Save to AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error) {
      return rejectWithValue(error.message || 'Update profile failed');
    }
  }
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (email, { rejectWithValue }) => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real app, make an API call to request password reset
      return email;
    } catch (error) {
      return rejectWithValue(error.message || 'Password reset failed');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearPasswordReset: (state) => {
      state.passwordResetEmail = null;
      state.passwordResetRequested = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Logout
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
      })
      .addCase(logoutUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Check Auth
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
        } else {
          state.isAuthenticated = false;
        }
      })
      .addCase(checkAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Update Profile
      .addCase(updateProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.passwordResetEmail = action.payload;
        state.passwordResetRequested = true;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearPasswordReset } = authSlice.actions;
export default authSlice.reducer;
