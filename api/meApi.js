import api from './axios';

const BASE_URL = '/me';

// Export cả đối tượng để có thể import định danh
export const meApi = {
  fetchProfile: () => {
    return api.get(`${BASE_URL}/profile`);
  },

  updateProfile: profile => {
    const url = `${BASE_URL}/profile`;
    return api.put(url, profile);
  },

  updateAvatar: image => {
    const url = `${BASE_URL}/avatar`;
    return api.patch(url, image);
  },

  updateCoverImage: image => {
    const url = `${BASE_URL}/cover-image`;
    return api.patch(url, image);
  },

  fetchSyncContacts: () => {
    return api.get(`${BASE_URL}/phone-books`);
  },

  syncContacts: phones => {
    const url = `${BASE_URL}/phone-books`;
    return api.post(url, {phones});
  },

  changePassword: (oldPassword, newPassword) => {
    const url = `${BASE_URL}/password`;
    return api.patch(url, {oldPassword, newPassword});
  },

  logoutAllDevice: (password, key) => {
    const url = `${BASE_URL}/revoke-token`;
    return api.delete(url, {data: {password, key}});
  },

  updateAvatarBase64: (image, uploadProgress) => {
    const url = `${BASE_URL}/avatar/base64`;

    const config = {
      onUploadProgress: progressEvent => {
        if (typeof uploadProgress === 'function') {
          let percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          uploadProgress(percentCompleted);
        }
      },
    };

    return api.patch(url, image, config);
  },

  updateCoverImageBase64: (image, uploadProgress) => {
    const url = `${BASE_URL}/cover-image/base64`;

    const config = {
      onUploadProgress: progressEvent => {
        if (typeof uploadProgress === 'function') {
          let percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          uploadProgress(percentCompleted);
        }
      },
    };

    return api.patch(url, image, config);
  },
};

// Export mặc định để duy trì khả năng tương thích với code hiện tại
export default meApi;
