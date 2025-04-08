import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const initialState = {
  conversations: [],
  activeConversation: null,
  messages: [],
  isLoading: false,
  error: null,
};

// Mock data for development
const mockConversations = [
  {
    id: '1',
    name: 'Nhật Hào',
    avatar: null,
    lastMessage: 'dsa',
    timestamp: '1 ngày',
    unread: 0,
  },
  {
    id: '2',
    name: 'Nguyễn Tuấn Anh',
    avatar: null,
    lastMessage: 'Không có tin nhắn',
    timestamp: '2 giờ',
    unread: 0,
  },
  {
    id: '3',
    name: 'Thanh Trọng',
    avatar: null,
    lastMessage: 'test',
    timestamp: '6 ngày',
    unread: 0,
  },
  {
    id: '4',
    name: 'Công nghệ mới',
    isGroup: true,
    avatar: null,
    lastMessage: 'Đã đổi tên nhóm thành "Công nghệ mới"',
    timestamp: 'Vài giấy trước',
    unread: 1,
  },
];

// Sample messages for demonstration
const mockMessages = {
  '1': [
    {
      id: '101',
      sender: 'other',
      text: 'Chào bạn!',
      timestamp: '10:30 AM',
    },
    {
      id: '102',
      sender: 'me',
      text: 'Chào bạn, khỏe không?',
      timestamp: '10:31 AM',
    },
    {
      id: '103',
      sender: 'other',
      text: 'Mình khỏe, còn bạn?',
      timestamp: '10:32 AM',
    },
  ],
  '2': [
    {
      id: '201',
      sender: 'other',
      text: 'Hello!',
      timestamp: '2:10 PM',
    },
    {
      id: '202',
      sender: 'me',
      text: 'Hi there!',
      timestamp: '2:11 PM',
    },
  ],
  '3': [
    {
      id: '301',
      sender: 'me',
      text: 'test',
      timestamp: '6 days ago',
    },
  ],
  '4': [
    {
      id: '401',
      sender: 'other',
      senderId: '5',
      senderName: 'Nhật Hào',
      text: 'Đã đổi tên nhóm thành "Công nghệ mới"',
      timestamp: 'Just now',
      isSystemMessage: true,
    },
  ],
};

export const fetchConversations = createAsyncThunk(
  'chat/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      // This would be an API call in a real app
      await new Promise(resolve => setTimeout(resolve, 500));
      return mockConversations;
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch conversations');
    }
  }
);

export const fetchMessages = createAsyncThunk(
  'chat/fetchMessages',
  async (conversationId, { rejectWithValue }) => {
    try {
      // This would be an API call in a real app
      await new Promise(resolve => setTimeout(resolve, 500));
      return { 
        conversationId, 
        messages: mockMessages[conversationId] || [] 
      };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to fetch messages');
    }
  }
);

export const sendMessage = createAsyncThunk(
  'chat/sendMessage',
  async ({ conversationId, text }, { rejectWithValue }) => {
    try {
      // This would be an API call in a real app
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const newMessage = {
        id: Date.now().toString(),
        sender: 'me',
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      
      return { conversationId, message: newMessage };
    } catch (error) {
      return rejectWithValue(error.message || 'Failed to send message');
    }
  }
);

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversation = action.payload;
    },
    clearMessages: (state) => {
      state.messages = [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Conversations
      .addCase(fetchConversations.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.conversations = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Fetch Messages
      .addCase(fetchMessages.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.messages = action.payload.messages;
        state.activeConversation = action.payload.conversationId;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      
      // Send Message
      .addCase(sendMessage.pending, (state) => {
        // Optimistic update could be implemented here
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.messages.push(action.payload.message);
        
        // Update last message in conversation list
        const conversationIndex = state.conversations.findIndex(
          c => c.id === action.payload.conversationId
        );
        
        if (conversationIndex !== -1) {
          state.conversations[conversationIndex].lastMessage = action.payload.message.text;
          state.conversations[conversationIndex].timestamp = 'Just now';
          
          // Move conversation to top
          const conversation = state.conversations[conversationIndex];
          state.conversations.splice(conversationIndex, 1);
          state.conversations.unshift(conversation);
        }
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.error = action.payload;
      });
  },
});

export const { setActiveConversation, clearMessages } = chatSlice.actions;
export default chatSlice.reducer;
