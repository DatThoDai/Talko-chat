import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, meApi } from '../api';

const initialState = {
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
  passwordResetStage: null, // 'email_sent', 'otp_verified', 'reset_success'
  passwordResetData: {
    email: null,
    otp: null
  },
  passwordChangeSuccess: false,
  profileUpdateSuccess: false
};

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      console.log('loginUser thunk called with:', credentials.email);
      
      // Gọi API đăng nhập thực
      const response = await authService.login(credentials.email, credentials.password);
      console.log('Login response:', response);
      
      // Get token and refreshToken from response
      const token = response.token || (response.data && response.data.token);
      const refreshToken = response.refreshToken || (response.data && response.data.refreshToken);
      
      if (!token) {
        throw new Error('Không tìm thấy token trong response');
      }
      
      // Get user data from response
      let user = response.user;
      
      // If user data is not available, create minimal user object
      if (!user) {
        console.log('No user data in response, creating minimal user object');
        user = {
          _id: credentials.email, // Sử dụng email như là ID trong trường hợp không có ID thực
          username: credentials.email,
          name: credentials.email.split('@')[0],
          email: credentials.email
        };
      }
      
      // Đảm bảo user có trường _id (cần thiết cho socket)
      if (!user._id && user.id) {
        user._id = user.id; // Dùng id nếu có
      } else if (!user._id && user.email) {
        user._id = user.email; // Dùng email như là ID dự phòng
      }
      
      console.log('User data to be stored:', user);
      
      // Lưu dữ liệu vào AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('token', token);
      if (refreshToken) {
        await AsyncStorage.setItem('refreshToken', refreshToken);
      }
      
      return { user, token, refreshToken };
    } catch (error) {
      console.error('Login error:', error);
      return rejectWithValue(error.message || 'Đăng nhập thất bại');
    }
  }
);

export const logoutUser = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      // Không gọi API, chỉ xóa dữ liệu local
      await AsyncStorage.removeItem('user');
      await AsyncStorage.removeItem('token');
      await AsyncStorage.removeItem('refreshToken');
      
      // Gửi service không cần xử lý kết quả
      await authService.logout();
      
      return null;
    } catch (error) {
      // Không hiển thị lỗi, chỉ trả về mặc định giữ nguyên
      return rejectWithValue('Đăng xuất thất bại');
    }
  }
);

export const checkAuth = createAsyncThunk(
  'auth/check',
  async (_, { rejectWithValue }) => {
    try {
      const userJson = await AsyncStorage.getItem('user');
      const token = await AsyncStorage.getItem('token');
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      
      if (userJson && token) {
        return { user: JSON.parse(userJson), token, refreshToken };
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
      console.log('authSlice: updating profile with data:', profileData);
      
      // Gọi API cập nhật thông tin profile sử dụng authApi mới
      const updatedUser = await meApi.updateUserProfile(profileData);
      
      // Nếu cập nhật thành công, lấy dữ liệu user hiện tại từ state và merge
      const { auth } = getState();
      const mergedUser = {
        ...auth.user,
        ...updatedUser
      };
      
      console.log('authSlice: updated user data:', mergedUser);
      
      // Lưu vào AsyncStorage để duy trì đăng nhập
      await AsyncStorage.setItem('user', JSON.stringify(mergedUser));
      
      return mergedUser;
    } catch (error) {
      console.error('authSlice updateProfile error:', error);
      // // Xử lý các trường hợp lỗi khác nhau
      // if (error.status === 408) {
      //   return rejectWithValue('Yêu cầu hết thời gian, vui lòng thử lại');
      // } else if (error.status === 401) {
      //   return rejectWithValue('Phiên đăng nhập hết hạn, vui lòng đăng nhập lại');
      // } else if (error.status === 0) {
      //   return rejectWithValue('Không có kết nối internet, vui lòng kiểm tra mạng');
      // } else {
      //   return rejectWithValue(error.message || 'Cập nhật thông tin thất bại');
      // }
    }
  }
);

// Gửi yêu cầu quên mật khẩu để nhận OTP
export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (email, { rejectWithValue }) => {
    try {
      const response = await authService.forgotPassword(email);
      return { email, ...response };
    } catch (error) {
      return rejectWithValue(error.message || 'Gửi yêu cầu lấy lại mật khẩu thất bại');
    }
  }
);

// Xác thực mã OTP
export const verifyOtp = createAsyncThunk(
  'auth/verifyOtp',
  async ({ email, otp }, { rejectWithValue }) => {
    try {
      const response = await authService.verifyOtp(email, otp);
      return { email, otp, ...response };
    } catch (error) {
      return rejectWithValue(error.message || 'Mã xác thực không hợp lệ');
    }
  }
);

// Đặt lại mật khẩu mới
export const resetPassword = createAsyncThunk(
  'auth/confirm-password',
  async ({ email, otp, newPassword }, { rejectWithValue }) => {
    try {
      const response = await authService.resetPassword(email, otp, newPassword);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Đặt lại mật khẩu thất bại');
    }
  }
);

// Thay đổi mật khẩu (khi đã đăng nhập)
export const changePassword = createAsyncThunk(
  'auth/changePassword',
  async ({ currentPassword, newPassword }, { rejectWithValue }) => {
    try {
      const response = await authService.changePassword(currentPassword, newPassword);
      return response;
    } catch (error) {
      return rejectWithValue(error.message || 'Thay đổi mật khẩu thất bại');
    }
  }
);

// Upload avatar
export const updateAvatar = createAsyncThunk(
  'auth/updateAvatar',
  async (imageBase64, { getState, rejectWithValue }) => {
    try {
      // Gọi API cập nhật ảnh đại diện
      const avatarUrl = await authService.updateAvatar(imageBase64);
      
      // Lấy dữ liệu user hiện tại
      const { auth } = getState();
      const updatedUser = {
        ...auth.user,
        avatar: avatarUrl
      };
      
      // Lưu vào AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error) {
      return rejectWithValue(error.message || 'Cập nhật ảnh đại diện thất bại');
    }
  }
);

// Refresh token
export const refreshUserToken = createAsyncThunk(
  'auth/refreshToken',
  async (_, { rejectWithValue }) => {
    try {
      const result = await authService.refreshToken();
      return result;
    } catch (error) {
      return rejectWithValue(error.message || 'Refresh token failed');
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
      state.passwordResetStage = null;
      state.passwordResetData = {
        email: null,
        otp: null
      };
    },
    resetSuccess: (state) => {
      state.passwordChangeSuccess = false;
      state.profileUpdateSuccess = false;
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
        state.refreshToken = action.payload.refreshToken;
        
        console.log('Login successful, user authenticated:', action.payload.user);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        console.log('Login rejected with error:', action.payload);
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
        state.refreshToken = null;
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
          state.refreshToken = action.payload.refreshToken;
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
        state.profileUpdateSuccess = false;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.profileUpdateSuccess = true;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.profileUpdateSuccess = false;
      })
      
      // Forgot Password (gửi OTP)
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state, action) => {
        state.isLoading = false;
        state.passwordResetStage = 'email_sent';
        state.passwordResetData.email = action.payload.email;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Xác thực OTP 
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        state.passwordResetStage = 'otp_verified';
        state.passwordResetData.otp = action.payload.otp;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Reset Password (đặt lại mật khẩu mới)
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.passwordResetStage = 'reset_success';
        state.passwordResetData = {
          email: null,
          otp: null
        };
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Change Password (thay đổi mật khẩu khi đã đăng nhập)
      .addCase(changePassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
        state.passwordChangeSuccess = false;
      })
      .addCase(changePassword.fulfilled, (state) => {
        state.isLoading = false;
        state.passwordChangeSuccess = true;
      })
      .addCase(changePassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.passwordChangeSuccess = false;
      })
      
      // Update Avatar
      .addCase(updateAvatar.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateAvatar.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateAvatar.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Refresh Token
      .addCase(refreshUserToken.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(refreshUserToken.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.token;
        state.refreshToken = action.payload.refreshToken;
      })
      .addCase(refreshUserToken.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      });
  },
});

export const { clearError, clearPasswordReset, resetSuccess } = authSlice.actions;
export default authSlice.reducer;
