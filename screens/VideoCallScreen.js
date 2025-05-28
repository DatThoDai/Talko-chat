import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Platform,
  Alert,
  BackHandler,
  Dimensions,
  PermissionsAndroid,
} from 'react-native';
import {
  createAgoraRtcEngine,
  RtcSurfaceView,
  RenderModeType,  // Thay thế VideoRenderMode
  ChannelProfileType,
  ClientRoleType,
  VideoRemoteState,
} from 'react-native-agora';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import {
  getSocket,
  initiateSocket,
  notifyUserJoinedAgoraChannel,
  notifyUserLeftAgoraChannel,
  notifyCallAnswered,
  notifyVideoCallAnswered,  // Thêm hàm mới
  notifyUserJoinedVideoChannel, // Thêm hàm mới
  notifyUserLeftVideoChannel   // Thêm hàm mới
} from '../utils/socketService';
import InCallManager from 'react-native-incall-manager';

const { width, height } = Dimensions.get('window');

// Tạo App ID Agora (không dùng token)
const appId = '5bc3cba5648449c189ca3b5b726d1c12';

const VideoCallScreen = ({ navigation, route }) => {
  const { conversationId, participants, conversationName, isGroup } = route.params || {};
  const { user } = useSelector(state => state.auth);

  // State để quản lý cuộc gọi
  const [engine, setEngine] = useState(null);
  const [localUid, setLocalUid] = useState(null);
  const [remoteUsers, setRemoteUsers] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState('connecting'); // 'connecting', 'connected', 'ended'
  const [callEndReason, setCallEndReason] = useState(''); // 'rejected', 'ended', 'error'
  const [waitingForAnswer, setWaitingForAnswer] = useState(false);
  const [hasRemoteParticipants, setHasRemoteParticipants] = useState(false);
  const [joinSucceed, setJoinSucceed] = useState(false);

  // Thêm tham số mới từ route.params
  const {
    isInitiator = false,
    isIncoming = false,
    caller,
    pendingCallData,
    effectiveUserId
  } = route.params || {};

  // Sử dụng userIdForCall khi gọi các hàm liên quan đến socket
  const userIdForCall = effectiveUserId || user._id;

  // Refs để lưu trữ thông tin
  const channelRef = useRef(conversationId);

  // Khởi tạo khi component được mount
  useEffect(() => {
    console.log('📞 VIDEO CALL: VideoCallScreen mounted');
    
    // Cải thiện cấu hình âm thanh
    InCallManager.start({
      media: 'video',
      auto: true,
      ringback: '',
    });
    
    // Đảm bảo loa ngoài được bật
    InCallManager.setForceSpeakerphoneOn(true);
    
    // Tăng âm lượng tối đa
    InCallManager.setKeepScreenOn(true);
    
    // Trên Android, có thể cần thiết lập thêm
    if (Platform.OS === 'android') {
      InCallManager.setSpeakerphoneOn(true);
    }
    
    console.log('📞 VIDEO CALL: Route params received:', JSON.stringify({
      conversationId,
      isInitiator,
      isIncoming,
      participantsCount: participants?.length || 0,
    }));

    // Xử lý nút back
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleEndCall
    );

    // Khởi tạo Agora và xin quyền
    initializeAgoraEngine();

    return () => {
      // Dọn dẹp khi unmount
      InCallManager.stop();
      backHandler.remove();
      endCall();
    };
  }, []);

  // Kiểm tra kết nối socket
  useEffect(() => {
    const socket = getSocket();
    if (socket) {
      console.log('📞 SOCKET CHECK: Socket exists in VideoCallScreen');
      console.log('📞 SOCKET CHECK: Socket state:', {
        id: socket.id,
        connected: socket.connected,
        disconnected: socket.disconnected
      });
    } else {
      console.error('📞 SOCKET ERROR: Socket does not exist in VideoCallScreen');

      // Thử kết nối socket nếu chưa có
      console.log('📞 SOCKET: Attempting to initialize socket');
      initiateSocket(user?._id, conversationId)
        .then(() => {
          console.log('📞 SOCKET: Socket initialized successfully');
        })
        .catch(error => {
          console.error('📞 SOCKET ERROR: Failed to initialize socket:', error);
        });
    }
  }, []);

  // Xin quyền truy cập camera và microphone
  const requestCameraAndAudioPermission = async () => {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
        if (
          granted['android.permission.RECORD_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED &&
          granted['android.permission.CAMERA'] === PermissionsAndroid.RESULTS.GRANTED
        ) {
          console.log('Đã được cấp quyền camera và microphone');
        } else {
          console.log('Không được cấp quyền camera và microphone');
          Alert.alert(
            'Cần cấp quyền',
            'Vui lòng cấp quyền truy cập camera và microphone để thực hiện cuộc gọi video',
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      } catch (err) {
        console.warn('Lỗi khi xin quyền:', err);
        Alert.alert('Lỗi', 'Không thể xin quyền truy cập camera và microphone', 
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    }
  };

  // Khởi tạo Agora Engine - PHƯƠNG THỨC CẬP NHẬT CHO PHIÊN BẢN 4.5.3
  const initializeAgoraEngine = async () => {
    try {
      // Xin quyền trước tiên
      await requestCameraAndAudioPermission();
      
      // Tạo UID ngẫu nhiên trong khoảng 1 đến 999999
      const uid = Math.floor(Math.random() * 999999) + 1;
      setLocalUid(uid);

      console.log('📞 VIDEO CALL: Creating Agora Engine với createAgoraRtcEngine()');
      
      // Cách khởi tạo mới cho phiên bản 4.x
      const rtcEngine = createAgoraRtcEngine();
      
      // Khởi tạo engine với appId
      rtcEngine.initialize({
        appId: appId,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });
      
      // Thiết lập thông số cho engine
      rtcEngine.enableVideo();
      rtcEngine.enableAudio();
      rtcEngine.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      
      // Tối ưu hóa xử lý âm thanh
      rtcEngine.setAudioProfile(0, 3); // Nhạc chất lượng cao + loa ngoài + giảm ồn
      
      // Tăng âm lượng phát lại tối đa (giá trị từ 0-400, mặc định là 100)
      rtcEngine.adjustPlaybackSignalVolume(400);
      
      // Tăng âm lượng thu âm để người khác nghe rõ hơn
      rtcEngine.adjustRecordingSignalVolume(200);
      
      // Lưu engine vào state
      setEngine(rtcEngine);
      
      // Thiết lập các callback cho engine
      setupAgoraCallbacks(rtcEngine);
      
      // Tham gia kênh
      joinChannel(rtcEngine, uid);
      
    } catch (error) {
      console.error('📞 VIDEO CALL ERROR: Failed to initialize Agora:', error);
      Alert.alert(
        'Lỗi kết nối',
        'Không thể khởi tạo cuộc gọi video. Vui lòng thử lại sau.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  // Thêm state để theo dõi trạng thái camera local
  const [localCameraReady, setLocalCameraReady] = useState(false);

  // Thiết lập callbacks cho Agora Engine
  const setupAgoraCallbacks = (rtcEngine) => {
    if (!rtcEngine) return;
    
    rtcEngine.registerEventHandler({
      // Khi tham gia kênh thành công
      onJoinChannelSuccess: (connection, uid) => {
        console.log('📞 VIDEO CALL: Joined channel successfully:', connection.channelId, uid);
        setJoinSucceed(true);
        setCallStatus('connected');
        setIsCallActive(true);
        
        // Nếu là người nhận cuộc gọi, thông báo đã trả lời
        if (isIncoming) {
          // Sử dụng hàm thông báo phù hợp với loại cuộc gọi
          notifyCallAnswered(
            conversationId,
            userIdForCall,
            isGroup || false
          );
          
          // Thêm thông báo cho cuộc gọi video
          notifyVideoCallAnswered(
            conversationId,
            userIdForCall,
            isGroup || false,
            userIdForCall
          );
        }
        
        // Thông báo tham gia kênh qua socket
        notifyUserJoinedAgoraChannel(
          conversationId,
          userIdForCall,
          uid,
          user?.name || 'Người dùng',
          user?.avatar || ''
        );
        
        // Thêm thông báo tham gia kênh video
        notifyUserJoinedVideoChannel(
          conversationId,
          userIdForCall,
          uid,
          user?.name || 'Người dùng',
          user?.avatar || ''
        );
        
        // Nếu là người khởi tạo, đặt trạng thái chờ đợi
        if (isInitiator) {
          setWaitingForAnswer(true);
        }
      },

      // Khi có người dùng mới tham gia
      onUserJoined: (connection, uid, elapsed) => {
        console.log('📞 VIDEO CALL: Remote user joined:', uid);
        
        // Cập nhật danh sách người dùng
        setRemoteUsers(prev => ({
          ...prev,
          [uid]: { uid }
        }));
        
        // Cập nhật trạng thái UI
        setHasRemoteParticipants(true);
        setWaitingForAnswer(false);
      },

      // Khi người dùng rời đi
      onUserOffline: (connection, uid, reason) => {
        console.log('📞 VIDEO CALL: Remote user left:', uid, reason);
        
        // Xóa người dùng khỏi danh sách
        setRemoteUsers(prev => {
          const newUsers = { ...prev };
          delete newUsers[uid];
          return newUsers;
        });
        
        // Kiểm tra nếu không còn ai trong cuộc gọi
        setTimeout(() => {
          setRemoteUsers(current => {
            const remainingUsers = Object.keys(current).length;
            if (remainingUsers === 0) {
              setHasRemoteParticipants(false);
            }
            return current;
          });
        }, 500);
      },

      // Khi có lỗi xảy ra
      onError: (err, msg) => {
        console.error('📞 VIDEO CALL ERROR: Agora error:', err, msg);
        // Hiển thị lỗi tùy thuộc vào mã lỗi
        let errorMessage = 'Đã xảy ra lỗi. Vui lòng thử lại.';
        
        Alert.alert('Lỗi cuộc gọi', errorMessage, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      },
      
      // Khi kết nối thay đổi trạng thái
      onConnectionStateChanged: (connection, state, reason) => {
        console.log('📞 VIDEO CALL: Connection state changed:', state, reason);
      },

      // Khi trạng thái video của người dùng từ xa thay đổi
      onRemoteVideoStateChanged: (connection, uid, state, reason, elapsed) => {
        console.log('📞 VIDEO CALL: Remote video state changed:', uid, state, reason);
        
        // Cập nhật trạng thái video của người dùng
        if (state === 2) { // Decoding
          // Video đang phát
          setRemoteUsers(prev => ({
            ...prev,
            [uid]: { ...prev[uid], hasVideo: true }
          }));
        } else if (state === 0) { // Stopped
          // Video đã dừng
          setRemoteUsers(prev => ({
            ...prev,
            [uid]: { ...prev[uid], hasVideo: false }
          }));
        }
      },

      // Thêm callback để theo dõi trạng thái local video
      onLocalVideoStateChanged: (source, state, error) => {
        console.log('📞 VIDEO CALL: Local video state changed:', state, error);
        
        // state 2 = LocalVideoStreamStateCapturing (camera đang hoạt động)
        if (state === 2) {
          setLocalCameraReady(true);
        } else {
          setLocalCameraReady(false);
        }
      },
      
      // Thêm sự kiện kết nối thất bại
      onConnectionLost: (connection) => {
        console.log('📞 VIDEO CALL: Connection lost');
        Alert.alert(
          'Mất kết nối',
          'Kết nối đến máy chủ cuộc gọi đã bị mất. Vui lòng thử lại sau.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      },
    });
  };

  // Tham gia kênh Agora
  const joinChannel = async (rtcEngine, uid) => {
    if (!rtcEngine) return;
    
    try {
      const channelName = `conversation_channel_${conversationId}`;
      console.log('📞 VIDEO CALL: Joining channel:', channelName, 'with UID:', uid);
      
      // Cập nhật phương thức joinChannel cho phiên bản 4.x
      await rtcEngine.joinChannel(
        '', // token (null hoặc empty string cho không sử dụng token)
        channelName, // channelId
        uid, // uid
        {
          clientRoleType: ClientRoleType.ClientRoleBroadcaster,
          publishCameraTrack: true,
          publishMicrophoneTrack: true
        }
      );
    } catch (error) {
      console.error('📞 VIDEO CALL ERROR: Failed to join channel:', error);
      Alert.alert(
        'Lỗi kết nối',
        'Không thể tham gia cuộc gọi. Vui lòng thử lại sau.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  // Bật/tắt âm thanh
  const toggleMute = async () => {
    if (!engine) return;
    
    try {
      if (isMuted) {
        await engine.enableAudio();
      } else {
        await engine.disableAudio();
      }
      setIsMuted(!isMuted);
    } catch (error) {
      console.error('📞 VIDEO CALL ERROR: Failed to toggle audio:', error);
    }
  };

  // Bật/tắt camera
  const toggleCamera = async () => {
    if (!engine) return;
    
    try {
      if (isCameraOff) {
        await engine.enableVideo();
      } else {
        await engine.disableVideo();
      }
      setIsCameraOff(!isCameraOff);
    } catch (error) {
      console.error('📞 VIDEO CALL ERROR: Failed to toggle video:', error);
    }
  };

  // Chuyển đổi camera (trước/sau)
  const switchCamera = async () => {
    if (!engine) return;
    
    try {
      await engine.switchCamera();
    } catch (error) {
      console.error('📞 VIDEO CALL ERROR: Failed to switch camera:', error);
    }
  };

  // Kết thúc cuộc gọi và dọn dẹp
  const endCall = async () => {
    console.log('📞 VIDEO CALL: Ending call, cleaning up resources');
    
    try {
      if (engine) {
        // Thông báo rời kênh qua socket
        if (localUid) {
          notifyUserLeftAgoraChannel(conversationId, userIdForCall, localUid);
          notifyUserLeftVideoChannel(conversationId, userIdForCall, localUid);
        }
        
        // Rời kênh Agora - cập nhật cho phiên bản 4.x
        await engine.leaveChannel();
        
        // Xóa event handler và dừng các luồng
        engine.unregisterEventHandler();
        
        // Destroy engine khi không cần nữa
        engine.release();
        
        setEngine(null);
      }
      
      // Reset state
      setRemoteUsers({});
      setLocalUid(null);
      setIsCallActive(false);
      setWaitingForAnswer(false);
      setCallStatus('ended');
      setHasRemoteParticipants(false);
      
      console.log('📞 VIDEO CALL: Call cleanup completed');
    } catch (error) {
      console.error('📞 VIDEO CALL ERROR: Failed to clean up:', error);
    }
  };

  // Xử lý kết thúc cuộc gọi và di chuyển
  const handleEndCall = () => {
    endCall();
    navigation.goBack();
    return true;
  };

  // Hiển thị remote streams - cập nhật cho phiên bản 4.x
  const renderRemoteStreams = () => {
    const remoteUserIds = Object.keys(remoteUsers);
    
    if (remoteUserIds.length === 0) {
      if (waitingForAnswer) {
        return (
          <View style={styles.waitingContainer}>
            <Text style={styles.waitingText}>Đang chờ trả lời...</Text>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleEndCall}
            >
              <Text style={styles.cancelButtonText}>Hủy cuộc gọi</Text>
            </TouchableOpacity>
          </View>
        );
      }

      return (
        <View style={styles.waitingContainer}>
          <Text style={styles.waitingText}>Đang chờ người khác tham gia...</Text>
        </View>
      );
    }

    if (remoteUserIds.length === 1) {
      // Hiển thị một stream lớn
      const uid = parseInt(remoteUserIds[0]);
      return (
        <RtcSurfaceView
          canvas={{
            uid: uid,
            renderMode: RenderModeType.RenderModeFit, // Thay thế VideoRenderMode.Hidden
            zOrderMediaOverlay: true
          }}
          style={styles.fullScreenRemoteStream}
        />
      );
    }

    // Hiển thị lưới cho nhiều streams
    return (
      <View style={styles.remoteStreamsGrid}>
        {remoteUserIds.map(uid => (
          <RtcSurfaceView
            key={uid}
            canvas={{
              uid: parseInt(uid),
              renderMode: RenderModeType.RenderModeFit, // Thay thế VideoRenderMode.Hidden
              zOrderMediaOverlay: true
            }}
            style={styles.remoteStream}
          />
        ))}
      </View>
    );
  };

  // Thêm hàm để đảm bảo camera local hoạt động
  const ensureLocalVideoWorks = async () => {
    if (!engine) return;
    
    try {
      // Cố gắng khởi động lại camera
      await engine.disableVideo();
      await new Promise(resolve => setTimeout(resolve, 500));
      await engine.enableVideo();
      
      console.log('📞 VIDEO CALL: Restarting local video');
      
      // Kiểm tra sau 1 giây nếu camera vẫn không hoạt động
      setTimeout(() => {
        if (!localCameraReady) {
          console.log('📞 VIDEO CALL WARNING: Local camera still not working');
          Alert.alert(
            'Cảnh báo camera',
            'Camera của bạn có thể không hoạt động đúng. Vui lòng kiểm tra quyền camera hoặc khởi động lại ứng dụng.',
            [{ text: 'OK' }]
          );
        }
      }, 1000);
    } catch (error) {
      console.error('📞 VIDEO CALL ERROR: Failed to restart camera:', error);
    }
  };

  // Cập nhật useEffect để thử lại nếu camera không hoạt động
  useEffect(() => {
    if (joinSucceed && !localCameraReady && !isCameraOff) {
      // Thử lại khi camera không hoạt động trong 3 giây sau khi join
      const timer = setTimeout(() => {
        ensureLocalVideoWorks();
      }, 3000);
      
      return () => clearTimeout(timer);
    }
  }, [joinSucceed, localCameraReady, isCameraOff]);

  // Cập nhật phương thức renderLocalVideo hoàn toàn
  const renderLocalVideo = () => {
    // Thêm log để debug
    console.log('Rendering local video, camera state:', {
      joinSucceed: joinSucceed,
      localCameraReady: localCameraReady,
      isCameraOff: isCameraOff
    });
    
    // Nếu camera tắt, hiển thị icon
    if (isCameraOff) {
      return (
        <View style={styles.localStreamContainer}>
          <View style={[styles.localStream, {backgroundColor: '#444', justifyContent: 'center', alignItems: 'center'}]}>
            <Icon name="videocam-off" size={30} color="#fff" />
          </View>
        </View>
      );
    }
    
    // Đảm bảo chỉ render khi đã join thành công
    if (joinSucceed && engine) {
      return (
        <View style={styles.localStreamContainer}>
          {/* Force re-render với key ngẫu nhiên */}
          <RtcSurfaceView
            key={`local-view-${Date.now()}`}
            canvas={{
              uid: 0,
              renderMode: RenderModeType.RenderModeFit,
              mirrorMode: 1,
              zOrderMediaOverlay: true
            }}
            style={[styles.localStream, { backgroundColor: '#222' }]}
          />
        </View>
      );
    }
    
    // Hiển thị placeholder khi chưa sẵn sàng
    return (
      <View style={styles.localStreamContainer}>
        <View style={[styles.localStream, {backgroundColor: '#222', justifyContent: 'center', alignItems: 'center'}]}>
          <Text style={{color: 'white'}}>Đang khởi động camera...</Text>
        </View>
      </View>
    );
  };

  // Kiểm tra kết nối định kỳ
  useEffect(() => {
    if (!isCallActive) return;
    
    // Kiểm tra trạng thái kết nối của tất cả người dùng
    const checkConnectionsInterval = setInterval(() => {
      console.log('📞 VIDEO CALL: Checking connections');
      
      // Kiểm tra số lượng người dùng
      const userCount = Object.keys(remoteUsers).length;
      console.log('📞 VIDEO CALL: Remote users count:', userCount);
      
      // Cập nhật trạng thái có người tham gia hay không
      setHasRemoteParticipants(userCount > 0);
      
    }, 5000); // Kiểm tra mỗi 5 giây
    
    return () => clearInterval(checkConnectionsInterval);
  }, [isCallActive, remoteUsers]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header cuộc gọi */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleEndCall}
        >
          <Icon name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isGroup ? conversationName : (participants?.[0]?.name || caller?.name || 'Cuộc gọi')}
        </Text>
        <Text style={[
          styles.callStatus,
          callStatus === 'connecting' ? styles.callStatusConnecting :
            callStatus === 'connected' ? styles.callStatusConnected :
              styles.callStatusEnded
        ]}>
          {callStatus === 'connecting' ? 'Đang kết nối...' :
            callStatus === 'connected' ? 'Đã kết nối' :
              'Đã kết thúc'}
        </Text>
      </View>

      {/* Remote streams */}
      <View style={styles.remoteContainer}>
        {renderRemoteStreams()}
      </View>

      {/* Tạo một lớp overlay riêng cho local stream để đảm bảo hiển thị trên cùng */}
      <View style={styles.localVideoOverlay}>
        {renderLocalVideo()}
      </View>

      {/* Điều khiển cuộc gọi */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity
          style={[styles.controlButton, isMuted && styles.controlButtonActive]}
          onPress={toggleMute}
        >
          <Icon
            name={isMuted ? "mic-off" : "mic"}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlButton, isCameraOff && styles.controlButtonActive]}
          onPress={toggleCamera}
        >
          <Icon
            name={isCameraOff ? "videocam-off" : "videocam"}
            size={24}
            color="#fff"
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={switchCamera}
        >
          <Icon name="camera-reverse" size={24} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.endCallButton}
          onPress={handleEndCall}
        >
          <Icon name="call" size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  header: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  callStatus: {
    fontSize: 14,
  },
  callStatusConnecting: {
    color: '#FFC107',
  },
  callStatusConnected: {
    color: '#4CAF50',
  },
  callStatusEnded: {
    color: '#E53935',
  },
  remoteContainer: {
    flex: 1,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  waitingText: {
    color: '#fff',
    fontSize: 18,
  },
  fullScreenRemoteStream: {
    flex: 1,
    width: width,
    height: height - 180,
  },
  remoteStreamsGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  remoteStream: {
    width: width / 2 - 10,
    height: height / 3,
    margin: 5,
    borderRadius: 10,
    overflow: 'hidden',
  },
  localStreamContainer: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    width: 120,
    height: 160,
    borderRadius: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#fff',
    backgroundColor: '#333', // Thêm màu nền
    zIndex: 10,              // Thêm zIndex cao
    elevation: 10,           // Thêm elevation cho Android
    shadowColor: "#000",     // Thêm shadow cho iOS
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  localStream: {
    flex: 1,
  },
  controlsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: '#E53935',
  },
  endCallButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '135deg' }],
  },
  cancelButton: {
    marginTop: 20,
    backgroundColor: '#E53935',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  localVideoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'none', // Cho phép các sự kiện chạm xuyên qua đến remote view
    zIndex: 5,
  },
});

export default VideoCallScreen;