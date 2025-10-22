import api from './axios';
import { API_ENDPOINTS } from '../constants';
import { Platform } from 'react-native';

const BASE_URL = API_ENDPOINTS.MESSAGES;

console.log('Using messages endpoint:', BASE_URL);

const messageApi = {
  fetchMessage: (conversationId, params) => {
    try {
      console.log('Fetching messages for conversation:', conversationId);
      const url = `${BASE_URL}/${conversationId}`;
      return api.get(url, {params});
    } catch (error) {
      console.error('Error fetching messages:', error.message);
      return { data: [] };
    }
  },
  fetchFiles: (conversationId, params) => {
    const url = `${BASE_URL}/${conversationId}/files`;
    return api.get(url, {params});
  },

  sendMessage: message => {
    try {
      const endpoint = '/messages/text';
      
      const requestBody = {};
      
      requestBody.conversationId = message.conversationId;
      requestBody.content = message.content;
      requestBody.type = "TEXT";
      
      if (message.replyMessageId) {
        requestBody.replyMessageId = message.replyMessageId;
      } 
      else if (message.replyToId) {
        requestBody.replyMessageId = message.replyToId;
      }
      else if (message.replyToMessage && message.replyToMessage._id) {
        requestBody.replyMessageId = message.replyToMessage._id;
        console.log('Using replyToMessage._id as replyMessageId:', message.replyToMessage._id);
      }

      if (message.forwardedMessage === true || 
          message.metadata?.isForwarded === true || 
          (typeof message.forwardedMessage === 'string' && message.forwardedMessage === 'true') ||
          message.content?.startsWith('📤 Tin nhắn được chuyển tiếp:')) {
        
        // Luôn gán metadata.isForwarded = true cho tin nhắn chuyển tiếp
        if (!requestBody.metadata) {
          requestBody.metadata = {};
        }
        
        requestBody.metadata.isForwarded = true;
        requestBody.metadata.forwardedAt = new Date().toISOString();
        
        // Đánh dấu gộp forwardedMessage nếu chưa có
        requestBody.forwardedMessage = true;
        
        console.log('Set metadata for forwarded message:', requestBody.metadata);
      }
      
      console.log(`Sending message to ${endpoint} with data:`, JSON.stringify(requestBody, null, 2));

      return api.post(endpoint, requestBody, {
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
    } catch (error) {
      console.error('Failed to send message:', error?.message || 'Unknown error');
      
      if (error?.response) {
        console.error(`Server responded with status ${error.response.status}:`, 
          JSON.stringify(error.response.data || {}, null, 2));
      }
      
      throw error;
    }
  },
  
  deleteMessage: messageId => {
    console.log('Deleting message client side:', messageId);
    const url = `${BASE_URL}/${messageId}/only`;
    return api.delete(url);
  },
  
  deleteMessageOnlyMe: messageId => {
    console.log('Using deleteMessage for deleteMessageOnlyMe');
    return messageApi.deleteMessage(messageId);
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
      return api.post(`${BASE_URL}/files/base64`, file, config);
    } catch (error) {
      console.error('Error uploading file:', error.message);
      throw error; // Rethrow để component có thể hiển thị lỗi upload
    }
  },

  sendFileMessage: async (data, onProgress) => {
    try {
      const { file, conversationId, type = 'FILE' } = data;
      
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
      
      const formData = new FormData();
      formData.append('file', {
        uri: Platform.OS === 'ios' ? file.uri.replace('file://', '') : file.uri,
        type: file.type || 'application/octet-stream',
        name: file.name || `file-${Date.now()}`
      });
      
      formData.append('type', serverType);
      formData.append('conversationId', conversationId);
      
      const url = `/messages/files?conversationId=${encodeURIComponent(conversationId)}&type=${encodeURIComponent(serverType)}`;
      
      console.log('Uploading to URL:', url);
      
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

      const response = await api.post(url, formData, config);
      console.log('File upload success:', response.data);
      return response;
    } catch (error) {
      console.error('Error in sendFileMessage:', error);
      if (error.response) {
        console.error('Server response:', error.response.status, error.response.data);
      }
      throw error;
    }
  },

  forwardMessage: async (messageId, targetConversationId, originalContent, messageType = 'TEXT') => {
    try {
      console.log(`Forwarding message ${messageId} to conversation ${targetConversationId}`, {
        messageType,
        originalContent: typeof originalContent === 'string' ? 
          (originalContent.length > 30 ? originalContent.substring(0, 30) + '...' : originalContent) : 
          'non-string content'
      });
      
      if (!targetConversationId) {
        console.error('Missing targetConversationId! Cannot forward message.');
      }
      
      if (messageId && messageId !== 'undefined' && messageId !== 'null') {
        try {
          console.log('Trying to use share message API with messageId:', messageId);
          const shareUrl = `${BASE_URL}/${messageId}/share/${targetConversationId}`;
          
          const requestBody = {
            metadata: { isForwarded: true },
            forwardedMessage: true
          };
          
          const shareResponse = await api.post(shareUrl, requestBody);
          console.log('Successfully shared message using API:', shareResponse?.data);
          return shareResponse;
        } catch (shareError) {
          console.error('Error using share API, falling back to manual forward:', shareError.message);
          // Nếu không thành công, tiếp tục với phương thức thông thường
        }
      }
      
      // Thiết lập prefix cho tin nhắn được chuyển tiếp
      let prefix = '📤 Tin nhắn được chuyển tiếp: \n';
      let actualContent = originalContent || '';
      
      console.log('Setting up forwarded message with prefix:', prefix);
      
      if (messageType === 'IMAGE') {
        console.log('Đang chuyển tiếp ảnh:', originalContent);
        const formData = new FormData();
        formData.append('file', {
          uri: originalContent,
          type: 'image/jpeg',
          name: `forwarded-image-${Date.now()}.jpg`
        });
        formData.append('type', 'IMAGE');
        formData.append('conversationId', targetConversationId);
        formData.append('forwardedMessage', 'true');
        
        const metadataObj = {isForwarded: true, forwardedAt: new Date().toISOString()};
        formData.append('metadata', JSON.stringify(metadataObj));
        
        try {
          formData.append('metadataHeader', JSON.stringify(metadataObj));
        } catch (metaErr) {
          console.warn('Could not append metadata to URL:', metaErr.message);
        }
        
        console.log('Image forward data:', {
          forwardedMessage: 'true',
          metadata: JSON.stringify({isForwarded: true}),
          url: `/messages/files?conversationId=${encodeURIComponent(targetConversationId)}&type=IMAGE&forwardedMessage=true`
        });
        
        const url = `/messages/files?conversationId=${encodeURIComponent(targetConversationId)}&type=IMAGE&forwardedMessage=true`;
        const config = {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        };
        
        console.log('Sending forwarded image message with URL:', url);
        return api.post(url, formData, config);
      }
      else if (messageType === 'VIDEO') {
        console.log('Đang chuyển tiếp video:', originalContent);
        const formData = new FormData();
        formData.append('file', {
          uri: originalContent,
          type: 'video/mp4',
          name: `forwarded-video-${Date.now()}.mp4`
        });
        formData.append('type', 'VIDEO');
        formData.append('conversationId', targetConversationId);
        formData.append('forwardedMessage', 'true');
        
        const metadataObj = {isForwarded: true, forwardedAt: new Date().toISOString()};
        formData.append('metadata', JSON.stringify(metadataObj));
        
        try {
          formData.append('metadataHeader', JSON.stringify(metadataObj));
        } catch (metaErr) {
          console.warn('Could not append metadata to URL:', metaErr.message);
        }
        
        console.log('Video forward data:', {
          forwardedMessage: 'true',
          metadata: JSON.stringify(metadataObj),
          url: `/messages/files?conversationId=${encodeURIComponent(targetConversationId)}&type=VIDEO&forwardedMessage=true`
        });
        
        const url = `/messages/files?conversationId=${encodeURIComponent(targetConversationId)}&type=VIDEO&forwardedMessage=true`;
        const config = {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        };
        
        console.log('Sending forwarded video message with URL:', url);
        return api.post(url, formData, config);
      } 
      else if (messageType === 'FILE') {
        console.log('Đang chuyển tiếp tệp:', originalContent);
        const formData = new FormData();
        formData.append('file', {
          uri: originalContent,
          type: 'application/octet-stream',
          name: `forwarded-file-${Date.now()}`
        });
        formData.append('type', 'FILE');
        formData.append('conversationId', targetConversationId);
        formData.append('forwardedMessage', 'true');
        
        const metadataObj = {isForwarded: true, forwardedAt: new Date().toISOString()};
        formData.append('metadata', JSON.stringify(metadataObj));
        
        try {
          formData.append('metadataHeader', JSON.stringify(metadataObj));
        } catch (metaErr) {
          console.warn('Could not append metadata to URL:', metaErr.message);
        }
        
        console.log('File forward data:', {
          forwardedMessage: 'true',
          metadata: JSON.stringify(metadataObj),
          url: `/messages/files?conversationId=${encodeURIComponent(targetConversationId)}&type=FILE&forwardedMessage=true`
        });
        
        const url = `/messages/files?conversationId=${encodeURIComponent(targetConversationId)}&type=FILE&forwardedMessage=true`;
        const config = {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        };
        
        console.log('Sending forwarded file message with URL:', url);
        return api.post(url, formData, config);
      } 
      else {
        if (!originalContent) {
          actualContent = 'Nội dung tin nhắn không có sẵn';
          console.log('Không có nội dung gốc, sử dụng nội dung mặc định');
        } else {
          console.log('Sử dụng nội dung gốc được truyền vào:', originalContent);
        }
        
        const newMessage = {
          conversationId: targetConversationId,
          content: prefix + actualContent,
          type: 'TEXT',
          forwardedMessage: true,
          metadata: {
            isForwarded: true,
          }
        };
        
        console.log('Sending forwarded text message:', newMessage);
        return messageApi.sendMessage(newMessage);
      }
    } catch (error) {
      console.error('Error forwarding message:', error.message);
      throw error;
    }
  },
  
  recallMessage: (messageId) => {
    try {
      console.log('Recalling message for everyone:', messageId);
      const url = `${BASE_URL}/${messageId}`;
      return api.delete(url);
    } catch (error) {
      console.error('Error recalling message:', error.message);
      throw error;
    }
  },
};

export { messageApi };
export default messageApi;
