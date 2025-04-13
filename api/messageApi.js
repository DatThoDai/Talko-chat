import api from './axios';

const BASE_URL = '/messages';

// Export với named export để tránh vòng lặp import
export const messageApi = {
  fetchMessage: (conversationId, params) => {
    const url = `${BASE_URL}/${conversationId}`;
    return api.get(url, {params});
  },
  fetchFiles: (conversationId, params) => {
    const url = `${BASE_URL}/${conversationId}/files`;
    return api.get(url, {params});
  },

  sendMessage: message => {
    const url = `${BASE_URL}/text`;
    return api.post(url, message);
  },
  deleteMessage: messageId => {
    const url = `${BASE_URL}/${messageId}`;
    return api.delete(url);
  },
  deleteMessageOnlyMe: messageId => {
    const url = `${BASE_URL}/${messageId}/only`;
    return api.delete(url);
  },
  addReaction: (messageId, type) => {
    const url = `${BASE_URL}/${messageId}/reacts/${type}`;
    return api.post(url);
  },

  sendFileBase64Message: (file, params, uploadProgress) => {
    const {type, conversationId, channelId} = params;

    const config = {
      params: {
        type,
        conversationId,
        channelId,
      },

      onUploadProgress: progressEvent => {
        if (typeof uploadProgress === 'function') {
          let percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total,
          );
          uploadProgress(percentCompleted);
        }
      },
    };

    return api.post(`${BASE_URL}/files/base64`, file, config);
  },

  forwardMessage: (messageId, conversationId) => {
    const url = `${BASE_URL}/${messageId}/forward`;
    return api.post(url, {conversationId});
  },
};

// Export default để duy trì khả năng tương thích với code hiện tại
export default messageApi;
