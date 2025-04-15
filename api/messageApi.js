import api from './axios';
import { API_ENDPOINTS } from '../constants';
import { Platform } from 'react-native'; // Thêm dòng này

// Đồng bộ với conversationApi, sử dụng endpoint chuẩn
const BASE_URL = API_ENDPOINTS.MESSAGES;

console.log('Using messages endpoint:', BASE_URL);

// Export với named export để tránh vòng lặp import
export const messageApi = {
  fetchMessage: (conversationId, params) => {
    try {
      console.log('Fetching messages for conversation:', conversationId);
      const url = `${BASE_URL}/${conversationId}`;
      return api.get(url, {params});
    } catch (error) {
      console.error('Error fetching messages:', error.message);
      return { data: [] }; // Trả về mảng rỗng để tránh crash
    }
  },
  fetchFiles: (conversationId, params) => {
    const url = `${BASE_URL}/${conversationId}/files`;
    return api.get(url, {params});
  },

  sendMessage: message => {
    try {
      // GIẢI PHÁP TRIỆT ĐỂ: ĐẢM BẢO ĐÚNG ĐỊNH DẠNG NHƯ ZELO-APP-CHAT
      
      // CHỦ QUAN TRỌNG: Endpoint phải là /messages/text (không phải /messages)
      const endpoint = '/messages/text';
      
      // YÊU CẦU 1: Phải gửi JSON object với đúng các trường:
      // - type: phải là "TEXT" hoàn toàn viết hoa
      // - conversationId: ID cuộc trò chuyện
      // - content: nội dung tin nhắn
      
      // Bước 1: Tạo object hoàn toàn mới, không sử dụng lại object cũ
      const requestBody = {};
      
      // Bước 2: Gán trực tiếp các giá trị (không thông qua biến)
      requestBody.conversationId = message.conversationId;
      requestBody.content = message.content;
      // Đảm bảo đúng định dạng type cho backend
      requestBody.type = "TEXT"; // QUAN TRỌNG: Phải là string hardcode và viết hoa
      
      // Bước 3: Thêm trường replyMessageId nếu có
      if (message.replyMessageId) {
        requestBody.replyMessageId = message.replyMessageId;
      }
      
      // Bước 4: Log chi tiết truyền gửi để debug
      console.log(`Sending message to ${endpoint} with data:`, JSON.stringify(requestBody, null, 2));

      // Bước 5: Gọi API với các header và config chuẩn
      return api.post(endpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    } catch (error) {
      // Log lỗi đầy đủ cho debugging
      console.error('Failed to send message:', error?.message || 'Unknown error');
      
      if (error?.response) {
        console.error(`Server responded with status ${error.response.status}:`, 
          JSON.stringify(error.response.data || {}, null, 2));
      }
      
      // Re-throw error để component có thể xử lý
      throw error;
    }
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
    try {
      const {type, conversationId, channelId} = params;
      console.log('Uploading file to conversation:', conversationId, 'with type:', type);

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
            
            // Log tiến độ upload để debug
            if (percentCompleted % 20 === 0) { // Log mỗi 20%
              console.log(`File upload progress: ${percentCompleted}%`);
            }
          }
        },
      };

      // Đổi từ /files/base64 sang /file cho phù hợp với web
      return api.post(`${BASE_URL}/file`, file, config);
    } catch (error) {
      console.error('Error uploading file:', error.message);
      throw error; // Rethrow để component có thể hiển thị lỗi upload
    }
  },

  sendFileMessage: async (data, onProgress) => {
    try {
      const { file, conversationId, type = 'FILE' } = data;
      
      // Ánh xạ các loại file chi tiết sang 3 loại server chấp nhận
      let serverType = 'FILE';
      if (type === 'IMAGE' || file.isImage) {
        serverType = 'IMAGE';
      } else if (type === 'VIDEO' || file.isVideo) {
        serverType = 'VIDEO';
      } else {
        // Tất cả các loại khác (PDF, DOC, EXCEL, vv.) đều là FILE
        serverType = 'FILE';
      }
      
      console.log('File được gửi với type:', {
        originalType: type,
        mappedType: serverType
      });
      
      // Tạo FormData như trước
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
        type: file.type || 'application/octet-stream',
        name: file.name || `file-${Date.now()}`
      });
      
      // Quan trọng: Sử dụng serverType đã ánh xạ thay vì type gốc
      formData.append('type', serverType);
      formData.append('conversationId', conversationId);
      
      // URL cũng sử dụng serverType đã ánh xạ
      const url = `${BASE_URL}/files?conversationId=${encodeURIComponent(conversationId)}&type=${encodeURIComponent(serverType)}`;
      
      console.log('Uploading to URL:', url);
      
      // Cấu hình request với progress tracking
      const config = {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
          if (onProgress) {
            onProgress(percentCompleted);
          }
        }
      };

      // Gọi API với URL đã bao gồm query params
      const response = await api.post(url, formData, config);
      console.log('File upload success:', response.data);
      return response;
    } catch (error) {
      console.error('Error in sendFileMessage:', error);
      // Log thêm chi tiết
      if (error.response) {
        console.error('Server response:', error.response.status, error.response.data);
      }
      throw error;
    }
  },

  forwardMessage: (messageId, conversationId) => {
    const url = `${BASE_URL}/${messageId}/forward`;
    return api.post(url, {conversationId});
  },
  
  // Recall message (undo send - only for sender)
  recallMessage: (messageId) => {
    try {
      console.log('Recalling message:', messageId);
      const url = `${BASE_URL}/${messageId}/recall`;
      return api.post(url);
    } catch (error) {
      console.error('Error recalling message:', error.message);
      throw error;
    }
  },
};

// Export default để duy trì khả năng tương thích với code hiện tại
export default messageApi;
