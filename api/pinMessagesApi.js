import api from './axios';
import { API_ENDPOINTS } from '../constants';

// Base URL for pin message operations
const BASE_URL = '/pin-messages';

const pinMessagesApi = {
  /**
   * Fetch all pinned messages for a conversation
   * @param {string} conversationId - ID of the conversation
   * @returns {Promise} - API response with pinned messages
   */
  fetchPinMessages: conversationId => {
    try {
      console.log('Fetching pinned messages for conversation:', conversationId);
      const url = `${BASE_URL}/${conversationId}`;
      return api.get(url);
    } catch (error) {
      console.error('Error fetching pinned messages:', error.message);
      return { data: [] }; // Return empty array to avoid crashes
    }
  },

  /**
   * Pin a message
   * @param {string} messageId - ID of the message to pin
   * @returns {Promise} - API response
   */
  pinMessage: async (messageId) => {
    try {
      console.log('Pinning message:', messageId);
      
      // Use the proper endpoint as specified in the backend
      const url = `${BASE_URL}/${messageId}`;
      
      const response = await api.post(url);
      return response;
    } catch (error) {
      // Check for specific error messages
      const errorMessage = error.response?.data?.message || '';
      
      if (errorMessage.includes('Only Conversation') || 
          errorMessage.includes('Pin message only conversation')) {
        console.error('Cannot pin message: This feature is only available in group conversations');
        // Rethrow with more descriptive message
        throw new Error('Tính năng ghim tin nhắn chỉ khả dụng trong nhóm trò chuyện');
      } else if (errorMessage.includes('< 3 pin')) {
        console.error('Cannot pin message: Maximum of 3 pinned messages allowed');
        throw new Error('Mỗi nhóm chỉ được ghim tối đa 3 tin nhắn');
      }
      
      console.error('Error pinning message:', error.message);
      throw error;
    }
  },

  /**
   * Unpin a message
   * @param {string} messageId - ID of the message to unpin
   * @returns {Promise} - API response
   */
  unpinMessage: async (messageId) => {
    try {
      console.log('Unpinning message:', messageId);
      
      // Use the proper endpoint as specified in the backend
      const url = `${BASE_URL}/${messageId}`;
      
      const response = await api.delete(url);
      return response;
    } catch (error) {
      // Check for specific error messages
      const errorMessage = error.response?.data?.message || '';
      
      if (errorMessage.includes('Only Conversation') || 
          errorMessage.includes('Pin message only conversation')) {
        console.error('Cannot unpin message: This feature is only available in group conversations');
        throw new Error('Tính năng bỏ ghim tin nhắn chỉ khả dụng trong nhóm trò chuyện');
      }
      
      console.error('Error unpinning message:', error.message);
      throw error;
    }
  }
};

// Use dual export to support both import styles
export { pinMessagesApi };
export default pinMessagesApi;
