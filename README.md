# Talko Chat

Ứng dụng chat di động được phát triển bằng React Native, cung cấp trải nghiệm nhắn tin hiện đại và đầy đủ tính năng.

## 🚀 Tính năng chính

- **Xác thực người dùng**: Đăng ký, đăng nhập an toàn
- **Nhắn tin real-time**: Chat trực tiếp với bạn bè
- **Quản lý bạn bè**: Thêm bạn, gửi lời mời kết bạn
- **Video call**: Gọi video chất lượng cao
- **Chia sẻ file**: Gửi hình ảnh, video và tài liệu
- **Tin nhắn ghim**: Ghim những tin nhắn quan trọng
- **Emoji và sticker**: Thể hiện cảm xúc phong phú
- **Voting**: Tạo và tham gia bình chọn
- **Profile cá nhân**: Quản lý thông tin cá nhân

## 📱 Giao diện ứng dụng

### Đăng nhập & Đăng ký


### Giao diện Chat


### Bạn bè & Cá nhân


### Video Call


## 🛠️ Công nghệ sử dụng

- **Frontend**: React Native
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation
- **API**: Axios
- **Socket**: Socket.io (real-time communication)
- **Build Tool**: Expo

## 📋 Yêu cầu hệ thống

- Node.js >= 14.x
- npm hoặc yarn
- Android Studio (cho Android)
- Xcode (cho iOS - chỉ trên macOS)
- Expo CLI

## 🚀 Cài đặt và chạy

1. **Clone repository**
   ```bash
   git clone https://github.com/DatThoDai/Talko-chat.git
   cd Talko-chat
   ```

2. **Cài đặt dependencies**
   ```bash
   npm install
   # hoặc
   yarn install
   ```

3. **Chạy ứng dụng**
   ```bash
   npm start
   # hoặc
   yarn start
   ```

4. **Chạy trên thiết bị**
   - **Android**: `npm run android` hoặc `yarn android`
   - **iOS**: `npm run ios` hoặc `yarn ios`

## 📁 Cấu trúc thư mục

```
Talko-chat/
├── api/                    # API services
├── assets/                 # Hình ảnh, âm thanh
├── components/            # Components tái sử dụng
├── constants/             # Hằng số
├── navigations/           # Cấu hình navigation
├── redux/                 # Redux store và slices
├── screens/               # Các màn hình
├── styles/                # Styles chung
├── utils/                 # Utility functions
├── App.js                 # Component gốc
└── package.json           # Dependencies
```

## 🔧 Cấu hình

1. **Environment Variables**
   - Tạo file `.env` trong thư mục gốc
   - Thêm các biến môi trường cần thiết:
   ```env
   API_BASE_URL=your_api_url
   SOCKET_URL=your_socket_url
   ```

2. **API Configuration**
   - Cấu hình base URL trong `api/axios.js`
   - Thiết lập authentication headers
