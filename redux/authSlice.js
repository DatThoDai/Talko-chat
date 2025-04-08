import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../api/authService';
import { userService } from '../api/userService';

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
      // Gọi API đăng nhập thực
      const response = await authService.login(credentials.email, credentials.password);
      
      // Thu thập hai cách truy cập
      const token = response.token || (response.data && response.data.token);
      const refreshToken = response.refreshToken || (response.data && response.data.refreshToken);
      
      if (!token) {
        throw new Error('Không tìm thấy token trong response');
      }
      
      // Tạo thông tin user từ dữ liệu nhận được nếu không có
      const user = response.user || {
        id: credentials.email,
        username: credentials.email.split('@')[0],
        email: credentials.email
      };
      
      // Lưu dữ liệu vào AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(user));
      await AsyncStorage.setItem('token', token);
      if (refreshToken) {
        await AsyncStorage.setItem('refreshToken', refreshToken);
      }
      
      return { user, token, refreshToken };
    } catch (error) {
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
      // Gọi API cập nhật thông tin profile
      const response = await userService.updateProfile(profileData);
      
      // Lấy dữ liệu user hiện tại từ state
      const { auth } = getState();
      const updatedUser = {
        ...auth.user,
        ...response.user
      };
      
      // Lưu vào AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error) {
      return rejectWithValue(error.message || 'Cập nhật thông tin thất bại');
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
  'auth/resetPassword',
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
  async (imageUri, { getState, rejectWithValue }) => {
    try {
      // Tạo form data để upload ảnh
      const formData = new FormData();
      
      // Lấy tên file từ URI
      const filename = imageUri.split('/').pop();
      
      // Xác định kiểu MIME
      const match = /\.([\w]+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';
      
      // Thêm file vào form data
      formData.append('avatar', {
        uri: imageUri,
        name: filename,
        type
      });
      
      const response = await userService.uploadAvatar(formData);
      
      // Cập nhật thông tin user
      const { auth } = getState();
      const updatedUser = {
        ...auth.user,
        avatar: response.avatarUrl
      };
      
      // Lưu vào AsyncStorage
      await AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      
      return updatedUser;
    } catch (error) {
      return rejectWithValue(error.message || 'Cập nhật ảnh đại diện thất bại');
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
      });
  },
});

export const { clearError, clearPasswordReset, resetSuccess } = authSlice.actions;
export default authSlice.reducer;
