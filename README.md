# Talko Chat

A modern mobile chat application built with React Native, providing a comprehensive and feature-rich messaging experience.

## 🚀 Key Features

- **User Authentication**: Secure registration and login
- **Real-time Messaging**: Direct chat with friends
- **Friend Management**: Add friends, send friend requests
- **Video Calling**: High-quality video calls
- **File Sharing**: Send images, videos and documents
- **Pinned Messages**: Pin important messages
- **Emoji & Stickers**: Express emotions richly
- **Voting**: Create and participate in polls
- **Personal Profile**: Manage personal information

## 📱 App Interface

### Login & Registration


### Chat Interface


### Friends & Profile


### Video Call


## 🛠️ Technologies Used

- **Frontend**: React Native
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation
- **API**: Axios
- **Socket**: Socket.io (real-time communication)
- **Build Tool**: Expo

## 📋 System Requirements

- Node.js >= 14.x
- npm or yarn
- Android Studio (for Android)
- Xcode (for iOS - macOS only)
- Expo CLI

## 🚀 Installation & Setup

1. **Clone repository**
   ```bash
   git clone https://github.com/DatThoDai/Talko-chat.git
   cd Talko-chat
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Run the application**
   ```bash
   npm start
   # or
   yarn start
   ```

4. **Run on device**
   - **Android**: `npm run android` or `yarn android`
   - **iOS**: `npm run ios` or `yarn ios`

## 📁 Project Structure

```
Talko-chat/
├── api/                    # API services
├── assets/                 # Images, sounds
├── components/            # Reusable components
├── constants/             # Constants
├── navigations/           # Navigation configuration
├── redux/                 # Redux store and slices
├── screens/               # App screens
├── styles/                # Global styles
├── utils/                 # Utility functions
├── App.js                 # Root component
└── package.json           # Dependencies
```

## 🔧 Configuration

1. **Environment Variables**
   - Create `.env` file in root directory
   - Add necessary environment variables:
   ```env
   API_BASE_URL=your_api_url
   SOCKET_URL=your_socket_url
   ```

2. **API Configuration**
   - Configure base URL in `api/axios.js`
   - Set up authentication headers