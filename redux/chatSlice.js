import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { messageApi } from '../api';
import { DEFAULT_MESSAGE_PARAMS, MESSAGE_RECALL_TEXT, MESSAGE_STATUS } from '../constants';

// Tránh vòng lặp import bằng cách tạo service riêng
const chatService = {
  getMessages: (conversationId, page, size) => {
    return messageApi.fetchMessage(conversationId, { page, size });
  },
  
  sendMessage: (conversationId, content, replyToId) => {
    return messageApi.sendMessage({
      conversationId,
      content,
      type: 'TEXT',
      replyMessageId: replyToId
    });
  },
  
  sendFileMessage: (file, conversationId) => {
    return messageApi.sendFileBase64Message(file, { conversationId });
  },
  
  recallMessage: (messageId) => {
    return messageApi.recallMessage(messageId);
  }
};

// Fetch messages for a conversation
export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async ({ conversationId, page = DEFAULT_MESSAGE_PARAMS.page, size = DEFAULT_MESSAGE_PARAMS.size }, { rejectWithValue }) => {
    try {
      return await chatService.getMessages(conversationId, page, size);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
);

// Fetch all file
export const fetchFiles = createAsyncThunk(
  `message/fetchFiles`,
  async (params, thunkApi) => {
    const {conversationId, type} = params;
    try {
      console.log('Fetching files with params:', { conversationId, type });
      const response = await messageApi.fetchFiles(conversationId, {type});
      console.log('Files API response:', response);
      
      // Kiểm tra cấu trúc response và trả về đúng định dạng
      let files = [];
      
      // Xử lý cấu trúc API trả về
      if (response?.success && response?.data) {
        // Kết hợp files, images, và videos từ response
        const filesList = response.data.files || [];
        const imagesList = response.data.images || [];
        const videosList = response.data.videos || [];
        
        // Gán loại file phù hợp
        const processedFiles = filesList.map(file => {
          // Trích xuất tên file từ URL
          let fileName = 'Tệp đính kèm';
          if (file.content) {
            const parts = file.content.split('/');
            fileName = parts[parts.length - 1];
          }
          
          return {
            ...file,
            type: 'FILE',
            fileName: fileName, // Thêm trường fileName
            fileSize: 102400 // Kích thước mặc định 100KB
          };
        });
        
        const processedImages = imagesList.map(image => ({
          ...image,
          type: 'IMAGE'
        }));
        
        const processedVideos = videosList.map(video => ({
          ...video,
          type: 'VIDEO'
        }));
        
        // Gộp tất cả vào một mảng
        files = [...processedFiles, ...processedImages, ...processedVideos];
        console.log(`Extracted ${files.length} files (${filesList.length} files, ${imagesList.length} images, ${videosList.length} videos)`);
      } else if (Array.isArray(response)) {
        files = response;
      } else if (response?.data && Array.isArray(response.data)) {
        files = response.data;
      } else {
        console.log('Unexpected API response format:', response);
        files = [];
      }
      
      return files;
    } catch (error) {
      console.error('Error fetching files:', error);
      return thunkApi.rejectWithValue(error.message || 'Lỗi tải files');
    }
  },
);

// Send a text message
export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ conversationId, content, replyToId }, { rejectWithValue }) => {
    try {
      return await chatService.sendMessage(conversationId, content, replyToId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send message');
    }
  }
);

// Send a file message (image, video, document, etc.)
export const sendFileMessage = createAsyncThunk(
  'chat/sendFileMessage',
  async ({ conversationId, content, file, fileType }, { rejectWithValue }) => {
    try {
      return await chatService.sendFileMessage(conversationId, content, file, fileType);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send file message');
    }
  }
);

// Delete a message
export const deleteMessage = createAsyncThunk(
  'chat/deleteMessage',
  async ({ messageId, conversationId }, { rejectWithValue }) => {
    try {
      await chatService.deleteMessage(messageId);
      return { messageId, conversationId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete message');
    }
  }
);

// Recall a message (marking it as recalled rather than deleting it)
export const recallMessage = createAsyncThunk(
  'chat/recallMessage',
  async (messageId, { rejectWithValue }) => {
    try {
      await chatService.recallMessage(messageId);
      return { messageId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to recall message');
    }
  }
);

// Add a reaction to a message
export const addReaction = createAsyncThunk(
  'chat/addReaction',
  async ({ messageId, reactionType }, { rejectWithValue }) => {
    try {
      return await chatService.addReaction(messageId, reactionType);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add reaction');
    }
  }
);

// Fetch conversations list
export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      return await chatService.getConversations();
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch conversations');
    }
  }
);

// Create a new conversation
export const createConversation = createAsyncThunk(
  'chat/createConversation',
  async ({ name, participants, isGroupChat }, { rejectWithValue }) => {
    try {
      return await chatService.createConversation(name, participants, isGroupChat);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create conversation');
    }
  }
);

// Update last view for a conversation
export const updateLastView = createAsyncThunk(
  'chat/updateLastView',
  async ({ conversationId }, { rejectWithValue }) => {
    try {
      return await chatService.updateLastView(conversationId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update last view');
    }
  }
);

// Fetch last viewers for a message
export const fetchListLastViewer = createAsyncThunk(
  'chat/fetchListLastViewer',
  async ({ conversationId, messageId }, { rejectWithValue }) => {
    try {
      return await chatService.getMessageLastViewers(conversationId, messageId);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch last viewers');
    }
  }
);

// Thêm currentVote vào initialState
const initialState = {
  conversations: [],
  messages: [],
  messagePages: {
    currentPage: 0,
    totalPages: 0,
    totalItems: 0,
  },
  currentConversation: null,
  currentVote: null, // Thêm dòng này
  typingUsers: {},
  lastViewers: {},
  loading: false,
  loadingMore: false,
  hasMoreMessages: true,
  error: null,
  previousScreen: null,
  // Thêm các state mới cho channel
  channels: [],
  currentChannelId: '',
  channelMessages: [],
  currentChannelName: '',
  channelPages: {
    currentPage: 0,
    totalPages: 0,
    totalItems: 0,
  },
  files: [], // Thay đổi {} thành []
};

// Thêm các async thunk cho channel
export const fetchChannels = createAsyncThunk(
  'chat/fetchChannels',
  async ({ conversationId }, { rejectWithValue }) => {
    try {
      const response = await channelApi.fetchChannels(conversationId);
      return response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch channels');
    }
  }
);

export const fetchChannelMessages = createAsyncThunk(
  'chat/fetchChannelMessages',
  async ({ channelId, page = 0, size = 20, isSendMessage = false }, { rejectWithValue }) => {
    try {
      const response = await channelApi.fetchMessages(channelId, { page, size });
      return { messages: response.data || [], channelId, isSendMessage };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch channel messages');
    }
  }
);

export const sendChannelMessage = createAsyncThunk(
  'chat/sendChannelMessage',
  async ({ channelId, content, type = 'TEXT' }, { rejectWithValue }) => {
    try {
      const response = await channelApi.sendMessage(channelId, content, type);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to send channel message');
    }
  }
);

export const createChannel = createAsyncThunk(
  'chat/createChannel',
  async ({ conversationId, name }, { rejectWithValue }) => {
    try {
      const response = await channelApi.createChannel(name, conversationId);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create channel');
    }
  }
);

export const updateChannelName = createAsyncThunk(
  'chat/updateChannelName',
  async ({ channelId, name }, { rejectWithValue }) => {
    try {
      const response = await channelApi.updateChannel(channelId, { name });
      return { channelId, newName: name };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update channel name');
    }
  }
);

export const deleteChannelById = createAsyncThunk(
  'chat/deleteChannelById',
  async ({ channelId, conversationId }, { rejectWithValue }) => {
    try {
      await channelApi.deleteChannel(channelId);
      return { channelId, conversationId };
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete channel');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setTypingUsers: (state, action) => {
      const { conversationId, typingUsers } = action.payload;
      state.typingUsers = {
        ...state.typingUsers,
        [conversationId]: typingUsers
      };
    },
    addNewMessage: (state, action) => {
      const newMessage = action.payload;
      // Only add if it's not already in the messages array
      const messageExists = state.messages.some(msg => msg._id === newMessage._id);
      if (!messageExists) {
        state.messages = [newMessage, ...state.messages];
        
        // Update conversation's lastMessage if applicable
        if (state.currentConversation && newMessage.conversationId === state.currentConversation._id) {
          state.currentConversation.lastMessage = newMessage;
        }
        
        // Update conversation in the list
        const conversationIndex = state.conversations.findIndex(c => c._id === newMessage.conversationId);
        if (conversationIndex !== -1) {
          state.conversations[conversationIndex].lastMessage = newMessage;
        }
      }
    },
    updateMessage: (state, action) => {
      const updatedMessage = action.payload;
      state.messages = state.messages.map(msg => 
        msg._id === updatedMessage._id ? updatedMessage : msg
      );
    },
    removeMessage: (state, action) => {
      const messageId = action.payload;
      console.log('Redux: removeMessage được gọi với ID:', messageId);
      
      // Thay vì xóa hoàn toàn tin nhắn, chỉ đánh dấu là đã bị xóa/thu hồi
      // Điều này giúp hiển thị "Tin nhắn đã bị thu hồi" thay vì biến mất
      state.messages = state.messages.map(msg => 
        msg._id === messageId
          ? { ...msg, isDeleted: true, content: MESSAGE_RECALL_TEXT }
          : msg
      );
    },
    setCurrentConversation: (state, action) => {
      state.currentConversation = action.payload;
    },
    setPreviousScreen: (state, action) => {
      state.previousScreen = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
      state.hasMoreMessages = true;
      state.messagePages = {
        currentPage: 0,
        totalPages: 0,
        totalItems: 0,
      };
    },
    clearMessagePages: (state) => {
      state.messagePages = {
        currentPage: 0,
        totalPages: 0,
        totalItems: 0,
      };
      state.messages = [];
    },
    updateUserOnlineStatus: (state, action) => {
      const { userId, isOnline } = action.payload;
      
      // Update in conversations
      state.conversations = state.conversations.map(conversation => {
        const updatedParticipants = conversation.participants?.map(participant => {
          if (participant._id === userId) {
            return { ...participant, isOnline };
          }
          return participant;
        });
        
        return { ...conversation, participants: updatedParticipants };
      });
      
      // Update in current conversation
      if (state.currentConversation && state.currentConversation.participants) {
        const updatedParticipants = state.currentConversation.participants.map(participant => {
          if (participant._id === userId) {
            return { ...participant, isOnline };
          }
          return participant;
        });
        
        state.currentConversation = {
          ...state.currentConversation,
          participants: updatedParticipants
        };
      }
    },
    // Thêm action setCurrentVote để lưu trữ thông tin vote hiện tại
    setCurrentVote: (state, action) => {
      state.currentVote = action.payload;
    },
    
    // Cập nhật vote khi người dùng bình chọn
    updateVoteInfo: (state, action) => {
      const { messageId, optionName, userId, isAdd } = action.payload;
      
      // Cập nhật trong danh sách tin nhắn
      state.messages = state.messages.map(message => {
        if (message._id === messageId) {
          // Tìm và cập nhật option được chọn
          const updatedOptions = message.options.map(option => {
            if (option.name === optionName) {
              let userIds = [...(option.userIds || [])];
              
              if (isAdd) {
                // Thêm userId nếu chưa có
                if (!userIds.includes(userId)) {
                  userIds.push(userId);
                }
              } else {
                // Xóa userId
                userIds = userIds.filter(id => id !== userId);
              }
              
              return {
                ...option,
                userIds
              };
            }
            return option;
          });
          
          return {
            ...message,
            options: updatedOptions
          };
        }
        return message;
      });
      
      // Cập nhật currentVote nếu đang hiển thị chi tiết vote này
      if (state.currentVote && state.currentVote._id === messageId) {
        state.currentVote = {
          ...state.currentVote,
          options: state.messages.find(m => m._id === messageId)?.options || state.currentVote.options
        };
      }
    },
    // Thêm các reducers mới
    setCurrentChannel: (state, action) => {
      const { currentChannelId, currentChannelName } = action.payload;
      state.currentChannelId = currentChannelId;
      state.currentChannelName = currentChannelName;
    },
    
    clearChannelMessages: (state) => {
      state.channelMessages = [];
      state.channelPages = {
        currentPage: 0,
        totalPages: 0,
        totalItems: 0,
      };
    },
    
    addChannelMessage: (state, action) => {
      const { channelId, message } = action.payload;
      
      // Chỉ thêm tin nhắn nếu đang trong channel hiện tại
      if (channelId === state.currentChannelId) {
        const messageExists = state.channelMessages.some(msg => msg._id === message._id);
        if (!messageExists) {
          state.channelMessages = [...state.channelMessages, message];
        }
      }
      
      // Cập nhật channel trong danh sách
      const channelIndex = state.channels.findIndex(c => c._id === channelId);
      if (channelIndex !== -1) {
        state.channels[channelIndex].lastMessage = message;
      }
    },
    
    updateChannel: (state, action) => {
      const { channelId, newChannelName } = action.payload;
      
      // Cập nhật tên channel hiện tại nếu đang xem
      if (state.currentChannelId === channelId) {
        state.currentChannelName = newChannelName;
      }
      
      // Cập nhật channel trong danh sách
      const channelIndex = state.channels.findIndex(c => c._id === channelId);
      if (channelIndex !== -1) {
        state.channels[channelIndex].name = newChannelName;
      }
    },
    
    deleteChannel: (state, action) => {
      const { channelId, conversationId } = action.payload;
      
      // Xóa channel khỏi danh sách
      state.channels = state.channels.filter(c => c._id !== channelId);
      
      // Reset về conversation chính nếu đang xem channel bị xóa
      if (state.currentChannelId === channelId) {
        state.channelMessages = [];
        state.currentChannelId = conversationId;
        state.currentChannelName = '';
      }
    },
    
    setTypingUsersInChannel: (state, action) => {
      const { channelId, typingUsers } = action.payload;
      state.typingUsers = {
        ...state.typingUsers,
        [channelId]: typingUsers
      };
    },
    
    setListLastViewer: (state, action) => {
      const { messageId, viewers } = action.payload;
      state.lastViewers = {
        ...state.lastViewers,
        [messageId]: viewers
      };
    },
    
    updateNotification: (state, action) => {
      const { conversationId, isNotify } = action.payload;
      
      // Cập nhật trong currentConversation
      if (state.currentConversation && state.currentConversation._id === conversationId) {
        state.currentConversation.isNotify = isNotify;
      }
      
      // Cập nhật trong danh sách conversations
      const index = state.conversations.findIndex(c => c._id === conversationId);
      if (index !== -1) {
        state.conversations[index].isNotify = isNotify;
      }
    },
    
    updateAvatarConversation: (state, action) => {
      const { conversationId, conversationAvatar } = action.payload;
      
      // Cập nhật avatar của conversation hiện tại
      if (state.currentConversation && state.currentConversation._id === conversationId) {
        state.currentConversation.avatar = conversationAvatar;
      }
      
      // Cập nhật avatar trong danh sách conversations
      const index = state.conversations.findIndex(c => c._id === conversationId);
      if (index !== -1) {
        state.conversations[index].avatar = conversationAvatar;
      }
    },
    
    updateManagerIds: (state, action) => {
      const { conversationId, memberId, isAddManager } = action.payload;
      
      // Tìm conversation để cập nhật
      const index = state.conversations.findIndex(c => c._id === conversationId);
      if (index !== -1) {
        const conversation = state.conversations[index];
        let managerIds = [...(conversation.managerIds || [])];
        
        if (isAddManager) {
          managerIds.push(memberId);
        } else {
          managerIds = managerIds.filter(id => id !== memberId);
        }
        
        // Cập nhật conversation trong danh sách
        state.conversations[index] = {
          ...conversation,
          managerIds
        };
        
        // Cập nhật currentConversation nếu cần
        if (state.currentConversation && state.currentConversation._id === conversationId) {
          state.currentConversation = {
            ...state.currentConversation,
            managerIds
          };
        }
      }
    },
    
    // Thêm vào phần reducers của chatSlice
    updateUnreadCount: (state, action) => {
      const { conversationId, hasUnread } = action.payload;
      
      // Find conversation in state
      const conversationIndex = state.conversations.findIndex(
        conv => conv._id === conversationId
      );
      
      if (conversationIndex !== -1) {
        // Update unread count for this conversation
        state.conversations[conversationIndex].unreadCount = 
          hasUnread ? (state.conversations[conversationIndex].unreadCount || 0) + 1 : 0;
      }
    },
    
    markConversationAsRead: (state, action) => {
      const { conversationId } = action.payload;
      
      // Find conversation in state
      const conversationIndex = state.conversations.findIndex(
        conv => conv._id === conversationId
      );
      
      if (conversationIndex !== -1) {
        // Reset unread count to zero
        state.conversations[conversationIndex].unreadCount = 0;
      }
    },
    
    resetChatSlice: () => initialState
  },
  extraReducers: (builder) => {
    builder
      // Fetch messages
      .addCase(fetchMessages.pending, (state, action) => {
        const { page } = action.meta.arg;
        if (page === 0) {
          state.loading = true;
        } else {
          state.loadingMore = true;
        }
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { page } = action.meta.arg;
        const { messages, hasMore, totalPages, totalItems } = action.payload;
        
        if (page === 0) {
          state.messages = messages;
          state.loading = false;
        } else {
          // Append messages and filter out duplicates
          const existingIds = new Set(state.messages.map(msg => msg._id));
          const newMessages = messages.filter(msg => !existingIds.has(msg._id));
          state.messages = [...state.messages, ...newMessages];
          state.loadingMore = false;
        }
        
        state.hasMoreMessages = hasMore;
        state.messagePages = {
          currentPage: page,
          totalPages,
          totalItems,
        };
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload || 'Failed to fetch messages';
      })
      
      // Send message
      .addCase(sendMessage.fulfilled, (state, action) => {
        // The socket will handle adding the message to the state
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload || 'Failed to send message';
      })
      
      // Send file message
      .addCase(sendFileMessage.fulfilled, (state, action) => {
        // The socket will handle adding the message to the state
      })
      .addCase(sendFileMessage.rejected, (state, action) => {
        state.error = action.payload || 'Failed to send file message';
      })
      
      // Delete message
      .addCase(deleteMessage.fulfilled, (state, action) => {
        const { messageId } = action.payload;
        state.messages = state.messages.filter(msg => msg._id !== messageId);
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        state.error = action.payload || 'Failed to delete message';
      })
      
      // Recall message
      .addCase(recallMessage.fulfilled, (state, action) => {
        const { messageId } = action.payload;
        state.messages = state.messages.map(msg => 
          msg._id === messageId 
            ? { 
                ...msg, 
                content: MESSAGE_RECALL_TEXT, 
                status: MESSAGE_STATUS.RECALLED,
                isRecalled: true,
                isDeleted: false
              } 
            : msg
        );
      })
      .addCase(recallMessage.rejected, (state, action) => {
        state.error = action.payload || 'Failed to recall message';
      })
      
      // Add reaction
      .addCase(addReaction.fulfilled, (state, action) => {
        const { messageId, reaction } = action.payload;
        state.messages = state.messages.map(msg => {
          if (msg._id === messageId) {
            const reactions = msg.reactions || [];
            // Check if user already reacted with this type
            const existingReactionIndex = reactions.findIndex(
              r => r.userId === reaction.userId && r.type === reaction.type
            );
            
            if (existingReactionIndex !== -1) {
              // Remove existing reaction
              const newReactions = [...reactions];
              newReactions.splice(existingReactionIndex, 1);
              return { ...msg, reactions: newReactions };
            } else {
              // Add new reaction
              return { ...msg, reactions: [...reactions, reaction] };
            }
          }
          return msg;
        });
      })
      .addCase(addReaction.rejected, (state, action) => {
        state.error = action.payload || 'Failed to add reaction';
      })
      
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversations = action.payload;
        state.loading = false;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch conversations';
      })
      
      // Create conversation
      .addCase(createConversation.fulfilled, (state, action) => {
        state.conversations = [action.payload, ...state.conversations];
      })
      
      // Fetch last viewers
      .addCase(fetchListLastViewer.fulfilled, (state, action) => {
        const { messageId, viewers } = action.payload;
        state.lastViewers = {
          ...state.lastViewers,
          [messageId]: viewers
        };
      })
      // Thêm các extraReducers mới
      .addCase(fetchChannels.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchChannels.fulfilled, (state, action) => {
        state.channels = action.payload;
        state.loading = false;
      })
      .addCase(fetchChannels.rejected, (state, action) => {
        state.error = action.payload || 'Failed to fetch channels';
        state.loading = false;
      })
      
      .addCase(fetchChannelMessages.pending, (state, action) => {
        const { page } = action.meta.arg;
        if (page === 0) {
          state.loading = true;
        } else {
          state.loadingMore = true;
        }
      })
      .addCase(fetchChannelMessages.fulfilled, (state, action) => {
        const { messages, channelId, isSendMessage } = action.payload;
        const { page } = action.meta.arg;
        
        if (page === 0) {
          state.channelMessages = messages;
          state.loading = false;
        } else {
          // Thêm tin nhắn và loại bỏ các tin trùng lặp
          const existingIds = new Set(state.channelMessages.map(msg => msg._id));
          const newMessages = messages.filter(msg => !existingIds.has(msg._id));
          state.channelMessages = [...state.channelMessages, ...newMessages];
          state.loadingMore = false;
        }
        
        // Cập nhật channelPages
        state.channelPages = {
          currentPage: page,
          totalPages: messages.totalPages || 0,
          totalItems: messages.totalItems || 0,
        };
      })
      .addCase(fetchChannelMessages.rejected, (state, action) => {
        state.loading = false;
        state.loadingMore = false;
        state.error = action.payload || 'Failed to fetch channel messages';
      })
      
      .addCase(sendChannelMessage.fulfilled, (state, action) => {
        // Socket sẽ xử lý việc thêm tin nhắn vào state
      })
      .addCase(sendChannelMessage.rejected, (state, action) => {
        state.error = action.payload || 'Failed to send channel message';
      })
      
      .addCase(createChannel.fulfilled, (state, action) => {
        state.channels = [action.payload, ...state.channels];
      })
      .addCase(createChannel.rejected, (state, action) => {
        state.error = action.payload || 'Failed to create channel';
      })
      
      .addCase(updateChannelName.fulfilled, (state, action) => {
        const { channelId, newName } = action.payload;
        
        // Cập nhật tên channel trong danh sách
        const channelIndex = state.channels.findIndex(c => c._id === channelId);
        if (channelIndex !== -1) {
          state.channels[channelIndex].name = newName;
        }
        
        // Cập nhật tên channel hiện tại nếu đang xem
        if (state.currentChannelId === channelId) {
          state.currentChannelName = newName;
        }
      })
      
      .addCase(deleteChannelById.fulfilled, (state, action) => {
        const { channelId, conversationId } = action.payload;
        
        // Xóa channel khỏi danh sách
        state.channels = state.channels.filter(c => c._id !== channelId);
        
        // Reset về conversation chính nếu đang xem channel bị xóa
        if (state.currentChannelId === channelId) {
          state.channelMessages = [];
          state.currentChannelId = conversationId;
          state.currentChannelName = '';
        }
      })
      // Thêm reducer xử lý fetchFiles cho đầy đủ
      .addCase(fetchFiles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchFiles.fulfilled, (state, action) => {
        state.files = action.payload;
        state.loading = false;
      })
      .addCase(fetchFiles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Không thể tải files';
      });
  }
});

export const {
  setTypingUsers, 
  addNewMessage, 
  updateMessage, 
  removeMessage, 
  setCurrentConversation,
  setPreviousScreen,
  clearMessages,
  clearMessagePages,
  updateUserOnlineStatus,
  setCurrentVote,
  updateVoteInfo,
  setCurrentChannel,
  clearChannelMessages,
  addChannelMessage,
  updateChannel,
  deleteChannel,
  setTypingUsersInChannel,
  setListLastViewer,
  updateNotification,
  updateAvatarConversation,
  updateManagerIds,
  resetChatSlice
} = chatSlice.actions;

export default chatSlice.reducer;
