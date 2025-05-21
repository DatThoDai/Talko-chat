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
} from 'react-native';
import { RTCPeerConnection, RTCView, mediaDevices } from 'react-native-webrtc';
import Peer from 'react-native-peerjs';
import Icon from 'react-native-vector-icons/Ionicons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useSelector } from 'react-redux';
import {
  subscribeCallVideo,
  onNewUserCall,
  getSocket,
  initiateSocket
} from '../utils/socketService';
import InCallManager from 'react-native-incall-manager';

const { width, height } = Dimensions.get('window');

const VideoCallScreen = ({ navigation, route }) => {
  const { conversationId, participants, conversationName, isGroup } = route.params || {};
  const { user } = useSelector(state => state.auth);

  // State để quản lý cuộc gọi
  const [localStream, setLocalStream] = useState(null);
  const [remoteStreams, setRemoteStreams] = useState({});
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);
  const [callStatus, setCallStatus] = useState('connecting'); // 'connecting', 'connected', 'ended'
  const [callEndReason, setCallEndReason] = useState(''); // 'rejected', 'ended', 'error'
  const [waitingForAnswer, setWaitingForAnswer] = useState(false);
  const [hasRemoteParticipants, setHasRemoteParticipants] = useState(false);

  // Đối tượng PeerJS
  const peerServer = useRef(null);
  const peerId = useRef(null);
  const peerConnections = useRef({});

  // Thêm tham số mới từ route.params
  const {
    isInitiator = false,
    isIncoming = false,
    caller,
    pendingCallData, // Thêm dòng này
    effectiveUserId
  } = route.params || {};

  // Sử dụng userIdForCall khi gọi các hàm liên quan đến socket
  const userIdForCall = effectiveUserId || user._id;

  // Khởi tạo khi component được mount
  useEffect(() => {
    console.log('📞 VIDEO CALL: VideoCallScreen mounted');
    
    // Thêm đoạn này để chuyển đổi sang loa ngoài
    InCallManager.start({media: 'video'});
    InCallManager.setForceSpeakerphoneOn(true);
    
    console.log('📞 VIDEO CALL: Route params received:', JSON.stringify({
      conversationId,
      isInitiator,
      isIncoming,
      remotePeerId: route.params?.remotePeerId,
      participantsCount: participants?.length || 0,
    }));
    // Xử lý nút back
    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      handleEndCall
    );

    initializeCall();

    // Nếu có remotePeerId (người nhận cuộc gọi đã kết nối)
    const { remotePeerId } = route.params || {};
    if (remotePeerId && peerId.current && localStream) {
      // Gọi trực tiếp đến peer này
      callPeer(remotePeerId, localStream);
    }

    return () => {
      // Thêm dòng này để dọn dẹp
      InCallManager.stop();
      
      // Dọn dẹp khi unmount
      backHandler.remove();
      endCall();
    };
  }, []);

  useEffect(() => {
    // Kiểm tra kết nối socket
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

    // ...existing code...
  }, []);

  // Khởi tạo WebRTC
  const initializeCall = async () => {
    try {
      console.log('📞 VIDEO CALL: Initializing media stream');
      // 1. Khởi tạo stream media local
      const getUserMediaPromise = mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('getUserMedia timeout')), 10000)
      );
      const stream = await Promise.race([getUserMediaPromise, timeoutPromise]);

      console.log('📞 VIDEO CALL: Media stream initialized successfully');
      console.log('📞 VIDEO CALL: Video tracks:', stream.getVideoTracks().length);
      console.log('📞 VIDEO CALL: Audio tracks:', stream.getAudioTracks().length);
      setLocalStream(stream);

      // 2. Khởi tạo client PeerJS
      console.log('📞 VIDEO CALL: Initializing PeerJS');

      initializePeer(stream);

    } catch (error) {
      console.error('Không thể truy cập camera/microphone:', error);
      Alert.alert(
        'Không thể truy cập camera/microphone',
        'Vui lòng kiểm tra quyền truy cập và thử lại.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  // Khởi tạo PeerJS đơn giản
  const initializePeer = (stream) => {
    try {
      console.log('📞 VIDEO CALL: Creating PeerJS instance');
      
      // ⭐️ THÊM: Giám sát kết nối PeerJS với timeout
      const connectTimeout = setTimeout(() => {
        console.error('📞 VIDEO CALL ERROR: PeerJS connection timeout after 15 seconds');
        Alert.alert(
          'Không thể kết nối',
          'Máy chủ không phản hồi sau 15 giây. Vui lòng kiểm tra kết nối mạng và thử lại.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }, 15000);
      
      // ⭐️ SỬA: Cấu hình PeerJS chi tiết hơn
      peerServer.current = new Peer(); // Không tham số, dùng PeerJS cloud
      
      console.log('📞 VIDEO CALL: PeerJS instance created, waiting for open event');
      
      // ⭐️ THÊM: Log toàn bộ sự kiện
      peerServer.current.on('connection', () => {
        console.log('📞 VIDEO CALL: PeerJS connection event received');
      });
      
      peerServer.current.on('open', (id) => {
        console.log('📞 VIDEO CALL: PeerJS connected with ID:', id);
        clearTimeout(connectTimeout);
        peerId.current = id;
        
        // Chỉ gọi subscribeCallVideo nếu là người khởi tạo cuộc gọi
        if (isInitiator) {
          console.log('📞 VIDEO CALL: Subscribing to call room as initiator');
          console.log('📞 VIDEO CALL: Using user ID for call:', userIdForCall);
          
          const subscribeResult = subscribeCallVideo(conversationId, userIdForCall, id);
          console.log('📞 VIDEO CALL: Subscribe result:', subscribeResult);
        } else {
          console.log('📞 VIDEO CALL: Joining call as receiver, not sending subscribe event');
        }

        setIsCallActive(true);

        // Chỉ set waitingForAnswer nếu là người khởi tạo cuộc gọi
        if (isInitiator) {
          setWaitingForAnswer(true);
          console.log('📞 VIDEO CALL: Waiting for someone to join the call...');
        }

        // Xử lý người dùng mới tham gia cuộc gọi
        console.log('📞 VIDEO CALL: Setting up new-user-call event listener');
        onNewUserCall((data) => {
          console.log('📞 VIDEO CALL: Received new-user-call event:', {
            peerId: data.peerId,
            newUserId: data.newUserId,
            myPeerId: id
          });

          // Nếu người mới vào không phải là mình
          if (data.peerId && data.peerId !== id) {
            console.log('📞 VIDEO CALL: New user is not me, calling their peer:', data.peerId);
            // Cập nhật trạng thái
            setHasRemoteParticipants(true);
            setWaitingForAnswer(false);
            setCallStatus('connected');

            // Gọi đến peer mới
            callPeer(data.peerId, stream);
          } else {
            console.log('📞 VIDEO CALL: Ignoring my own peer ID in new-user-call event');
          }
        });
      });
      
      // Các xử lý khác giữ nguyên
      // Xử lý cuộc gọi đến
      peerServer.current.on('call', (call) => {
        console.log('📞 VIDEO CALL: Received incoming call from peer:', call.peer);

        // Trả lời cuộc gọi với stream của chúng ta
        console.log('📞 VIDEO CALL: Answering call with local stream');
        call.answer(stream);

        // Xử lý stream từ người gọi
        call.on('stream', (remoteStream) => {
          console.log('📞 VIDEO CALL: Received remote stream from:', call.peer);
          console.log('📞 VIDEO CALL: Remote stream video tracks:', remoteStream.getVideoTracks().length);
          console.log('📞 VIDEO CALL: Remote stream audio tracks:', remoteStream.getAudioTracks().length);

          setRemoteStreams(prev => ({
            ...prev,
            [call.peer]: remoteStream
          }));
        });

        // Lưu kết nối
        peerConnections.current[call.peer] = call;
      });

      // ⭐️ SỬA: Cải thiện xử lý lỗi
      peerServer.current.on('error', (err) => {
        console.error('📞 VIDEO CALL ERROR: PeerJS error:', err.type, err.message);
        
        // Phân loại lỗi để hiển thị thông báo phù hợp
        let errorMessage = 'Không thể kết nối. Vui lòng thử lại.';
        if (err.type === 'network') {
          errorMessage = 'Lỗi kết nối mạng. Kiểm tra lại kết nối internet.';
        } else if (err.type === 'server-error') {
          errorMessage = 'Máy chủ PeerJS không phản hồi. Thử lại sau.';
        } else if (err.type === 'browser-incompatible') {
          errorMessage = 'Thiết bị không hỗ trợ WebRTC.';
        }
        
        Alert.alert('Lỗi kết nối', errorMessage, [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      });

      // Thêm sự kiện disconnected
      peerServer.current.on('disconnected', () => {
        console.log('📞 VIDEO CALL: PeerJS disconnected, attempting to reconnect');
        peerServer.current.reconnect();
      });

    } catch (error) {
      console.error('📞 VIDEO CALL ERROR: Failed to initialize peer:', error);
      Alert.alert(
        'Lỗi kết nối',
        'Không thể khởi tạo kết nối gọi video.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  // Gọi đến một peer cụ thể
  const callPeer = (remotePeerId, stream) => {
    try {
      console.log('📞 VIDEO CALL: Calling peer:', remotePeerId);

      // Kiểm tra xem đã có kết nối với peer này chưa
      if (peerConnections.current[remotePeerId]) {
        console.log('📞 VIDEO CALL: Already connected to this peer, closing old connection');
        try {
          peerConnections.current[remotePeerId].close();
          // Xóa khỏi remoteStreams nếu tồn tại
          if (remoteStreams[remotePeerId]) {
            const oldStream = remoteStreams[remotePeerId];
            oldStream.getTracks().forEach(track => track.stop());
            setRemoteStreams(prev => {
              const updated = {...prev};
              delete updated[remotePeerId];
              return updated;
            });
          }
        } catch (e) {
          console.error('Error closing existing peer connection:', e);
        }
      }

      const call = peerServer.current.call(remotePeerId, stream);
      console.log('📞 VIDEO CALL: Call initiated, waiting for stream');

      // Thêm timeout để phát hiện nếu không nhận được stream
      const streamTimeout = setTimeout(() => {
        console.log('📞 VIDEO CALL: No stream received after 10 seconds');
        // Chỉ xóa timeout, KHÔNG xóa kết nối
      }, 10000);

      // Xử lý khi nhận được stream từ xa
      call.on('stream', (remoteStream) => {
        clearTimeout(streamTimeout);
        console.log('📞 VIDEO CALL: Received stream from called peer:', remotePeerId);
        
        // Kiểm tra xem stream có tracks không
        if (!remoteStream.getTracks().length) {
          console.log('📞 VIDEO CALL: Remote stream has no tracks, ignoring');
          return;
        }
        
        // Thêm vào state
        setRemoteStreams(prev => ({
          ...prev,
          [remotePeerId]: remoteStream
        }));
        
        // Cập nhật trạng thái UI
        setHasRemoteParticipants(true);
        setWaitingForAnswer(false);
        setCallStatus('connected');
      });

      // Xử lý sự kiện close
      call.on('close', () => {
        console.log('📞 VIDEO CALL: Call closed with peer:', remotePeerId);
        
        // Dừng stream nếu có
        if (remoteStreams[remotePeerId]) {
          try {
            remoteStreams[remotePeerId].getTracks().forEach(track => track.stop());
          } catch (e) {
            console.error('Error stopping tracks on close:', e);
          }
        }
        
        // Xóa khỏi state
        setRemoteStreams(prev => {
          const updated = {...prev};
          delete updated[remotePeerId];
          return updated;
        });
        
        // Xóa khỏi peerConnections
        delete peerConnections.current[remotePeerId];
        
        // Kiểm tra xem còn kết nối nào không
        const remainingPeers = Object.keys(peerConnections.current).length;
        if (remainingPeers === 0) {
          setHasRemoteParticipants(false);
        }
      });

      // Lưu trữ kết nối
      peerConnections.current[remotePeerId] = call;

    } catch (error) {
      console.error('📞 VIDEO CALL ERROR: Error calling peer:', error);
    }
  };

  // Bật/tắt âm thanh
  const toggleMute = () => {
    if (localStream) {
      const audioTracks = localStream.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  // Bật/tắt camera
  const toggleCamera = () => {
    if (localStream) {
      const videoTracks = localStream.getVideoTracks();
      videoTracks.forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsCameraOff(!isCameraOff);
    }
  };

  // Chuyển đổi camera (trước/sau)
  const switchCamera = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack._switchCamera();
      }
    }
  };

  // Kết thúc cuộc gọi và dọn dẹp
  const endCall = () => {
    console.log('📞 VIDEO CALL: Ending call, cleaning up resources');
    
    // 1. Dừng và dọn dẹp remote streams
    Object.entries(remoteStreams).forEach(([peerId, stream]) => {
      console.log(`📞 VIDEO CALL: Cleaning up remote stream for peer: ${peerId}`);
      try {
        if (stream && stream.getTracks) {
          stream.getTracks().forEach(track => {
            track.stop();
            console.log(`📞 VIDEO CALL: Stopped remote track: ${track.kind}`);
          });
        }
      } catch (err) {
        console.error('Error stopping remote stream tracks:', err);
      }
    });

    // 2. Đóng tất cả kết nối peer
    Object.entries(peerConnections.current).forEach(([peerId, call]) => {
      try {
        console.log(`📞 VIDEO CALL: Closing peer connection: ${peerId}`);
        if (call) {
          if (typeof call.close === 'function') {
            call.close();
          }
          
          // Nếu có peerConnection - đóng nó
          if (call.peerConnection) {
            call.peerConnection.close();
          }
        }
      } catch (err) {
        console.error(`Error closing peer connection ${peerId}:`, err);
      }
    });

    // 3. Đóng peer server
    if (peerServer.current) {
      try {
        peerServer.current.destroy();
        console.log('📞 VIDEO CALL: Destroyed peer server');
      } catch (err) {
        console.error('Error destroying peer server:', err);
      }
      peerServer.current = null;
    }

    // 4. Dừng local stream
    try {
      if (localStream) {
        localStream.getTracks().forEach(track => {
          track.stop();
          console.log(`📞 VIDEO CALL: Stopped local ${track.kind} track`);
        });
      }
    } catch (err) {
      console.error('Error stopping local stream:', err);
    }
    
    // 5. Reset tất cả state và refs
    peerConnections.current = {};
    peerId.current = null;

    // 6. Reset state trong setTimeout để tránh race condition
    setTimeout(() => {
      setRemoteStreams({});
      setLocalStream(null);
      setHasRemoteParticipants(false);
      setIsCallActive(false);
      setWaitingForAnswer(false);
      setCallStatus('ended');
    }, 100);
    
    console.log('📞 VIDEO CALL: Call cleanup completed');
  };

  // Xử lý kết thúc cuộc gọi và di chuyển
  const handleEndCall = () => {
    endCall();
    navigation.goBack();
    return true;
  };

  // Hiển thị remote streams
  const renderRemoteStreams = () => {
    const remoteStreamArray = Object.entries(remoteStreams);

    if (remoteStreamArray.length === 0) {
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

    if (remoteStreamArray.length === 1) {
      // Hiển thị một stream lớn
      const [peerId, stream] = remoteStreamArray[0];
      return (
        <RTCView
          streamURL={stream.toURL()}
          style={styles.fullScreenRemoteStream}
          objectFit="cover"
        />
      );
    }

    // Hiển thị lưới cho nhiều streams
    return (
      <View style={styles.remoteStreamsGrid}>
        {remoteStreamArray.map(([peerId, stream]) => (
          <RTCView
            key={peerId}
            streamURL={stream.toURL()}
            style={styles.remoteStream}
            objectFit="cover"
          />
        ))}
      </View>
    );
  };

  // Thêm useEffect mới để theo dõi khi có thể gọi peer
  useEffect(() => {
    // Khi tất cả điều kiện cần thiết đã sẵn sàng
    const { remotePeerId } = route.params || {};
    if (remotePeerId && localStream && isCallActive && isIncoming) {
      console.log('📞 VIDEO CALL: Ready to call remote peer:', remotePeerId);
      if (peerId.current) {
        console.log('📞 VIDEO CALL: Calling remote peer now:', remotePeerId);
        callPeer(remotePeerId, localStream);
      }
    }
  }, [localStream, isCallActive, route.params?.remotePeerId, isIncoming]);

  // Thêm useEffect mới
  useEffect(() => {
    if (!isCallActive) return;
    
    // Kiểm tra trạng thái kết nối của từng peer định kỳ
    const checkConnectionsInterval = setInterval(() => {
      console.log('📞 VIDEO CALL: Checking peer connections');
      
      Object.entries(peerConnections.current).forEach(([peerId, call]) => {
        if (!call || !call.peerConnection) return;
        
        const connectionState = call.peerConnection.connectionState;
        const iceConnectionState = call.peerConnection.iceConnectionState;
        
        console.log(`📞 VIDEO CALL: Peer ${peerId} state: ${connectionState}, ice: ${iceConnectionState}`);
        
        // Kiểm tra nếu kết nối đã mất
        if (connectionState === 'disconnected' || 
            connectionState === 'failed' || 
            connectionState === 'closed' ||
            iceConnectionState === 'disconnected' ||
            iceConnectionState === 'failed' ||
            iceConnectionState === 'closed') {
          
          console.log(`📞 VIDEO CALL: Removing disconnected peer: ${peerId}`);
          
          // Dừng stream
          const stream = remoteStreams[peerId];
          if (stream) {
            try {
              stream.getTracks().forEach(track => {
                track.stop();
              });
            } catch (e) {
              console.error(`Error stopping tracks for peer ${peerId}:`, e);
            }
          }
          
          // Xóa khỏi remoteStreams
          setRemoteStreams(prev => {
            const updated = {...prev};
            delete updated[peerId];
            return updated;
          });
          
          // Xóa khỏi peerConnections
          delete peerConnections.current[peerId];
        }
      });
      
      // Kiểm tra nếu tất cả các peer đã ngắt kết nối
      const activePeers = Object.values(peerConnections.current).filter(call => {
        return call && 
               call.peerConnection && 
               call.peerConnection.connectionState !== 'closed' &&
               call.peerConnection.connectionState !== 'failed';
      });
      
      if (activePeers.length === 0 && isCallActive) {
        console.log('📞 VIDEO CALL: No active peers remaining');
        setHasRemoteParticipants(false);
      }
      
    }, 5000); // Kiểm tra mỗi 5 giây
    
    return () => clearInterval(checkConnectionsInterval);
  }, [isCallActive]);

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

      {/* Local stream (xem trước nhỏ) */}
      {localStream && (
        <View style={styles.localStreamContainer}>
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.localStream}
            objectFit="cover"
            zOrder={1}
          />
        </View>
      )}

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
});

export default VideoCallScreen;