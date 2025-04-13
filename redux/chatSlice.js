import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { messageApi } from '../api';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE } from '../constants/messageConstants';

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
  }
};

// Fetch messages for a conversation
export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async ({ conversationId, page = DEFAULT_PAGE, size = DEFAULT_PAGE_SIZE }, { rejectWithValue }) => {
    try {
      return await chatService.getMessages(conversationId, page, size);
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch messages');
    }
  }
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

const initialState = {
  conversations: [],
  messages: [],
  messagePages: {
    currentPage: 0,
    totalPages: 0,
    totalItems: 0,
  },
  currentConversation: null,
  typingUsers: {},
  lastViewers: {},
  loading: false,
  loadingMore: false,
  hasMoreMessages: true,
  error: null,
  previousScreen: null,
};

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
      state.messages = state.messages.filter(msg => msg._id !== messageId);
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
        state.messages = state.messages.map(msg => 
          msg._id === messageId ? { ...msg, isDeleted: true } : msg
        );
      })
      .addCase(deleteMessage.rejected, (state, action) => {
        state.error = action.payload || 'Failed to delete message';
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
  updateUserOnlineStatus
} = chatSlice.actions;

export default chatSlice.reducer;
