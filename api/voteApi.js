import axiosClient from './axios';

const BASE_URL = '/votes';

const voteApi = {
  addVote: vote => {
    return axiosClient.post(BASE_URL, vote);
  },

  addVoteOption: (messageId, option) => {
    const url = `${BASE_URL}/${messageId}`;
    return axiosClient.post(url, option);
  },

  deleteVoteOption: (messageId, option) => {
    const url = `${BASE_URL}/${messageId}`;
    return axiosClient.delete(url, option);
  },

  selectOption: (messageId, options) => {
    const url = `${BASE_URL}/${messageId}/choices`;
    return axiosClient.post(url, options);
  },

  deleteSelectOption: (messageId, options) => {
    const url = `${BASE_URL}/${messageId}/choices`;
    return axiosClient.delete(url, {data: options});
  },

  getVotesByConversationId: (conversationId, page = 0, size = 10) => {
    const url = `${BASE_URL}/${conversationId}`;
    return axiosClient.get(url, {
      params: { page, size }
    });
  },

  
};

export default voteApi;
