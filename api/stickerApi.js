import axiosClient from './axios';

const BASE_URL = '/stickers';

const stickerApi = {
  fetchSticker: () => {
    return axiosClient.get(BASE_URL);
  },
};

export default stickerApi;
