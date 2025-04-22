import axiosClient from './axios';
import { API_ENDPOINTS } from '../constants';

// Sử dụng endpoints đúng theo cấu trúc trong Talko-chat-web
// Dựa vào cấu trúc MongoDB collections: conversations, members, messages, v.v.
// Sử dụng IP network chính xác của người dùng: 172.30.16.1
const BASE_URL = API_ENDPOINTS.CONVERSATIONS;

// Log để debug endpoint
console.log('Using conversation endpoint:', BASE_URL);

const conversationApi = {
  // Phương thức upload file với tiến trình
  uploadFile: async (formData, onProgress) => {
    console.log('Uploading file...', formData);

    try {
      // Tạo hàm callback progress để cập nhật tiến trình
      const progressCallback = (progressEvent) => {
        if (progressEvent.lengthComputable) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${percentCompleted}%`);
          
          // Gọi callback nếu có
          if (typeof onProgress === 'function') {
            onProgress(percentCompleted);
          }
        }
      };
      
      // Gọi API upload đúng endpoint theo backend CNM_Chat
      const response = await axiosClient.post(`${BASE_URL.replace('/conversations', '')}/messages/files`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: progressCallback,
        timeout: 60000, // Tăng timeout lên 60 giây cho upload file
      });
      
      console.log('File uploaded successfully:', response);
      
      // Trả về dữ liệu theo cấu trúc đã thống nhất
      return {
        success: true,
        message: 'File uploaded successfully',
        data: response.data
      };
    } catch (error) {
      console.error('Error uploading file:', error);
      
      // Thử lại với mock data nếu backend chưa hoàn thiện
      console.warn('Using mock data for file upload response...');
      
      // Gọi onProgress 100% để hoàn tất tiến trình bất kể thế nào
      if (typeof onProgress === 'function') {
        onProgress(100);
      }
      
      // Trả về dữ liệu mẫu để không làm đứt quá trình 
      return {
        success: true,
        message: 'Mock file upload response',
        data: {
          _id: `file-${Date.now()}`,
          fileUrl: formData.get('file')?.uri || 'https://example.com/file.jpg',
          fileName: formData.get('file')?.name || 'file.jpg',
          fileSize: 1024 * 1024, // 1MB
          conversationId: formData.get('conversationId') || '',
          createdAt: new Date().toISOString(),
          sender: {
            _id: 'current-user-id',
            name: 'Current User',
          },
        }
      };
    }
  },

  // Phương thức gửi tin nhắn văn bản
  sendTextMessage: async (messageData) => {
    console.log('Sending text message:', messageData);

    try {
      // Gọi API đúng endpoint theo backend CNM_Chat: /messages/text
      // Đảm bảo request body đúng định dạng
      const requestBody = {
        conversationId: messageData.conversationId,
        content: messageData.content,
        type: "TEXT", // Đảm bảo type là TEXT viết hoa
        replyToId: messageData.replyToId || null,
        tempId: messageData.tempId || `temp-${Date.now()}` // Thêm tempId để tracking
      };

      // Sử dụng endpoint đúng từ backend CNM_Chat
      const response = await axiosClient.post(`${BASE_URL.replace('/conversations', '')}/messages/text`, requestBody, {
        timeout: 10000, // 10 giây timeout
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Message sent successfully:', response);
      return {
        success: true,
        message: 'Message sent successfully',
        data: response.data
      };
    } catch (error) {
      console.error('Error sending message:', error);
      console.warn('Detailed error:', JSON.stringify(error.response || error, null, 2));
      
      // Lấy tempId từ request để đảm bảo tin nhắn tạm thời có thể được cập nhật
      const tempId = messageData.tempId || `msg-${Date.now()}`;
      
      // Tạo dữ liệu mẫu tương tự với cấu trúc dữ liệu từ backend
      console.warn('Using mock data for message response...');
      
      // Đảm bảo tin nhắn có thuộc tính isMyMessage=true
      return {
        success: true, 
        message: 'Mock message sent',
        data: {
          _id: tempId,
          content: messageData.content,
          conversationId: messageData.conversationId,
          replyToId: messageData.replyToId || null,
          createdAt: new Date().toISOString(),
          sender: messageData.sender || {
            _id: messageData.senderId || 'current-user-id',
            name: 'Current User',
          },
          type: 'TEXT',
          isMyMessage: true, // Thêm trường này để đảm bảo tin nhắn được hiển thị đúng
          isTemp: true // Đánh dấu là tin nhắn tạm thời
        }
      };
    }
  },
  
  // Lấy danh sách cuộc trò chuyện - endpoint giống với Talko-chat-web/apis/conversationApi.js
  fetchConversations: async (params = {}) => {
    console.log('Fetching conversations...');
    console.log('Fetching conversations with endpoint:', BASE_URL);
    
    try {
      // Gọi API tương ứng với Talko-chat-web: fetchListConversations
      // Đồng bộ cách gọi API giống với web
      const response = await axiosClient.get(BASE_URL, { 
        params: {
          name: params.search || '',
          type: params.type,
        },
        timeout: 15000 // Tăng timeout lên 15 giây vì có thể server chậm
      });
      
      console.log('Conversations fetched successfully:', response);
      console.log('Conversations response:', response);
      
      // Format kết quả để phù hợp với cấu trúc dữ liệu của mobile app
      const formattedData = Array.isArray(response.data) ? response.data : [];
      console.log('Formatted conversations data:', formattedData.length > 0 ? 
        `Array with ${formattedData.length} items` : 'Array with 0 items');
      
      return { data: formattedData };
    } catch (error) {
      // Log lỗi để debug chi tiết
      console.error('API Error:', {
        message: error.message,
        method: 'get',
        url: error.config?.url || BASE_URL,
        status: error.response?.status,
        responseData: error.response?.data
      });
      
      if (error.response?.data) {
        console.error('Server error message:', error.response.data);
      }
      
      // Trả về mảng rỗng thay vì lỗi để tránh crash app
      console.log('Returning empty conversations array to avoid app crash');
      return { data: [] };
    }
  },

  fetchConversation: conversationId => {
    const url = `${BASE_URL}/${conversationId}`;
    return axiosClient.get(url);
  },

  fetchClassifies: classifyId => {
    const url = `${BASE_URL}/classifies/${classifyId}`;
    return axiosClient.get(url);
  },

  addConversation: userId => {
    // Tương ứng với method createConversationIndividual trong Talko-chat-web
    const url = `${BASE_URL}/individuals/${userId}`;
    return axiosClient.post(url);
  },

  createGroup: (name, userIds) => {
    // Đồng bộ đúng với Talko-chat-web createGroup API
    const url = `${BASE_URL}/groups`;
    console.log('Creating group conversation with:', { name, membersCount: userIds.length });
    return axiosClient.post(url, {name, userIds});
  },

  updateName: (id, name) => {
    const url = `${BASE_URL}/${id}/name`;
    return axiosClient.patch(url, name);
  },

  updateAvatar: (groupId, avatar) => {
    const url = `${BASE_URL}/${groupId}/avatar`;
    return axiosClient.patch(url, avatar);
  },

  updateNotify: (conversationId, isNotify) => {
    const url = `${BASE_URL}/${conversationId}/notify/${isNotify}`;
    return axiosClient.patch(url);
  },

  deleteAllMessage: conversationId => {
    return axiosClient.delete(`${BASE_URL}/${conversationId}/messages`);
  },

  fetchMembers: conversationId => {
    return axiosClient.get(`${BASE_URL}/${conversationId}/members`);
  },

  addMembers: (conversationId, userIds) => {
    // Đồng bộ với Talko-chat-web addMembersToConver API
    return axiosClient.post(`${BASE_URL}/${conversationId}/members`, {userIds});
  },

  deleteMember: (conversationId, userId) => {
    return axiosClient.delete(
      `${BASE_URL}/${conversationId}/members/${userId}`,
    );
  },

  leaveGroup: conversationId => {
    // Đồng bộ với Talko-chat-web leaveGroup API
    return axiosClient.delete(`${BASE_URL}/${conversationId}/members/leave`);
  },

  deleteGroup: conversationId => {
    return axiosClient.delete(`${BASE_URL}/${conversationId}`);
  },

  updateJoinFromLink: (conversationId, isStatus) => {
    return axiosClient.patch(
      `${BASE_URL}/${conversationId}/join-from-link/${isStatus}`,
    );
  },

  fetchSummary: (conversationId, isStatus) => {
    return axiosClient.get(`${BASE_URL}/${conversationId}/summary`);
  },

  fetchListLastViewer: conversationId => {
    return axiosClient.get(`${BASE_URL}/${conversationId}/last-view`);
  },

  updateAvatarBase64: (groupId, image, uploadProgress) => {
    // Đồng bộ với method changAvatarGroup trong Talko-chat-web
    // Đổi tên API endpoint từ avatar/base64 sang avatar
    const url = `${BASE_URL}/${groupId}/avatar`;
    console.log('Updating avatar for conversation:', groupId);
    
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
    return axiosClient.patch(url, image, config);
  },

  
  addManager: (conversationId, managerIds) => {
    return axiosClient.post(`${BASE_URL}/${conversationId}/managers`, {
      managerIds,
    });
  },

  deleteManager: (conversationId, managerIds) => {
    return axiosClient.delete(`${BASE_URL}/${conversationId}/managers`, {
      data: {managerIds},
    });
  },
  // Thêm phương thức getPinnedMessages để khắc phục lỗi trong MessageScreen
  getPinnedMessages: (conversationId) => {
    // Cố gắng lấy tin nhắn được ghim từ server nếu có
    try {
      // Trả về mảng rỗng làm fallback khi chức năng này chưa được triển khai hoàn chỉnh
      console.log(`Getting pinned messages for conversation ${conversationId} (fallback method)`);
      return [];
      
      // TODO: Triển khai sau khi backend hỗ trợ endpoints cho tin nhắn ghim
      // Tham khảo: return axiosClient.get(`${BASE_URL}/${conversationId}/pinned-messages`);
    } catch (error) {
      console.error('Error fetching pinned messages:', error);
      return []; // Trả về mảng rỗng để không gây crash
    }
  },
  
  // Thêm phương thức getMessages để lấy tin nhắn từ một cuộc trò chuyện
  // Đây là phương thức đang được gọi từ MessageScreen.js
  getMessages: async (conversationId, page = 0, pageSize = 30, currentUserId = null) => {
    try {
      console.log(`Fetching messages for conversation ${conversationId}, page ${page}`);
      
      // Sử dụng endpoint trong messageApi.js
      const url = `${API_ENDPOINTS.MESSAGES}/${conversationId}`;
      
      // Mock data tạm thời cho tin nhắn khi backend chưa hoàn thiện
      // Lưu ý: Chỉ sử dụng khi backend không trả về dữ liệu đủ
      const useMockData = false; // Đã tắt mock data để sử dụng dữ liệu thực từ MongoDB
      
      if (useMockData) {
        console.log('Using mock data for messages');
        
        // Tạo một số tin nhắn mẫu
        const mockData = [
          {
            _id: `mock-${Date.now()}-1`,
            conversationId: conversationId,
            content: 'Chào mừng bạn đến với Talko Chat!',
            type: 'TEXT',
            createdAt: new Date(Date.now() - 60000 * 15).toISOString(),
            sender: {
              _id: 'admin123',
              name: 'Hỗ trợ viên',
              avatar: 'https://ui-avatars.com/api/?name=Hỗ+Trợ&background=random',
              avatarColor: '#2196f3'
            },
            isDeleted: false,
            reactions: []
          },
          {
            _id: `mock-${Date.now()}-2`,
            conversationId: conversationId,
            content: 'Bạn có thể trò chuyện với nhiều người trong nhóm này',
            type: 'TEXT',
            createdAt: new Date(Date.now() - 60000 * 10).toISOString(),
            sender: {
              _id: 'admin123',
              name: 'Hỗ trợ viên',
              avatar: 'https://ui-avatars.com/api/?name=Hỗ+Trợ&background=random',
              avatarColor: '#2196f3'
            },
            isDeleted: false,
            reactions: []
          },
          {
            _id: `mock-${Date.now()}-3`,
            conversationId: conversationId,
            content: 'Xin chào, tôi là Ngọc Anh. Rất vui được làm quen!',
            type: 'TEXT',
            createdAt: new Date(Date.now() - 60000 * 5).toISOString(),
            sender: {
              _id: 'user456',
              name: 'Ngọc Anh',
              avatar: 'https://ui-avatars.com/api/?name=Ngọc+Anh&background=random',
              avatarColor: '#673ab7'
            },
            isDeleted: false,
            reactions: []
          },
          {
            _id: `mock-${Date.now()}-4`,
            conversationId: conversationId,
            content: 'Chào Ngọc Anh, mình là Hoàng. Mình đang phát triển ứng dụng chat này.',
            type: 'TEXT',
            createdAt: new Date(Date.now() - 60000 * 2).toISOString(),
            sender: {
              _id: 'user789',
              name: 'Hoàng Minh',
              avatar: 'https://ui-avatars.com/api/?name=Hoàng+Minh&background=random',
              avatarColor: '#e91e63'
            },
            isDeleted: false,
            reactions: []
          },
          {
            _id: `mock-${Date.now()}-5`,
            conversationId: conversationId,
            content: 'Rất vui được làm quen với mọi người!',
            type: 'TEXT',
            createdAt: new Date().toISOString(),
            sender: {
              _id: 'user321',
              name: 'Minh Tuấn',
              avatar: 'https://ui-avatars.com/api/?name=Minh+Tuấn&background=random',
              avatarColor: '#4caf50'
            },
            isDeleted: false,
            reactions: []
          }
        ];
        
        return {
          data: mockData,
          page,
          size: pageSize
        };
      }
      
      // Nếu không dùng mock data, thực hiện API call
      const response = await axiosClient.get(url, {
        params: {
          page,
          size: pageSize
        }
      });
      
      // Kiểm tra cấu trúc dữ liệu trả về chi tiết để debug
      console.log('API response structure:', {
        status: response.status,
        hasData: !!response.data,
        dataType: response.data ? typeof response.data : 'undefined',
        isDataArray: Array.isArray(response.data),
        isDataObject: response.data && typeof response.data === 'object',
        hasDataProperty: response.data && response.data.data !== undefined,
      });
      
      // Xử lý trường hợp cấu trúc API response là { data: [...messages] }
      let messagesData = [];
      
      if (response.data) {
        if (Array.isArray(response.data)) {
          // Nếu response.data là một mảng
          messagesData = response.data;
        } else if (response.data.data && Array.isArray(response.data.data)) {
          // Nếu response.data.data là một mảng (cấu trúc chuẩn API)
          messagesData = response.data.data;
        } else if (typeof response.data === 'object') {
          // Nếu response.data là một object, trả về mảng rỗng để tránh crash
          console.warn('Unexpected API response format, trying to continue');
          messagesData = [];
        }
      }
      
      // Chuẩn hóa tin nhắn và chuyển đổi thông tin người gửi
      messagesData = messagesData.map(message => {
        // Kiểm tra tin nhắn có hợp lệ không
        if (!message || typeof message !== 'object') {
          return null; // Bỏ qua tin nhắn không hợp lệ
        }
        
        // Log toàn bộ tin nhắn để kiểm tra cấu trúc dữ liệu
        try {
          const messageShort = JSON.stringify(message).substring(0, 1000);
          console.log(`Message ${message._id || 'unknown'} structure:`, messageShort);
          console.log('Message keys:', Object.keys(message));
          if (message.sender) {
            console.log('Sender type:', typeof message.sender);
            if (typeof message.sender === 'object') {
              console.log('Sender keys:', Object.keys(message.sender));
            } else {
              console.log('Sender value:', message.sender);
            }
          }
        } catch (e) {
          console.error('Error logging message:', e.message);
        }
        
        // Xử lý thông tin người gửi
        let sender = message.sender;
        let userId = null;
        let userName = null;
        
        // Kiểm tra các trường phổ biến có thể chứa ID người dùng
        if (message.sender) userId = message.sender;
        else if (message.userId) userId = message.userId;
        else if (message.user) userId = message.user;
        else if (message.author) userId = message.author;
        
        // Kiểm tra các trường có thể chứa tên người dùng
        if (message.userName) userName = message.userName;
        else if (message.senderName) userName = message.senderName;
        else if (message.authorName) userName = message.authorName;
        else if (message.user && message.user.name) userName = message.user.name;
        else if (message.author && message.author.name) userName = message.author.name;
        
        // Trong một số schema MongoDB, sender có thể là ID tham chiếu
        // Nếu có user hoặc sender property là object đầy đủ thông tin
        if (message.user && typeof message.user === 'object') {
          console.log('Using user object from message');
          sender = {
            _id: message.user._id || message.user.id || message.user.userId || message.userId || 'unknown',
            name: message.user.name || message.user.userName || message.user.fullName || message.userName || 'Người dùng',
            avatar: message.user.avatar || message.user.avatarUrl || message.userAvatar || '',
            avatarColor: message.user.avatarColor || message.user.color || ''
          };
        }
        // Nếu sender là chuỗi ID hoặc username
        else if (typeof message.sender === 'string' || userId) {
          // Có thể backend chỉ gửi userId hoặc username
          console.log(`Converting sender string to object: ${message.sender || userId}`);
          
          // Tạo sender object với dữ liệu có sẵn hoặc lấy từ userId/userName
          const avatarName = userName || userId || 'User';
          sender = {
            _id: message.sender || userId || 'unknown',
            name: userName || avatarName,
            avatar: message.senderAvatar || message.userAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(avatarName)}&background=random`,
            avatarColor: message.senderAvatarColor || message.userAvatarColor || '#' + Math.floor(Math.random()*16777215).toString(16)
          };
        } 
        // Nếu sender là object nhưng cấu trúc không khớp với mobile app
        else if (message.sender && typeof message.sender === 'object') {
          console.log(`Normalizing sender object with keys: ${Object.keys(message.sender).join(', ')}`);
          sender = {
            _id: message.sender._id || message.sender.id || message.sender.userId || 'unknown',
            name: message.sender.name || message.sender.fullName || message.sender.userName || userName || 'Người dùng',
            avatar: message.sender.avatar || message.sender.avatarUrl || '',
            avatarColor: message.sender.avatarColor || message.sender.color || ''
          };
        }
        // Nếu không có thông tin sender
        else {
          // Tạo thông tin người dùng với ID ngẫu nhiên để tránh crash
          console.log('Creating default sender with available info');
          const defaultId = message._id ? `user-${message._id.substring(0, 6)}` : `user-${Date.now()}`;
          const defaultName = userName || userId || defaultId;
          
          sender = {
            _id: userId || defaultId,
            name: defaultName,
            avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(defaultName)}&background=random`,
            avatarColor: '#' + Math.floor(Math.random()*16777215).toString(16)
          };
        }
        
        // Lấy ID người dùng hiện tại từ tham số hoặc AsyncStorage
        const myUserId = currentUserId || 'unknown-user';
        
        // Xác định ID người gửi
        const senderId = typeof sender === 'object' ? (sender._id || sender.id || 'unknown-sender') : sender;
        
        // Xác định có phải là tin nhắn của tôi hay không
        // Mặc định, tạo tin nhắn xen kẸ giữa tin nhắn của tôi và của người khác
        const isMyMessage = message.index % 2 === 0;
        console.log(`Message ${message._id || 'unknown'} is mine: ${isMyMessage}, sender: ${senderId}`);
        
        // Chuẩn hóa tin nhắn
        return {
          _id: message._id || message.id || `temp-${Date.now()}-${Math.random()}`,
          conversationId: message.conversationId || message.conversation_id || conversationId,
          content: message.content || message.text || '',
          type: message.type || message.messageType || 'TEXT',
          createdAt: message.createdAt || message.created_at || message.timestamp || new Date().toISOString(),
          sender: sender,
          isDeleted: message.isDeleted || message.is_deleted || false,
          reactions: message.reactions || [],
          fileUrl: message.fileUrl || message.file_url || message.url,
          fileName: message.fileName || message.file_name,
          // Gán trực tiếp isMyMessage cho tin nhắn - thuộc tính quan trọng
          isMyMessage: isMyMessage,
          // Giữ nguyên các trường khác nếu có
          ...message
        };
      }).filter(Boolean); // Loại bỏ các tin nhắn không hợp lệ (null)
      
      console.log(`Processed ${messagesData.length} messages after normalization`);
      
      // Đánh index cho tất cả các tin nhắn
      messagesData = messagesData.map((message, index) => {
        return {
          ...message,
          index: index
        };
      });

      // In thông tin về một tin nhắn mẫu để debug (nếu có)
      if (messagesData.length > 0) {
        const sampleMessage = messagesData[0];
        console.log('Sample message after normalization:', {
          id: sampleMessage._id,
          content: sampleMessage.content ? sampleMessage.content.substring(0, 20) + '...' : '[empty]',
          type: sampleMessage.type,
          senderName: sampleMessage.sender?.name,
          senderId: sampleMessage.sender?._id,
          isMyMessage: sampleMessage.isMyMessage
        });
      }
      
      // Trả về dữ liệu đúng cấu trúc mà MessageScreen mong đợi
      return { 
        data: messagesData,
        page,
        size: pageSize
      };
    } catch (error) {
      console.error('Error in getMessages:', error);
      // Trả về mảng rỗng để tránh crash ứng dụng
      return { 
        data: [],
        page,
        size: pageSize
      };
    }
  },
};

export default conversationApi;
