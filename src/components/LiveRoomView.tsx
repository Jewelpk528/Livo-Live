/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  X, User, Gift as GiftIcon, Heart, Send, Users, ShieldAlert, Zap, Mic, MicOff, Video, VideoOff, Award, Volume2, Flag, AlertCircle,
  Crown, Trophy, Flame, RotateCcw, Sparkles, RefreshCw, Settings, Music, Trash2, Plus, Play, Pause, Square, Image as ImageIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { LiveRoom, UserProfile, Gift, LiveMessage, RoomImage, BackgroundMusicState } from '../types';
import { GIFTS, MOCK_CHAT_POOL } from '../data';
import HeartsAnimation from './HeartsAnimation';
import GiftsAnimationOverlay from './GiftsAnimationOverlay';
import { onRoomSettingsSync, uploadRoomFile, saveRoomImages, saveRoomMusic } from '../lib/firebaseService';

interface LiveRoomViewProps {
  room: LiveRoom;
  user: UserProfile;
  creators: UserProfile[];
  onClose: () => void;
  onDeductCoins: (coins: number, type: 'gift_sent' | 'call_made', description: string, creatorId?: string, callback?: () => void) => void;
  onReport: (targetId: string, targetName: string, reason: string) => void;
  onStartCall: (creator: UserProfile, type: 'voice' | 'video') => void;
  onOpenUserProfile?: (creator: UserProfile) => void;
}

export default function LiveRoomView({ room, user, creators, onClose, onDeductCoins, onReport, onStartCall, onOpenUserProfile }: LiveRoomViewProps) {
  const isMyRoom = room.creatorId === user.id;

  const handleOpenProfileForUser = (userId: string, userName: string, userAvatar?: string) => {
    if (onOpenUserProfile) {
      const foundCreator = creators.find(c => c.id === userId);
      if (foundCreator) {
        onOpenUserProfile(foundCreator);
      } else {
        // Build mock UserProfile object for regular viewer/user on the fly
        const mockProfile: UserProfile = {
          id: userId,
          name: userName,
          uid: userId.replace(/[^0-9]/g, '') || String(Math.floor(Math.random() * 80000) + 10000),
          avatar: userAvatar || `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200`,
          coverPhoto: 'https://images.unsplash.com/photo-1624224971170-2f84fed5eb5e?auto=format&fit=crop&q=80&w=600&h=450',
          gender: Math.random() > 0.5 ? 'female' : 'male',
          age: Math.floor(Math.random() * 10) + 18,
          country: room.creatorCountry || 'Bangladesh',
          bio: `Hey! I am ${userName}, an active viewer on Livo Live! Let's chat. ✨`,
          followersCount: Math.floor(Math.random() * 1200) + 50,
          followingCount: Math.floor(Math.random() * 300) + 20,
          coins: 100,
          level: Math.floor(Math.random() * 15) + 1,
          isVIP: Math.random() > 0.7,
          onlineStatus: 'online',
          isApprovedCreator: false,
          mediaGallery: {
            photos: [
              `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=500`
            ],
            videos: []
          }
        };
        onOpenUserProfile(mockProfile);
      }
    }
  };

  // Room settings state synced from Firestore/polling
  const [images, setImages] = useState<RoomImage[]>(room.images || []);
  const [backgroundMusic, setBackgroundMusic] = useState<BackgroundMusicState | null>(room.backgroundMusic || null);
  const [isUploading, setIsUploading] = useState(false);
  const [showMusicPanel, setShowMusicPanel] = useState(false);
  const [volume, setVolume] = useState(0.5); // Host local volume
  const [previewImageUrl, setPreviewImageUrl] = useState<string | null>(null);

  // Call confirmation and live preview states inside Live Room
  const [showCallConfirmation, setShowCallConfirmation] = useState<{ type: 'voice' | 'video' } | null>(null);
  const [localPreviewStream, setLocalPreviewStream] = useState<MediaStream | null>(null);
  const [insufficientCoinsError, setInsufficientCoinsError] = useState(false);
  const previewVideoRef = useRef<HTMLVideoElement | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasControlPermission = isMyRoom || user.role === 'admin' || user.role === 'superadmin';

  // Manage camera preview for video call confirmation overlay
  useEffect(() => {
    let activeStream: MediaStream | null = null;

    const startPreview = async () => {
      if (showCallConfirmation?.type === 'video') {
        try {
          const stream = await navigator.mediaDevices.getUserMedia({
            audio: true,
            video: { facingMode: 'user' }
          });
          activeStream = stream;
          setLocalPreviewStream(stream);
        } catch (err) {
          console.error("Failed to fetch camera stream for live room video preview:", err);
        }
      }
    };

    if (showCallConfirmation?.type === 'video') {
      startPreview();
    } else {
      if (localPreviewStream) {
        localPreviewStream.getTracks().forEach(t => t.stop());
        setLocalPreviewStream(null);
      }
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, [showCallConfirmation]);

  // Handle preview video ref source binding
  useEffect(() => {
    if (previewVideoRef.current && localPreviewStream) {
      previewVideoRef.current.srcObject = localPreviewStream;
    }
  }, [localPreviewStream, showCallConfirmation]);

  // Sync settings in real time
  useEffect(() => {
    const unsub = onRoomSettingsSync(room.id, (settings) => {
      setImages(settings.images || []);
      setBackgroundMusic(settings.backgroundMusic || null);
    });
    return () => unsub();
  }, [room.id]);

  // Sync background music state to local HTMLAudioElement
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
    }
    
    const audio = audioRef.current;
    
    if (backgroundMusic && backgroundMusic.audioUrl) {
      if (audio.src !== backgroundMusic.audioUrl) {
        audio.src = backgroundMusic.audioUrl;
        audio.load();
      }
      audio.loop = backgroundMusic.loop;
      
      // Control play/pause
      if (backgroundMusic.isPlaying) {
        audio.play().catch(err => {
          console.warn("Autoplay blocked or audio failed:", err);
        });
      } else {
        audio.pause();
      }
    } else {
      audio.pause();
      audio.src = '';
    }
  }, [backgroundMusic]);

  // Set local volume for the host/viewer
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMyRoom ? volume : 0.6;
    }
  }, [volume, isMyRoom]);

  // Cleanup audio on component unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  // Host Profile lookup & fallbacks
  const hostProfileFallback: UserProfile = {
    id: room.creatorId,
    name: room.creatorName,
    uid: room.creatorId.replace('LV', ''),
    avatar: room.creatorAvatar,
    coverPhoto: room.coverImage || room.creatorAvatar,
    gender: 'female',
    age: 23,
    country: room.creatorCountry || 'Bangladesh',
    bio: `Official Streamer for room ${room.id}! Join my stream and talk with me directly.`,
    followersCount: room.viewerCount * 2,
    followingCount: 30,
    coins: 12000,
    level: 15,
    isVIP: true,
    onlineStatus: 'online',
    isApprovedCreator: true,
    voiceCallRate: 5,
    videoCallRate: 15,
    mediaGallery: { photos: [], videos: [] }
  };

  const hostProfile = creators.find(c => c.id === room.creatorId) || hostProfileFallback;
  const voiceCallRate = hostProfile.voiceCallRate || 5;
  const videoCallRate = hostProfile.videoCallRate || 15;

  const handleInitiateCall = (type: 'voice' | 'video') => {
    const rate = type === 'video' ? videoCallRate : voiceCallRate;
    if (user.coins < rate) {
      setInsufficientCoinsError(true);
    } else {
      setInsufficientCoinsError(false);
    }
    setShowCallConfirmation({ type });
  };

  const handleConfirmCall = () => {
    const type = showCallConfirmation?.type;
    if (!type) return;

    const rate = type === 'video' ? videoCallRate : voiceCallRate;
    if (user.coins < rate) {
      setInsufficientCoinsError(true);
      return;
    }

    // Stop confirmation preview stream
    if (localPreviewStream) {
      localPreviewStream.getTracks().forEach(t => t.stop());
      setLocalPreviewStream(null);
    }

    setShowCallConfirmation(null);
    onStartCall(hostProfile, type);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || !hasControlPermission) return;

    if (images.length + files.length > 10) {
      alert("Maximum 10 images are allowed.");
      return;
    }

    setIsUploading(true);
    const updatedImages = [...images];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const format = file.name.split('.').pop()?.toLowerCase() || '';
        if (!['jpg', 'jpeg', 'png'].includes(format)) {
          alert(`Unsupported file format: ${file.name}. Only JPG, JPEG, PNG are supported.`);
          continue;
        }

        const imageUrl = await uploadRoomFile(room.id, file, 'images');
        updatedImages.push({
          imageUrl,
          uploadedAt: new Date().toISOString()
        });
      }
      await saveRoomImages(room.id, updatedImages);
    } catch (err: any) {
      console.error("Image upload failed:", err);
      alert(`Upload failed: ${err.message || err}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteImage = async (indexToDelete: number) => {
    if (!hasControlPermission) return;
    const updatedImages = images.filter((_, idx) => idx !== indexToDelete);
    await saveRoomImages(room.id, updatedImages);
  };

  const handleMoveImage = async (index: number, direction: 'left' | 'right') => {
    if (!hasControlPermission) return;
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= images.length) return;
    
    const updatedImages = [...images];
    const temp = updatedImages[index];
    updatedImages[index] = updatedImages[targetIndex];
    updatedImages[targetIndex] = temp;

    await saveRoomImages(room.id, updatedImages);
  };

  const handleMusicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.name.toLowerCase().endsWith('.mp3')) {
      alert("Only MP3 audio files are supported.");
      return;
    }

    setIsUploading(true);
    try {
      const audioUrl = await uploadRoomFile(room.id, file, 'music');
      
      const tempAudio = new Audio(audioUrl);
      tempAudio.addEventListener('loadedmetadata', async () => {
        const duration = tempAudio.duration || 0;
        const newMusicState: BackgroundMusicState = {
          fileName: file.name,
          audioUrl,
          duration: Math.round(duration),
          isPlaying: true,
          loop: false
        };
        await saveRoomMusic(room.id, newMusicState);
        setIsUploading(false);
      });
    } catch (err: any) {
      console.error("Error uploading audio:", err);
      alert(`Audio upload failed: ${err.message || err}`);
      setIsUploading(false);
    }
  };

  const handleTogglePlayMusic = async () => {
    if (!backgroundMusic) return;
    const updated = {
      ...backgroundMusic,
      isPlaying: !backgroundMusic.isPlaying
    };
    await saveRoomMusic(room.id, updated);
  };

  const handleToggleLoopMusic = async () => {
    if (!backgroundMusic) return;
    const updated = {
      ...backgroundMusic,
      loop: !backgroundMusic.loop
    };
    await saveRoomMusic(room.id, updated);
  };

  const [messages, setMessages] = useState<LiveMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [viewerCount, setViewerCount] = useState(room.viewerCount);
  const [likesCount, setLikesCount] = useState(room.likesCount);
  const [followState, setFollowState] = useState(false);
  
  // Heart trigger counter
  const [heartTrigger, setHeartTrigger] = useState(0);
  
  // Active screen-wide gift animation
  const [activeGiftAnimation, setActiveGiftAnimation] = useState<Gift | null>(null);

  // PK Battle State
  const [pkUserScore, setPkUserScore] = useState(room.pkBattle?.userScore || 0);
  const [pkOpponentScore, setPkOpponentScore] = useState(room.pkBattle?.opponentScore || 0);
  const [pkTimeLeft, setPkTimeLeft] = useState(room.pkBattle?.timeRemaining || 0);

  const [pkFinished, setPkFinished] = useState(false);
  const [pkWinner, setPkWinner] = useState<'user' | 'opponent' | 'draw' | null>(null);
  const [punishmentTimeLeft, setPunishmentTimeLeft] = useState(60);
  const [punishmentText, setPunishmentText] = useState('Loser must sing a funny song with a smile! 🎤');
  const [pkRecentEvent, setPkRecentEvent] = useState<{ id: string; text: string; icon: string; side: 'left' | 'right' } | null>(null);
  const [floatingTexts, setFloatingTexts] = useState<{ id: string; text: string; side: 'left' | 'right' }[]>([]);

  const userScoreRef = useRef(pkUserScore);
  const opponentScoreRef = useRef(pkOpponentScore);
  
  useEffect(() => {
    userScoreRef.current = pkUserScore;
  }, [pkUserScore]);

  useEffect(() => {
    opponentScoreRef.current = pkOpponentScore;
  }, [pkOpponentScore]);

  // Guest seat State
  const [guestSeats, setGuestSeats] = useState(room.multiGuest?.seats || []);
  const [mySeatId, setMySeatId] = useState<string | null>(null);

  // Selected chat user for Moderation
  const [selectedUserMod, setSelectedUserMod] = useState<{ id: string; name: string } | null>(null);
  const [mutedUsers, setMutedUsers] = useState<Set<string>>(new Set());

  // Gifts Sheet toggler
  const [showGifts, setShowGifts] = useState(false);

  // Report Form Toggler
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Real Camera Feed Integration States & Refs
  const [permissionStatus, setPermissionStatus] = useState<'prompt' | 'granted' | 'denied' | 'permanently_denied'>('prompt');
  const [permissionAttempts, setPermissionAttempts] = useState(0);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showSettingsSimulator, setShowSettingsSimulator] = useState(false);

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string | null>(null);
  const hostVideoRef = useRef<HTMLVideoElement>(null);
  const pkVideoRef = useRef<HTMLVideoElement>(null);
  const guestVideoRef = useRef<HTMLVideoElement>(null);

  const startCamera = async (deviceId?: string) => {
    if (!isMyRoom) return;
    try {
      // Clean up previous stream tracks first
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }

      const videoConstraints: MediaTrackConstraints = deviceId 
        ? { deviceId: { exact: deviceId }, width: { ideal: 645 }, height: { ideal: 485 } }
        : { facingMode: "user", width: { ideal: 645 }, height: { ideal: 485 } };

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: true
      });
      
      setCameraStream(stream);
      setIsCameraActive(true);
      setShowPermissionModal(false);
      setPermissionStatus('granted');
      
      // Query and fetch available cameras for switching (labels populate once permission is granted)
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoInputs = devices.filter(d => d.kind === 'videoinput');
        setVideoDevices(videoInputs);
        
        // Match active device
        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          if (settings.deviceId) {
            setActiveDeviceId(settings.deviceId);
          } else if (deviceId) {
            setActiveDeviceId(deviceId);
          } else if (videoInputs.length > 0) {
            setActiveDeviceId(videoInputs[0].deviceId);
          }
        }
      } catch (enumErr) {
        console.warn("Could not enumerate media devices:", enumErr);
      }
      
      const camMsg: LiveMessage = {
        id: `cam_${Date.now()}`,
        userId: 'system',
        userName: 'SYSTEM',
        userLevel: 0,
        isVIP: false,
        content: `📹 Live room camera started! Real-time stream is active.`,
        type: 'system'
      };
      setMessages(prev => [...prev.slice(-45), camMsg]);
    } catch (err: any) {
      console.error("Camera access error:", err);
      
      setPermissionAttempts(prev => {
        const nextAttempts = prev + 1;
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError' || err.name === 'SecurityError') {
          if (nextAttempts >= 2) {
            setPermissionStatus('permanently_denied');
          } else {
            setPermissionStatus('denied');
          }
        } else {
          setPermissionStatus('denied');
        }
        return nextAttempts;
      });
      
      setShowPermissionModal(true);
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
    setActiveDeviceId(null);
  };

  const switchCamera = async () => {
    try {
      let devices = videoDevices;
      if (devices.length === 0) {
        try {
          const rawDevices = await navigator.mediaDevices.enumerateDevices();
          devices = rawDevices.filter(d => d.kind === 'videoinput');
          setVideoDevices(devices);
        } catch (e) {
          console.error(e);
        }
      }

      // If we don't have multiple devices detected, toggle facingMode
      if (devices.length <= 1) {
        const videoTrack = cameraStream?.getVideoTracks()[0];
        let nextFacingMode = "environment";
        if (videoTrack) {
          const settings = videoTrack.getSettings();
          if (settings.facingMode === "environment") {
            nextFacingMode = "user";
          }
        }

        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: nextFacingMode,
            width: { ideal: 645 },
            height: { ideal: 485 }
          },
          audio: true
        });

        setCameraStream(stream);
        setIsCameraActive(true);

        const freshDevices = await navigator.mediaDevices.enumerateDevices();
        setVideoDevices(freshDevices.filter(d => d.kind === 'videoinput'));

        const camMsg: LiveMessage = {
          id: `cam_switch_${Date.now()}`,
          userId: 'system',
          userName: 'SYSTEM',
          userLevel: 0,
          isVIP: false,
          content: `🔄 Camera switched to facing: ${nextFacingMode}`,
          type: 'system'
        };
        setMessages(prev => [...prev.slice(-45), camMsg]);
        return;
      }

      // Cycle device IDs if we have listed multiple options
      const currentIndex = devices.findIndex(d => d.deviceId === activeDeviceId);
      const nextIndex = (currentIndex + 1) % devices.length;
      const nextDevice = devices[nextIndex];

      await startCamera(nextDevice.deviceId);

      const camMsg: LiveMessage = {
        id: `cam_switch_${Date.now()}`,
        userId: 'system',
        userName: 'SYSTEM',
        userLevel: 0,
        isVIP: false,
        content: `🔄 Camera switched to: ${nextDevice.label || `Device ${nextIndex + 1}`}`,
        type: 'system'
      };
      setMessages(prev => [...prev.slice(-45), camMsg]);
    } catch (err: any) {
      console.error("Error switching camera:", err);
      alert(`Could not switch camera. Error: ${err.message || err}`);
    }
  };

  // Clean up camera on unmount
  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  // Start camera and microphone automatically on mount for the host
  useEffect(() => {
    if (isMyRoom) {
      startCamera();
    }
  }, [isMyRoom]);

  // Bind the camera stream to dynamic video elements
  useEffect(() => {
    if (cameraStream) {
      if (hostVideoRef.current) hostVideoRef.current.srcObject = cameraStream;
      if (pkVideoRef.current) pkVideoRef.current.srcObject = cameraStream;
      if (guestVideoRef.current) guestVideoRef.current.srcObject = cameraStream;
    }
  }, [cameraStream, guestSeats, room.pkBattle]);

  // Initialize Chat & start simulation loops
  useEffect(() => {
    // Standard starting messages
    const initialMsgs: LiveMessage[] = [
      { id: 'm_init1', userId: 'system', userName: 'SYSTEM', userLevel: 0, isVIP: false, content: 'Welcome to Livo Live Stream! Please follow content guidelines.', type: 'system' },
      { id: 'm_init2', userId: 'join_1', userName: 'Ahmed_Dhaka', userLevel: 5, isVIP: false, content: 'joined the room', type: 'join' },
      { id: 'm_init3', userId: 'creator', userName: room.creatorName, userLevel: 30, isVIP: true, content: 'Hey everyone! Welcome to my stream! 💖 Let\'s chat or send some song requests!', type: 'chat' }
    ];
    setMessages(initialMsgs);

    // Dynamic Simulated Viewer Joins and Chats
    const msgInterval = setInterval(() => {
      const isJoin = Math.random() > 0.6;
      const randomUser = `User_${Math.floor(Math.random() * 9000) + 1000}`;
      const level = Math.floor(Math.random() * 25) + 1;
      const isVIP = Math.random() > 0.85;

      if (isJoin) {
        // Increment viewer count slightly
        setViewerCount(prev => prev + Math.floor(Math.random() * 6) - 2);
        
        const joinMsg: LiveMessage = {
          id: `msg_${Date.now()}`,
          userId: randomUser,
          userName: randomUser,
          userLevel: level,
          isVIP: isVIP,
          content: 'joined the live stream',
          type: 'join'
        };
        setMessages(prev => [...prev.slice(-40), joinMsg]);
      } else {
        const randomChatText = MOCK_CHAT_POOL[Math.floor(Math.random() * MOCK_CHAT_POOL.length)];
        
        // Don't append if user is muted
        if (!mutedUsers.has(randomUser)) {
          const chatMsg: LiveMessage = {
            id: `msg_${Date.now()}`,
            userId: randomUser,
            userName: randomUser,
            userLevel: level,
            isVIP: isVIP,
            content: randomChatText,
            type: 'chat'
          };
          setMessages(prev => [...prev.slice(-40), chatMsg]);
        }
      }
    }, 3800);

    return () => {
      clearInterval(msgInterval);
    };
  }, [room, mutedUsers]);

  // Dedicated PK Battle Game Loop, Random Events, and Punishment countdown
  useEffect(() => {
    if (!room.pkBattle) return;

    const timer = setInterval(() => {
      // 1. If battle is active and not finished
      if (!pkFinished && pkTimeLeft > 0) {
        setPkTimeLeft(prev => {
          if (prev <= 1) return 0;
          return prev - 1;
        });

        // 2. Random simulated gifting to make the battle dynamic!
        if (Math.random() < 0.15) {
          const isForHost = Math.random() > 0.5;
          const giftPool = [
            { name: 'Rose', icon: '🌹', value: 1 },
            { name: 'Heart', icon: '💖', value: 5 },
            { name: 'Diamond', icon: '💎', value: 20 },
            { name: 'Crown', icon: '👑', value: 100 },
          ];
          const randomGift = giftPool[Math.floor(Math.random() * giftPool.length)];
          const randomGifters = ['Rahul_Kolkata', 'Anis_Dhaka', 'ElenaFan_99', 'Priya_Nair', 'Hamza_Lahore', 'Nisha_Kathmandu', 'LivoGifter', 'Sohail_Sylhet', 'Ayesha_Mirpur'];
          const gifter = randomGifters[Math.floor(Math.random() * randomGifters.length)];
          const pkPoints = randomGift.value * 10;

          if (isForHost) {
            setPkUserScore(prev => prev + pkPoints);
            setPkRecentEvent({
              id: `evt_${Date.now()}`,
              text: `✨ ${gifter} sent a ${randomGift.name} ${randomGift.icon} to Sophia! (+${pkPoints} pts)`,
              icon: randomGift.icon,
              side: 'left'
            });
            
            // Add message to chat log
            setMessages(prev => [...prev, {
              id: `sim_gift_${Date.now()}`,
              userId: 'sim_user',
              userName: gifter,
              userLevel: Math.floor(Math.random() * 20) + 1,
              isVIP: Math.random() > 0.8,
              content: `sent a ${randomGift.name} ${randomGift.icon} to Sophia`,
              type: 'gift',
              giftName: randomGift.name,
              giftIcon: randomGift.icon
            }]);
          } else {
            setPkOpponentScore(prev => prev + pkPoints);
            setPkRecentEvent({
              id: `evt_${Date.now()}`,
              text: `✨ ${gifter} sent a ${randomGift.name} ${randomGift.icon} to Elena! (+${pkPoints} pts)`,
              icon: randomGift.icon,
              side: 'right'
            });
            
            // Add message to chat log
            setMessages(prev => [...prev, {
              id: `sim_gift_${Date.now()}`,
              userId: 'sim_user_opp',
              userName: gifter,
              userLevel: Math.floor(Math.random() * 20) + 1,
              isVIP: Math.random() > 0.8,
              content: `sent a ${randomGift.name} ${randomGift.icon} to Elena`,
              type: 'gift',
              giftName: randomGift.name,
              giftIcon: randomGift.icon
            }]);
          }

          // Clear event banner after 3 seconds
          setTimeout(() => {
            setPkRecentEvent(null);
          }, 3000);
        }
      } 
      // 3. If battle has finished, count down Punishment Time
      else if (pkFinished && punishmentTimeLeft > 0) {
        setPunishmentTimeLeft(prev => Math.max(0, prev - 1));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [room.pkBattle, pkFinished, pkTimeLeft, punishmentTimeLeft]);

  // Handle battle end winner determination
  useEffect(() => {
    if (pkTimeLeft === 0 && room.pkBattle && !pkFinished) {
      setPkFinished(true);
      const uScore = userScoreRef.current;
      const oScore = opponentScoreRef.current;
      let winner: 'user' | 'opponent' | 'draw' = 'draw';
      if (uScore > oScore) {
        winner = 'user';
      } else if (oScore > uScore) {
        winner = 'opponent';
      }
      setPkWinner(winner);

      const winName = winner === 'user' ? room.creatorName : room.pkBattle.opponentName;
      const annMsg: LiveMessage = {
        id: `pk_end_${Date.now()}`,
        userId: 'system',
        userName: 'SYSTEM',
        userLevel: 100,
        isVIP: true,
        content: `🏆 PK BATTLE FINISHED! ${winner === 'draw' ? "It's a DRAW!" : `${winName} wins the battle with ${Math.max(uScore, oScore).toLocaleString()} points! 🎉`}`,
        type: 'system'
      };
      setMessages(prev => [...prev, annMsg]);

      // Add fun fan comments reacting
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: `pk_react1_${Date.now()}`,
          userId: 'user_fan1',
          userName: 'GifterPro',
          userLevel: 25,
          isVIP: true,
          content: winner === 'user' ? 'Incredible! Sophia is unmatched! 👑🔥' : 'Ah, close match! Sophia we will get them next time!',
          type: 'chat'
        }, {
          id: `pk_react2_${Date.now()}`,
          userId: 'user_fan2',
          userName: 'ElenaFan_99',
          userLevel: 18,
          isVIP: false,
          content: winner === 'opponent' ? 'Elena is queen of live PK! 💃💅' : 'Such a great battle to watch, congrats everyone!',
          type: 'chat'
        }]);
      }, 1000);
    }
  }, [pkTimeLeft, pkFinished, room.pkBattle]);

  const handleCheer = (side: 'left' | 'right') => {
    const points = 50; // Add 50 points per cheer tap
    if (side === 'left') {
      setPkUserScore(prev => prev + points);
      // Spawn floating text "+50"
      const fId = `f_${Date.now()}_${Math.random()}`;
      setFloatingTexts(prev => [...prev, { id: fId, text: `+${points} Cheer!`, side: 'left' }]);
      setTimeout(() => {
        setFloatingTexts(prev => prev.filter(f => f.id !== fId));
      }, 1200);
    } else {
      setPkOpponentScore(prev => prev + points);
      // Spawn floating text "+50"
      const fId = `f_${Date.now()}_${Math.random()}`;
      setFloatingTexts(prev => [...prev, { id: fId, text: `+${points} Cheer!`, side: 'right' }]);
      setTimeout(() => {
        setFloatingTexts(prev => prev.filter(f => f.id !== fId));
      }, 1200);
    }
  };

  const handleRematch = () => {
    const punishments = [
      'Loser must sing a funny song with a smile! 🎤',
      'Loser must make funny monkey faces for 1 minute! 🐒',
      'Loser must act like a news anchor talking about cats! 🐱',
      'Loser has to do 10 spot jumps with funny hand gestures! 🏃‍♀️',
      'Loser must say "I am the funniest helper" 10 times fast! 😂',
    ];
    setPkUserScore(1000); // Reset to base scores
    setPkOpponentScore(1200);
    setPkTimeLeft(180); // 3 minutes
    setPkFinished(false);
    setPkWinner(null);
    setPunishmentTimeLeft(60);
    setPunishmentText(punishments[Math.floor(Math.random() * punishments.length)]);
    setPkRecentEvent({
      id: `rematch_${Date.now()}`,
      text: "⚡ REMATCH STARTED! Let's Go!",
      icon: "⚡",
      side: 'left'
    });
    setTimeout(() => setPkRecentEvent(null), 3000);

    const remMsg: LiveMessage = {
      id: `pk_rematch_${Date.now()}`,
      userId: 'system',
      userName: 'SYSTEM',
      userLevel: 100,
      isVIP: true,
      content: '⚡ A new 1v1 PK Battle Rematch has started! Double time is active! 🔥',
      type: 'system'
    };
    setMessages(prev => [...prev, remMsg]);
  };

  // Scroll Chat to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle User Send Chat Message
  const handleSendChat = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    if (mutedUsers.has(user.id)) {
      const warningMsg: LiveMessage = {
        id: `msg_mute_${Date.now()}`,
        userId: 'system',
        userName: 'SYSTEM',
        userLevel: 0,
        isVIP: false,
        content: 'You are muted in this room by the moderator.',
        type: 'system'
      };
      setMessages(prev => [...prev, warningMsg]);
      setInputText('');
      return;
    }

    const myMsg: LiveMessage = {
      id: `msg_my_${Date.now()}`,
      userId: user.id,
      userName: user.name,
      userLevel: user.level,
      isVIP: user.isVIP,
      content: inputText,
      type: 'chat'
    };

    setMessages(prev => [...prev, myMsg]);
    setInputText('');

    // Small chance for streamer to acknowledge user's chat message instantly
    setTimeout(() => {
      if (Math.random() > 0.4) {
        const responses = [
          `Thank you so much ${user.name}! 🥰`,
          `Yes, I totally agree! ❤️`,
          `Wow, Jewel that's amazing!`,
          `Welcome, welcome! 🌹`,
          `Can we do a call later Jewel? 😘`
        ];
        const hostReply: LiveMessage = {
          id: `reply_${Date.now()}`,
          userId: 'creator',
          userName: room.creatorName,
          userLevel: 30,
          isVIP: true,
          content: responses[Math.floor(Math.random() * responses.length)],
          type: 'chat'
        };
        setMessages(prev => [...prev, hostReply]);
      }
    }, 1500);
  };

  // Handle Send Gift Action
  const handleSendGift = (gift: Gift) => {
    if (user.coins < gift.coinValue) {
      alert("⚠️ Low balance! Please recharge your wallet in the Wallet section.");
      return;
    }

    onDeductCoins(gift.coinValue, 'gift_sent', `Sent ${gift.name} to ${room.creatorName}`, room.creatorId, () => {
      // Success Callback
      // Close gift panel for big gifts
      if (gift.coinValue >= 500) {
        setShowGifts(false);
      }

      // Launch full-screen overlays
      setActiveGiftAnimation(gift);

      // Add to PK score if active
      if (room.pkBattle) {
        setPkUserScore(prev => prev + gift.coinValue * 10); // 1 coin = 10 PK points
      }

      // Add message to chat
      const giftMsg: LiveMessage = {
        id: `gift_msg_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userLevel: user.level,
        isVIP: user.isVIP,
        content: `sent a ${gift.name} ${gift.icon}`,
        type: 'gift',
        giftName: gift.name,
        giftIcon: gift.icon
      };
      setMessages(prev => [...prev, giftMsg]);

      // Streamer reaction
      setTimeout(() => {
        const reactions = [
          `OMG! ${user.name} sent a ${gift.name}! Thank you so much! 😭😭❤️`,
          `Wow! ${gift.icon} ${gift.name}! You are incredible, ${user.name}! 🥰`,
          `My heart is beating so fast! Thank you for the ${gift.name} support! 👑`,
          `Ferraris & Yachts make me so happy! Thank you Jewel! 💋`
        ];
        const reactionText = gift.coinValue >= 500 
          ? reactions[Math.floor(Math.random() * 2) + 2] 
          : reactions[Math.floor(Math.random() * 2)];

        setMessages(prev => [...prev, {
          id: `reaction_${Date.now()}`,
          userId: 'creator',
          userName: room.creatorName,
          userLevel: 30,
          isVIP: true,
          content: reactionText,
          type: 'chat'
        }]);
      }, 1000);
    });
  };

  // Handle Double Tap / Tap Like
  const handleTapLike = () => {
    setHeartTrigger(prev => prev + 1);
    setLikesCount(prev => prev + 1);

    if (Math.random() > 0.8) {
      // Simulate chat likes
      const likeMsg: LiveMessage = {
        id: `like_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userLevel: user.level,
        isVIP: user.isVIP,
        content: 'liked the stream',
        type: 'join'
      };
      setMessages(prev => [...prev.slice(-45), likeMsg]);
    }
  };

  // Handle Multi Guest seat click
  const handleSeatClick = (seatId: string) => {
    const seat = guestSeats.find(s => s.id === seatId);
    if (!seat) return;

    if (seat.userId === user.id) {
      // Leave seat
      setGuestSeats(prev => prev.map(s => s.id === seatId ? { ...s, userId: null, userName: null, userAvatar: null, isVideoOn: false } : s));
      setMySeatId(null);
    } else if (!seat.userId) {
      if (mySeatId) {
        alert("You are already occupying another seat!");
        return;
      }
      // Join seat
      setGuestSeats(prev => prev.map(s => s.id === seatId ? { 
        ...s, 
        userId: user.id, 
        userName: user.name, 
        userAvatar: user.avatar,
        isVideoOn: true 
      } : s));
      setMySeatId(seatId);

      const seatJoinMsg: LiveMessage = {
        id: `seat_${Date.now()}`,
        userId: user.id,
        userName: user.name,
        userLevel: user.level,
        isVIP: user.isVIP,
        content: 'joined the multi-guest seat 🎙️',
        type: 'join'
      };
      setMessages(prev => [...prev, seatJoinMsg]);
    }
  };

  // Handle Toggle Mic/Video on Seat
  const toggleSeatDevice = (type: 'mic' | 'video') => {
    if (!mySeatId) return;
    setGuestSeats(prev => prev.map(s => {
      if (s.id === mySeatId) {
        const nextVideoOn = type === 'video' ? !s.isVideoOn : s.isVideoOn;
        if (type === 'video') {
          if (nextVideoOn) {
            startCamera();
          } else {
            stopCamera();
          }
        }
        return {
          ...s,
          isMuted: type === 'mic' ? !s.isMuted : s.isMuted,
          isVideoOn: nextVideoOn
        };
      }
      return s;
    }));
  };

  // Moderator actions
  const handleModeratorAction = (type: 'kick' | 'mute') => {
    if (!selectedUserMod) return;
    const { id, name } = selectedUserMod;

    if (type === 'kick') {
      const kickMsg: LiveMessage = {
        id: `kick_${Date.now()}`,
        userId: 'system',
        userName: 'MODERATOR',
        userLevel: 99,
        isVIP: true,
        content: `${name} has been kicked from the live room by Moderator.`,
        type: 'system'
      };
      setMessages(prev => [...prev, kickMsg]);
      // Remove messages from that user
      setMessages(prev => prev.filter(m => m.userId !== id));
      setViewerCount(prev => Math.max(1, prev - 1));
    } else if (type === 'mute') {
      setMutedUsers(prev => {
        const n = new Set(prev);
        n.add(id);
        return n;
      });
      const muteMsg: LiveMessage = {
        id: `mute_${Date.now()}`,
        userId: 'system',
        userName: 'MODERATOR',
        userLevel: 99,
        isVIP: true,
        content: `${name} has been muted in this room.`,
        type: 'system'
      };
      setMessages(prev => [...prev, muteMsg]);
    }

    setSelectedUserMod(null);
  };

  // Handle Report creator
  const handleSubmitReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;
    onReport(room.creatorId, room.creatorName, reportReason);
    setReportReason('');
    setShowReportModal(false);
    alert(`Report submitted successfully! Admins will review the stream for: "${reportReason}".`);
  };

  return (
    <div className="absolute inset-0 z-40 bg-slate-950 flex flex-col justify-between overflow-hidden select-none">
      
      {/* Dynamic Full Screen Live stream Simulated Background or Real Video Feed */}
      <div className="absolute inset-0 w-full h-full z-0 overflow-hidden bg-slate-950">
        {cameraStream && isMyRoom ? (
          <video 
            ref={hostVideoRef}
            autoPlay
            playsInline
            muted={true}
            className="absolute inset-0 w-full h-full object-cover filter brightness-95 saturate-125 scale-x-[-1]"
          />
        ) : (
          <div 
            className="absolute inset-0 w-full h-full bg-cover bg-center filter brightness-90 saturate-125" 
            style={{ backgroundImage: `url(${room.coverImage})` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/60 z-10" />
        
        {/* Glowing live visual effects (simulating active stream camera pixels) */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />
        <div className="absolute bottom-24 right-1/4 w-36 h-36 bg-rose-500/10 rounded-full blur-3xl animate-pulse pointer-events-none" />

        {/* Floating live particle stream indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[10px] uppercase font-mono tracking-widest border border-white/10">
          <span className="w-2 h-2 bg-red-500 rounded-full animate-ping" />
          <span>HD Live</span>
        </div>
      </div>

      {/* Floating Hearts floating up layer */}
      <HeartsAnimation trigger={heartTrigger} />

      {/* Premium Gift animations overlay layer */}
      <GiftsAnimationOverlay activeGift={activeGiftAnimation} onComplete={() => setActiveGiftAnimation(null)} />

      {/* TOP HEADER: Streamer Info, Viewer counts, Exit button */}
      {backgroundMusic && backgroundMusic.isPlaying && (
        <div className="absolute top-16 left-4 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full text-white text-[9px] font-bold border border-white/10 animate-pulse z-20 shadow-lg">
          <Music className="w-3 h-3 text-pink-500 animate-bounce" />
          <span className="text-pink-400 font-mono text-[8px] max-w-[100px] truncate">
            {backgroundMusic.fileName}
          </span>
          <div className="flex gap-0.5 items-end h-2.5 w-2">
            <span className="w-0.5 bg-pink-400 h-1.5 rounded-full animate-pulse" />
            <span className="w-0.5 bg-pink-400 h-2.5 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
            <span className="w-0.5 bg-pink-400 h-1 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
          </div>
        </div>
      )}

      <div className="relative z-20 p-3 flex justify-between items-start pt-4">
        <div className="flex flex-col gap-1.5 items-start max-w-[190px]">
          {/* Host Avatar & follow controls */}
          <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md p-1 pr-3 rounded-full border border-white/10 w-full">
            <div 
              className="relative cursor-pointer"
              onClick={() => {
                const hostProfile = creators.find(c => c.id === room.creatorId) || {
                  id: room.creatorId,
                  name: room.creatorName,
                  uid: room.creatorId.replace(/[^0-9]/g, '') || '102945',
                  avatar: room.creatorAvatar,
                  coverPhoto: room.coverImage || room.creatorAvatar,
                  gender: 'female',
                  age: 22,
                  country: room.creatorCountry || 'Bangladesh',
                  bio: room.bio || 'Approved Star Streamer! ✨ Let\'s chat and connect.',
                  followersCount: 18450,
                  followingCount: 154,
                  coins: 1200,
                  level: 30,
                  isVIP: true,
                  onlineStatus: 'online',
                  isApprovedCreator: true,
                  mediaGallery: {
                    photos: [room.creatorAvatar, room.coverImage || room.creatorAvatar],
                    videos: []
                  }
                } as UserProfile;
                onOpenUserProfile?.(hostProfile);
              }}
            >
              <img src={room.creatorAvatar} className="w-8 h-8 rounded-full border border-pink-500 object-cover" alt="" />
              <div className="absolute bottom-0 right-0 bg-yellow-400 text-slate-900 rounded-full p-0.5 text-[7px] font-bold">LV30</div>
            </div>
            <div 
              className="overflow-hidden cursor-pointer"
              onClick={() => {
                const hostProfile = creators.find(c => c.id === room.creatorId) || {
                  id: room.creatorId,
                  name: room.creatorName,
                  uid: room.creatorId.replace(/[^0-9]/g, '') || '102945',
                  avatar: room.creatorAvatar,
                  coverPhoto: room.coverImage || room.creatorAvatar,
                  gender: 'female',
                  age: 22,
                  country: room.creatorCountry || 'Bangladesh',
                  bio: room.bio || 'Approved Star Streamer! ✨ Let\'s chat and connect.',
                  followersCount: 18450,
                  followingCount: 154,
                  coins: 1200,
                  level: 30,
                  isVIP: true,
                  onlineStatus: 'online',
                  isApprovedCreator: true,
                  mediaGallery: {
                    photos: [room.creatorAvatar, room.coverImage || room.creatorAvatar],
                    videos: []
                  }
                } as UserProfile;
                onOpenUserProfile?.(hostProfile);
              }}
            >
              <h3 className="text-white text-[11px] font-bold truncate leading-tight">{room.creatorName}</h3>
              <p className="text-[9px] text-pink-300 flex items-center gap-0.5 font-medium leading-none">
                <span>🇧🇩</span>
                <span>{viewerCount.toLocaleString()} viewers</span>
              </p>
            </div>
            <button 
              onClick={() => setFollowState(!followState)}
              className={`ml-1 px-2.5 py-0.5 rounded-full text-[9px] font-bold transition ${followState ? 'bg-white/20 text-white' : 'bg-pink-500 text-white hover:scale-105 active:scale-95'}`}
            >
              {followState ? 'Following' : 'Follow'}
            </button>
          </div>

          {/* Call Options below Host Profile */}
          {!isMyRoom && (
            <div className="flex gap-1.5 w-full">
              <button 
                onClick={() => handleInitiateCall('voice')}
                className="flex-1 bg-green-500/90 hover:bg-green-600 text-white py-1 px-2.5 rounded-full text-[8.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-md shadow-green-500/15 active:scale-95 transition-all border border-green-400/25"
                title="Start 1-on-1 Voice Call"
              >
                <span>📞</span>
                <span>Voice</span>
              </button>
              <button 
                onClick={() => handleInitiateCall('video')}
                className="flex-1 bg-pink-500/90 hover:bg-pink-600 text-white py-1 px-2.5 rounded-full text-[8.5px] font-black uppercase tracking-wider flex items-center justify-center gap-1 shadow-md shadow-pink-500/15 active:scale-95 transition-all border border-pink-400/25"
                title="Start 1-on-1 Video Call"
              >
                <span>📹</span>
                <span>Video</span>
              </button>
            </div>
          )}
        </div>

          {/* Top Gifters, Flag, Close btn */}
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-2 mr-1">
            <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=60&h=60" className="w-6 h-6 rounded-full border border-yellow-400 object-cover" alt="" />
            <img src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=60&h=60" className="w-6 h-6 rounded-full border border-cyan-400 object-cover" alt="" />
            <div className="w-6 h-6 rounded-full bg-slate-900/60 border border-white/10 flex items-center justify-center text-[8px] text-yellow-400 font-bold">#1</div>
          </div>

          {isMyRoom && isCameraActive && (
            <button 
              onClick={switchCamera}
              className="p-1.5 bg-black/40 hover:bg-black/60 rounded-full border border-white/10 text-white transition active:scale-95 flex items-center justify-center gap-1 px-2.5 shadow-md hover:border-pink-500/30 group"
              title="Switch Camera Device (Front/Back)"
            >
              <RefreshCw className="w-3.5 h-3.5 text-pink-400 group-hover:rotate-185 transition-transform duration-500" />
              <span className="text-[8.5px] font-black uppercase tracking-wider">Switch</span>
            </button>
          )}

          <button 
            onClick={() => setShowReportModal(true)}
            className="p-1.5 bg-black/40 backdrop-blur-md hover:bg-black/60 rounded-full border border-white/10 text-white transition active:scale-95"
            title="Report Stream"
          >
            <Flag className="w-3.5 h-3.5 text-slate-300 hover:text-red-400" />
          </button>

          <button 
            onClick={onClose}
            className="p-1.5 bg-pink-500 hover:bg-pink-600 rounded-full text-white transition active:scale-95 shadow-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* DYNAMIC SCENE LAYOUT: PK Battle (Split Screen) OR Multi-Guest View */}
      <div className="relative z-10 w-full flex-grow flex flex-col justify-start px-3 py-1 overflow-hidden">
        
        {/* 1. PK BATTLE MODE LAYER ( Split Screen Live View ) */}
        {room.pkBattle && (
          <div className="w-full mt-2 mb-2 bg-black/60 backdrop-blur-md rounded-2xl p-2.5 border border-white/10 flex flex-col gap-2 shadow-2xl relative overflow-hidden">
            
            {/* Top Row: Info & Timer */}
            <div className="flex justify-between items-center px-1 text-[10px] text-white/90 font-bold uppercase tracking-wider">
              <span className="text-pink-400 flex items-center gap-1.5 font-mono">
                <Flame className="w-3.5 h-3.5 text-pink-500 animate-pulse fill-pink-500" /> 
                Sophia
              </span>
              <div className="flex items-center gap-2 bg-black/40 px-2.5 py-0.5 rounded-full border border-white/10">
                <span className={`w-1.5 h-1.5 rounded-full animate-ping ${pkFinished ? 'bg-amber-500' : 'bg-rose-500'}`} />
                <span className="text-[9px] text-yellow-400 font-mono tracking-wide">
                  {pkFinished 
                    ? punishmentTimeLeft > 0 
                      ? `PUNISHMENT: ${punishmentTimeLeft}s`
                      : "PUNISHMENT ENDED"
                    : `PK Timer: ${Math.floor(pkTimeLeft / 60)}:${(pkTimeLeft % 60).toString().padStart(2, '0')}`
                  }
                </span>
              </div>
              <span className="text-cyan-400 flex items-center gap-1.5 font-mono">
                {room.pkBattle?.opponentName}
                <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
              </span>
            </div>

            {/* Score Bar with Glowing Lead and crown placement */}
            <div className="w-full flex flex-col gap-1">
              <div className="w-full h-5 bg-slate-900 rounded-full flex overflow-hidden border border-white/10 relative shadow-inner">
                {/* Sophia Score Bar */}
                <div 
                  className="bg-gradient-to-r from-pink-500 via-rose-500 to-red-500 h-full transition-all duration-700 ease-out flex items-center pl-3 relative"
                  style={{ width: `${(pkUserScore / (pkUserScore + pkOpponentScore || 1)) * 100}%` }}
                >
                  <span className="text-[10px] text-white font-black drop-shadow-md">{pkUserScore.toLocaleString()}</span>
                  {/* Glowing lead highlight */}
                  {pkUserScore > pkOpponentScore && (
                    <div className="absolute right-1 top-0 bottom-0 flex items-center">
                      <Crown className="w-3 h-3 text-yellow-400 animate-bounce fill-yellow-400" />
                    </div>
                  )}
                </div>
                {/* Center marker line */}
                <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-0.5 bg-yellow-400 z-10 shadow-lg" />
                {/* Elena Score Bar */}
                <div 
                  className="bg-gradient-to-l from-cyan-500 via-blue-500 to-indigo-600 h-full transition-all duration-700 ease-out flex items-center justify-end pr-3 flex-grow relative"
                >
                  {/* Glowing lead highlight */}
                  {pkOpponentScore > pkUserScore && (
                    <div className="absolute left-1 top-0 bottom-0 flex items-center">
                      <Crown className="w-3 h-3 text-yellow-400 animate-bounce fill-yellow-400" />
                    </div>
                  )}
                  <span className="text-[10px] text-white font-black drop-shadow-md">{pkOpponentScore.toLocaleString()}</span>
                </div>
              </div>
              
              {/* Score breakdown percentages */}
              <div className="flex justify-between items-center text-[8px] text-slate-400 font-mono px-1">
                <span>{Math.round((pkUserScore / (pkUserScore + pkOpponentScore || 1)) * 100)}% Lead</span>
                <span className="text-yellow-400 font-bold tracking-tight">
                  {!pkFinished ? "TAP CHEER OR SEND GIFTS TO BOOST COINS" : "🏆 BATTLE DECIDED! 🏆"}
                </span>
                <span>{Math.round((pkOpponentScore / (pkUserScore + pkOpponentScore || 1)) * 100)}% Lead</span>
              </div>
            </div>

            {/* Side-by-Side Video Streams View */}
            <div className="w-full h-56 flex gap-1 bg-slate-950 rounded-xl overflow-hidden relative border border-white/10 shadow-lg">
              
              {/* Left Column: Sophia (Main Host) */}
              <div 
                className={`w-1/2 h-full relative transition-all duration-500 flex flex-col justify-between p-2 overflow-hidden ${
                  pkFinished && pkWinner === 'opponent' ? 'filter grayscale opacity-50 brightness-50' : ''
                } ${
                  pkUserScore > pkOpponentScore && !pkFinished ? 'ring-2 ring-pink-500 ring-inset animate-pulse' : ''
                }`}
              >
                {/* Video Feed Placeholder Background / Real Camera */}
                {cameraStream && isMyRoom ? (
                  <video 
                    ref={pkVideoRef}
                    autoPlay
                    playsInline
                    muted={true}
                    className="absolute inset-0 w-full h-full object-cover filter saturate-110 brightness-95 scale-x-[-1]"
                  />
                ) : (
                  <img 
                    src={room.coverImage} 
                    className="absolute inset-0 w-full h-full object-cover scale-110 object-center filter saturate-110 brightness-95" 
                    alt="" 
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

                {/* Live tag and audio visualizer */}
                <div className="relative z-10 flex justify-between items-start">
                  <span className="flex items-center gap-1 bg-pink-600/90 backdrop-blur-md text-[8px] text-white px-2 py-0.5 rounded-full font-black tracking-wider uppercase">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                    Host
                  </span>
                  <div className="bg-black/50 backdrop-blur-md p-1 rounded-full border border-white/10">
                    <Volume2 className="w-3 h-3 text-pink-400 animate-pulse" />
                  </div>
                </div>

                {/* Inner floating points tag */}
                <div className="absolute left-1/2 top-1/3 -translate-x-1/2 text-center pointer-events-none z-10">
                  <AnimatePresence>
                    {floatingTexts.filter(f => f.side === 'left').map(f => (
                      <motion.div
                        key={f.id}
                        initial={{ opacity: 0, y: 15, scale: 0.8 }}
                        animate={{ opacity: 1, y: -25, scale: 1.2 }}
                        exit={{ opacity: 0 }}
                        className="text-pink-400 text-[11px] font-black tracking-wide bg-black/75 px-2 py-0.5 rounded-full border border-pink-500/30 whitespace-nowrap"
                      >
                        {f.text}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Host bottom credentials */}
                <div className="relative z-10 flex flex-col gap-1">
                  <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm p-1 rounded-lg border border-white/5 max-w-full">
                    <img src={room.creatorAvatar} className="w-5 h-5 rounded-full border border-pink-500 object-cover" alt="" />
                    <span className="text-[9px] text-white font-bold truncate">{room.creatorName}</span>
                    <span className="text-[8px] text-pink-300 ml-auto">🇧🇩</span>
                  </div>
                  {/* Cheer button */}
                  <button 
                    onClick={() => handleCheer('left')}
                    disabled={pkFinished}
                    className="w-full py-1 bg-pink-500 hover:bg-pink-600 disabled:opacity-50 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all active:scale-95 shadow-md shadow-pink-600/20"
                  >
                    <Heart className="w-2.5 h-2.5 fill-white" /> Cheer Host
                  </button>
                </div>

                {/* WINNER BADGE DECLARATION */}
                {pkFinished && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                    {pkWinner === 'user' ? (
                      <motion.div 
                        initial={{ scale: 0, y: 30 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 120, damping: 10 }}
                        className="flex flex-col items-center relative p-3 text-center"
                      >
                        {/* Rotating Sunburst Halo Background */}
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                          className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-yellow-500/0 via-yellow-400/20 to-amber-500/0 border-2 border-dashed border-yellow-400/40 opacity-70 pointer-events-none"
                        />

                        {/* Sparkling/Floating Stars decoration */}
                        <div className="absolute -inset-10 pointer-events-none overflow-hidden">
                          {[...Array(6)].map((_, i) => (
                            <motion.span
                              key={i}
                              initial={{ y: 60, opacity: 0, x: (i - 2.5) * 15 }}
                              animate={{ y: -40, opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 0.8] }}
                              transition={{ duration: 2 + Math.random(), repeat: Infinity, delay: i * 0.3 }}
                              className="absolute left-1/2 text-yellow-300 font-bold text-xs"
                            >
                              ⭐
                            </motion.span>
                          ))}
                        </div>

                        {/* Main Trophy & Crown stack */}
                        <motion.div 
                          animate={{ y: [0, -8, 0], scale: [1, 1.05, 1] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                          className="relative z-10 bg-gradient-to-tr from-amber-400 to-yellow-300 p-3 rounded-full shadow-lg shadow-yellow-500/30 border-2 border-white"
                        >
                          <Trophy className="w-9 h-9 text-slate-950 fill-amber-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                          <Crown className="w-5 h-5 text-yellow-100 fill-yellow-400 absolute -top-3 -right-2 rotate-12 drop-shadow-md animate-bounce" />
                        </motion.div>

                        {/* Ribbon Banner */}
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: 0.3, type: "spring" }}
                          className="mt-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 px-4 py-1 rounded-full shadow-md border border-yellow-200 z-10"
                        >
                          <span className="text-[11px] font-black tracking-[0.15em] uppercase drop-shadow-sm flex items-center gap-1">
                            🏆 WINNER 🏆
                          </span>
                        </motion.div>

                        <motion.span 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 }}
                          className="text-[8px] text-yellow-300 font-extrabold tracking-wider uppercase mt-1 drop-shadow-md"
                        >
                          Champion Host
                        </motion.span>
                      </motion.div>
                    ) : pkWinner === 'opponent' ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-black/85 px-4 py-2 rounded-xl border border-red-500/30 flex flex-col items-center gap-1 shadow-2xl"
                      >
                        <span className="text-[10px] text-red-500 font-black tracking-widest uppercase">DEFEAT</span>
                        <span className="text-[8px] text-slate-400">Better luck next time!</span>
                      </motion.div>
                    ) : (
                      <motion.span 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="bg-slate-900/90 text-white text-[10px] px-3.5 py-1.5 rounded-full font-black tracking-widest uppercase border border-slate-700 shadow-xl"
                      >
                        DRAW MATCH
                      </motion.span>
                    )}
                  </div>
                )}
              </div>

              {/* CENTER VS BADGE BAR */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex flex-col items-center justify-center">
                <motion.div 
                  animate={{ scale: [1, 1.15, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="w-9 h-9 bg-gradient-to-tr from-amber-500 via-rose-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-black text-xs shadow-xl border-2 border-white/20"
                >
                  VS
                </motion.div>
              </div>

              {/* Right Column: Opponent (Elena / Kriti) */}
              <div 
                className={`w-1/2 h-full relative transition-all duration-500 flex flex-col justify-between p-2 overflow-hidden ${
                  pkFinished && pkWinner === 'user' ? 'filter grayscale opacity-50 brightness-50' : ''
                } ${
                  pkOpponentScore > pkUserScore && !pkFinished ? 'ring-2 ring-cyan-500 ring-inset animate-pulse' : ''
                }`}
              >
                {/* Video Feed Placeholder Background */}
                <img 
                  src={room.pkBattle?.opponentAvatar} 
                  className="absolute inset-0 w-full h-full object-cover scale-110 object-center filter saturate-110 brightness-95" 
                  alt="" 
                />
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60" />

                {/* Live tag and audio visualizer */}
                <div className="relative z-10 flex justify-between items-start">
                  <span className="flex items-center gap-1 bg-cyan-600/90 backdrop-blur-md text-[8px] text-white px-2 py-0.5 rounded-full font-black tracking-wider uppercase">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                    Guest
                  </span>
                  <div className="bg-black/50 backdrop-blur-md p-1 rounded-full border border-white/10">
                    <Volume2 className="w-3 h-3 text-cyan-400 animate-pulse" />
                  </div>
                </div>

                {/* Inner floating points tag */}
                <div className="absolute left-1/2 top-1/3 -translate-x-1/2 text-center pointer-events-none z-10">
                  <AnimatePresence>
                    {floatingTexts.filter(f => f.side === 'right').map(f => (
                      <motion.div
                        key={f.id}
                        initial={{ opacity: 0, y: 15, scale: 0.8 }}
                        animate={{ opacity: 1, y: -25, scale: 1.2 }}
                        exit={{ opacity: 0 }}
                        className="text-cyan-400 text-[11px] font-black tracking-wide bg-black/75 px-2 py-0.5 rounded-full border border-cyan-500/30 whitespace-nowrap"
                      >
                        {f.text}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Opponent bottom credentials */}
                <div className="relative z-10 flex flex-col gap-1">
                  <div className="flex items-center gap-1 bg-black/60 backdrop-blur-sm p-1 rounded-lg border border-white/5 max-w-full">
                    <img src={room.pkBattle?.opponentAvatar} className="w-5 h-5 rounded-full border border-cyan-500 object-cover" alt="" />
                    <span className="text-[9px] text-white font-bold truncate">{room.pkBattle?.opponentName}</span>
                    <span className="text-[8px] text-cyan-300 ml-auto">🇳🇵</span>
                  </div>
                  {/* Cheer button */}
                  <button 
                    onClick={() => handleCheer('right')}
                    disabled={pkFinished}
                    className="w-full py-1 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all active:scale-95 shadow-md shadow-cyan-600/20"
                  >
                    <Heart className="w-2.5 h-2.5 fill-white" /> Cheer Opponent
                  </button>
                </div>

                {/* WINNER BADGE DECLARATION */}
                {pkFinished && (
                  <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                    {pkWinner === 'opponent' ? (
                      <motion.div 
                        initial={{ scale: 0, y: 30 }}
                        animate={{ scale: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 120, damping: 10 }}
                        className="flex flex-col items-center relative p-3 text-center"
                      >
                        {/* Rotating Sunburst Halo Background */}
                        <motion.div 
                          animate={{ rotate: 360 }}
                          transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                          className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-yellow-500/0 via-yellow-400/20 to-amber-500/0 border-2 border-dashed border-yellow-400/40 opacity-70 pointer-events-none"
                        />

                        {/* Sparkling/Floating Stars decoration */}
                        <div className="absolute -inset-10 pointer-events-none overflow-hidden">
                          {[...Array(6)].map((_, i) => (
                            <motion.span
                              key={i}
                              initial={{ y: 60, opacity: 0, x: (i - 2.5) * 15 }}
                              animate={{ y: -40, opacity: [0, 1, 1, 0], scale: [0.5, 1.2, 0.8] }}
                              transition={{ duration: 2 + Math.random(), repeat: Infinity, delay: i * 0.3 }}
                              className="absolute left-1/2 text-yellow-300 font-bold text-xs"
                            >
                              ⭐
                            </motion.span>
                          ))}
                        </div>

                        {/* Main Trophy & Crown stack */}
                        <motion.div 
                          animate={{ y: [0, -8, 0], scale: [1, 1.05, 1] }}
                          transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                          className="relative z-10 bg-gradient-to-tr from-amber-400 to-yellow-300 p-3 rounded-full shadow-lg shadow-yellow-500/30 border-2 border-white"
                        >
                          <Trophy className="w-9 h-9 text-slate-950 fill-amber-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]" />
                          <Crown className="w-5 h-5 text-yellow-100 fill-yellow-400 absolute -top-3 -right-2 rotate-12 drop-shadow-md animate-bounce" />
                        </motion.div>

                        {/* Ribbon Banner */}
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: 1 }}
                          transition={{ delay: 0.3, type: "spring" }}
                          className="mt-2.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600 text-slate-950 px-4 py-1 rounded-full shadow-md border border-yellow-200 z-10"
                        >
                          <span className="text-[11px] font-black tracking-[0.15em] uppercase drop-shadow-sm flex items-center gap-1">
                            🏆 WINNER 🏆
                          </span>
                        </motion.div>

                        <motion.span 
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.6 }}
                          className="text-[8px] text-yellow-300 font-extrabold tracking-wider uppercase mt-1 drop-shadow-md"
                        >
                          Champion Guest
                        </motion.span>
                      </motion.div>
                    ) : pkWinner === 'user' ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-black/85 px-4 py-2 rounded-xl border border-red-500/30 flex flex-col items-center gap-1 shadow-2xl"
                      >
                        <span className="text-[10px] text-red-500 font-black tracking-widest uppercase">DEFEAT</span>
                        <span className="text-[8px] text-slate-400">Better luck next time!</span>
                      </motion.div>
                    ) : (
                      <motion.span 
                        initial={{ scale: 0.8 }}
                        animate={{ scale: 1 }}
                        className="bg-slate-900/90 text-white text-[10px] px-3.5 py-1.5 rounded-full font-black tracking-widest uppercase border border-slate-700 shadow-xl"
                      >
                        DRAW MATCH
                      </motion.span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Simulated Live Gift & Event Ticker */}
            <div className="relative h-6 flex items-center justify-center overflow-hidden bg-black/30 rounded-lg border border-white/5 py-1 px-2">
              <AnimatePresence mode="wait">
                {pkRecentEvent ? (
                  <motion.p
                    key={pkRecentEvent.id}
                    initial={{ y: 15, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -15, opacity: 0 }}
                    className="text-[9px] text-yellow-300 font-bold tracking-wide flex items-center gap-1"
                  >
                    <span>{pkRecentEvent.text}</span>
                  </motion.p>
                ) : (
                  <motion.p
                    key="default"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[8px] text-slate-400 font-medium tracking-wide flex items-center gap-1 animate-pulse"
                  >
                    ⚡ Real-time score syncing... Click "Cheer" to vote with clicks! ⚡
                  </motion.p>
                )}
              </AnimatePresence>
            </div>

            {/* PK Finished overlay with Rematch & Punishment specifications */}
            {pkFinished && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute inset-0 bg-slate-950/95 z-40 flex flex-col items-center justify-center p-4 text-center border border-yellow-500/30 rounded-2xl"
              >
                <div className="bg-yellow-500/10 p-2 rounded-full border border-yellow-500/20 mb-2">
                  <Trophy className="w-9 h-9 text-yellow-400 animate-pulse" />
                </div>
                <h3 className="text-white text-xs font-black uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-300">
                  BATTLE DECLARED
                </h3>
                
                <p className="text-slate-200 text-[11px] font-bold mt-1 max-w-[240px]">
                  {pkWinner === 'draw' 
                    ? "It's a tie match! Rematch is highly recommended!" 
                    : `${pkWinner === 'user' ? room.creatorName : room.pkBattle?.opponentName} wins the live duel! 🎉`
                  }
                </p>

                {/* Dare description */}
                <div className="mt-3 bg-black/40 p-2.5 rounded-xl border border-white/10 max-w-[240px]">
                  <span className="text-[8px] text-pink-400 uppercase tracking-widest font-black block mb-0.5">
                    😈 Punishment Dare
                  </span>
                  <span className="text-[10px] text-slate-200 font-semibold italic leading-relaxed">
                    "{punishmentText}"
                  </span>
                </div>

                {/* Rematch trigger */}
                <button
                  type="button"
                  onClick={handleRematch}
                  className="mt-4 px-6 py-2 bg-gradient-to-tr from-yellow-500 via-amber-500 to-orange-600 hover:scale-105 active:scale-95 text-slate-950 text-[10px] font-black uppercase tracking-wider rounded-full shadow-lg shadow-yellow-500/10 flex items-center gap-1.5 transition-all"
                >
                  <RotateCcw className="w-3.5 h-3.5 stroke-[3]" /> Request Rematch
                </button>
              </motion.div>
            )}

          </div>
        )}

        {/* 2. MULTI-GUEST SEATS GRID */}
        {room.multiGuest && (
          <div className="w-full mt-2 grid grid-cols-4 gap-2 bg-black/40 backdrop-blur-sm p-2 rounded-xl border border-white/5">
            {guestSeats.map((seat, idx) => (
              <div 
                key={seat.id} 
                onClick={() => {
                  if (seat.userId && seat.userId !== user.id) {
                    handleOpenProfileForUser(seat.userId, seat.userName || 'Guest', seat.userAvatar || undefined);
                  } else {
                    handleSeatClick(seat.id);
                  }
                }}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center relative cursor-pointer overflow-hidden border transition ${
                  seat.userId 
                    ? 'bg-slate-900/90 border-pink-500/40 shadow-md' 
                    : 'bg-black/30 border-dashed border-white/20 hover:border-pink-400/40'
                }`}
              >
                {seat.userId ? (
                  <div className="absolute inset-0 flex flex-col justify-between p-1">
                    {seat.isVideoOn ? (
                      seat.userId === user.id && isCameraActive && cameraStream ? (
                        <video 
                          ref={guestVideoRef}
                          autoPlay
                          playsInline
                          muted={true}
                          className="absolute inset-0 w-full h-full object-cover z-0 filter brightness-95 scale-x-[-1]"
                        />
                      ) : (
                        <img src={seat.userAvatar!} className="absolute inset-0 w-full h-full object-cover z-0 filter brightness-90 scale-110" alt="" />
                      )
                    ) : (
                      <div className="absolute inset-0 bg-slate-950 flex items-center justify-center z-0">
                        <User className="w-6 h-6 text-slate-600" />
                      </div>
                    )}
                    
                    {/* Top Seat Tag */}
                    <div className="relative z-10 flex justify-between items-center">
                      <span className="text-[7px] px-1 bg-black/50 text-yellow-400 font-bold rounded">Seat {idx+1}</span>
                      {seat.isMuted ? (
                        <MicOff className="w-2.5 h-2.5 text-red-400 bg-black/40 p-0.5 rounded-full" />
                      ) : (
                        <Mic className="w-2.5 h-2.5 text-green-400 bg-black/40 p-0.5 rounded-full" />
                      )}
                    </div>
                    {/* Bottom Name Tag */}
                    <span className="relative z-10 text-[7px] text-white font-semibold truncate bg-black/40 px-1 py-0.5 rounded-sm">
                      {seat.userName?.split(' ')[0]}
                    </span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-1">
                    <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/60">
                      <Mic className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[7px] text-white/50 font-bold uppercase tracking-wider">Join</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 3. MULTI-GUEST CONTROLS (IF USER IS ON SEAT) */}
        {mySeatId && (
          <div className="w-full flex justify-center gap-4 mt-2 mb-1">
            <button 
              onClick={() => toggleSeatDevice('mic')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold shadow-lg transition active:scale-95 ${
                guestSeats.find(s => s.id === mySeatId)?.isMuted 
                  ? 'bg-red-500 text-white' 
                  : 'bg-green-600 text-white'
              }`}
            >
              {guestSeats.find(s => s.id === mySeatId)?.isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}
              <span>{guestSeats.find(s => s.id === mySeatId)?.isMuted ? 'Muted' : 'Speaking'}</span>
            </button>

            <button 
              onClick={() => toggleSeatDevice('video')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-bold shadow-lg transition active:scale-95 ${
                !guestSeats.find(s => s.id === mySeatId)?.isVideoOn 
                  ? 'bg-slate-800 text-slate-400' 
                  : 'bg-pink-500 text-white'
              }`}
            >
              {guestSeats.find(s => s.id === mySeatId)?.isVideoOn ? <Video className="w-3 h-3" /> : <VideoOff className="w-3 h-3" />}
              <span>{guestSeats.find(s => s.id === mySeatId)?.isVideoOn ? 'Video On' : 'Video Off'}</span>
            </button>
          </div>
        )}
      </div>

      {/* DYNAMIC AUTO-SCROLLING LIVE CHAT LOG */}
      <div className="relative z-10 w-full h-[210px] px-3 flex flex-col justify-end overflow-hidden pb-1">
        <div className="overflow-y-auto max-h-[200px] flex flex-col gap-1.5 pr-2 scrollbar-none">
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              onClick={() => {
                if (msg.userId !== 'system' && msg.userId !== user.id) {
                  setSelectedUserMod({ id: msg.userId, name: msg.userName });
                }
              }}
              className="group cursor-pointer"
            >
              {/* System message */}
              {msg.type === 'system' && (
                <div className="flex items-start gap-1.5 bg-yellow-500/15 border border-yellow-500/20 p-2 rounded-xl text-[10px] text-yellow-300 font-medium">
                  <ShieldAlert className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>{msg.content}</span>
                </div>
              )}

              {/* Gift messages */}
              {msg.type === 'gift' && (
                <div className="inline-flex items-center gap-1 bg-gradient-to-r from-pink-500/20 to-purple-500/20 border border-pink-500/30 p-1.5 px-2.5 rounded-full text-[10px] shadow-sm">
                  <span className="text-yellow-400 font-bold">Lv.{msg.userLevel}</span>
                  <span 
                    className="text-white font-bold cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenProfileForUser(msg.userId, msg.userName);
                    }}
                  >
                    {msg.userName}:
                  </span>
                  <span className="text-pink-300 font-medium">{msg.content}</span>
                  <span className="text-sm scale-110 ml-1">{msg.giftIcon}</span>
                </div>
              )}

              {/* Join notifications */}
              {msg.type === 'join' && (
                <p className="text-[10px] text-slate-300/80 italic pl-1 leading-relaxed">
                  <span 
                    className="text-pink-400 font-semibold mr-1 cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenProfileForUser(msg.userId, msg.userName);
                    }}
                  >
                    {msg.userName}
                  </span>
                  {msg.content}
                </p>
              )}

              {/* Standard chat */}
              {msg.type === 'chat' && (
                <div className="inline-flex flex-wrap items-center gap-1 bg-black/35 backdrop-blur-sm p-1.5 px-3 rounded-2xl max-w-[90%] border border-white/5 hover:bg-black/50 transition">
                  <span className="text-[8px] bg-yellow-400 text-slate-900 rounded font-black px-1 mr-0.5">Lv.{msg.userLevel}</span>
                  {msg.isVIP && <span className="text-[8px] bg-pink-500 text-white rounded font-black px-1.5">VIP</span>}
                  <span 
                    className="text-white font-bold text-[10px] cursor-pointer hover:underline"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenProfileForUser(msg.userId, msg.userName);
                    }}
                  >
                    {msg.userName}:
                  </span>
                  <span className="text-slate-100 font-medium text-[10px] ml-1">{msg.content}</span>
                </div>
              )}
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
      </div>

      {/* FOOTER ACTIONS: Input chat field, Gift icon, Hearts trigger */}
      <div className="relative z-20 p-3 bg-gradient-to-t from-slate-950 to-transparent flex items-center justify-between gap-2.5 pb-4">
        {/* Input box */}
        <form onSubmit={handleSendChat} className="flex-grow flex items-center bg-black/45 backdrop-blur-md rounded-full border border-white/10 px-3 py-1">
          <input 
            type="text" 
            placeholder="Say something nice..." 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-grow bg-transparent text-white outline-none border-none text-[11px] placeholder-slate-400 py-1"
          />
          <button type="submit" className="p-1 hover:bg-white/10 rounded-full text-pink-500 transition active:scale-95">
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Coins Badge display */}
        <div className="bg-black/50 px-2 py-1.5 rounded-full border border-yellow-500/20 text-yellow-400 text-[10px] font-bold flex items-center gap-1">
          <span>🪙</span>
          <span>{user.coins}</span>
        </div>

        {/* Gift Draw Trigger */}
        <button 
          onClick={() => setShowGifts(true)}
          className="p-2 bg-gradient-to-tr from-pink-500 to-rose-600 rounded-full text-white shadow-lg transition hover:scale-105 active:scale-95"
          title="Send Gift"
        >
          <GiftIcon className="w-4 h-4" />
        </button>

        {/* MP3 Audio Player Trigger */}
        <button 
          onClick={() => setShowMusicPanel(true)}
          className={`p-2 rounded-full shadow-lg transition hover:scale-105 active:scale-95 relative ${
            backgroundMusic?.isPlaying 
              ? 'bg-gradient-to-tr from-purple-500 to-pink-600 text-white border border-pink-400/25 animate-pulse' 
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border border-white/5'
          }`}
          title="Live Music (MP3)"
        >
          <Music className={`w-4 h-4 ${backgroundMusic?.isPlaying ? 'animate-[spin_4s_linear_infinite]' : ''}`} />
          {backgroundMusic?.isPlaying && (
            <span className="absolute -top-1.5 -right-1.5 bg-green-500 text-black text-[7px] font-black w-3.5 h-3.5 rounded-full flex items-center justify-center border border-slate-950 animate-bounce">
              ♫
            </span>
          )}
        </button>

        {/* Heart Tap Trigger */}
        <button 
          onClick={handleTapLike}
          className="p-2 bg-rose-500 hover:bg-rose-600 text-white rounded-full transition hover:scale-105 active:scale-95 shadow-lg relative"
          title="Tap Like"
        >
          <Heart className="w-4 h-4 fill-white" />
        </button>
      </div>

      {/* ============ OVERLAY DIALOGS ============ */}

      {/* 1. VIRTUAL GIFTS SELECTION DRAWER */}
      <AnimatePresence>
        {showGifts && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="absolute bottom-0 inset-x-0 z-50 bg-slate-900/95 backdrop-blur-lg border-t border-white/15 rounded-t-3xl p-4 flex flex-col shadow-2xl"
          >
            {/* Drawer Header */}
            <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-3">
              <div>
                <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <GiftIcon className="w-4 h-4 text-yellow-400" /> Virtual Gift Shop
                </h3>
                <p className="text-[10px] text-slate-400">Coins automatically credited to {room.creatorName}</p>
              </div>
              <button 
                onClick={() => setShowGifts(false)}
                className="p-1 bg-white/10 hover:bg-white/20 rounded-full text-white transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Grid of Gifts */}
            <div className="grid grid-cols-4 gap-2.5 pb-4 max-h-[220px] overflow-y-auto scrollbar-none">
              {GIFTS.map((gift) => (
                <div 
                  key={gift.id}
                  onClick={() => handleSendGift(gift)}
                  className={`flex flex-col items-center justify-center p-2 rounded-xl border transition cursor-pointer ${
                    user.coins >= gift.coinValue 
                      ? 'bg-slate-800/55 border-white/10 hover:border-pink-500/50 hover:bg-slate-850' 
                      : 'bg-slate-950/40 border-slate-900 opacity-60'
                  }`}
                >
                  <div className="text-2xl mb-1 animate-pulse">{gift.icon}</div>
                  <span className="text-[9px] text-white font-bold">{gift.name}</span>
                  <span className="text-[8px] text-yellow-400 font-mono mt-0.5 flex items-center gap-0.5">
                    🪙 {gift.coinValue}
                  </span>
                </div>
              ))}
            </div>

            {/* Wallet Quick Recharge Footer */}
            <div className="flex justify-between items-center bg-black/40 p-3 rounded-xl border border-white/5">
              <div className="flex items-center gap-2">
                <span className="text-yellow-400 text-xs">🪙</span>
                <div>
                  <span className="text-white text-[11px] font-bold">Your Balance:</span>
                  <span className="text-yellow-400 text-[11px] font-mono font-bold ml-1">{user.coins} Coins</span>
                </div>
              </div>
              <span className="text-[9px] text-slate-400">Need more? Go to wallet panel!</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LIVE STREAM MUSIC PANEL DRAWER */}
      <AnimatePresence>
        {showMusicPanel && (
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
            className="absolute bottom-0 inset-x-0 z-50 bg-slate-950/95 backdrop-blur-xl border-t border-white/10 rounded-t-3xl p-5 flex flex-col shadow-2xl text-left"
          >
            {/* Header */}
            <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-4">
              <div>
                <h3 className="text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
                  <Music className={`w-4 h-4 text-pink-500 ${backgroundMusic?.isPlaying ? 'animate-bounce' : ''}`} />
                  <span>Live Stream Audio Player</span>
                </h3>
                <p className="text-[9px] text-slate-400">Upload and play background MP3 track for the live room</p>
              </div>
              <button 
                onClick={() => setShowMusicPanel(false)}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-white transition text-xs font-bold w-6 h-6 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            {/* Audio State / Controls */}
            {backgroundMusic ? (
              <div className="flex flex-col gap-4">
                {/* Visualizer & Info */}
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-8 h-8 rounded-xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20 flex-shrink-0">
                      <Music className={`w-4 h-4 text-pink-400 ${backgroundMusic.isPlaying ? 'animate-pulse' : ''}`} />
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="text-[10px] text-white font-black truncate max-w-[200px]">{backgroundMusic.fileName}</span>
                      <span className="text-[8px] text-pink-400 font-mono font-bold uppercase tracking-widest mt-0.5">
                        {backgroundMusic.isPlaying ? "Playing Live" : "Paused"}
                      </span>
                    </div>
                  </div>

                  {/* Playback animation bars if playing */}
                  {backgroundMusic.isPlaying && (
                    <div className="flex items-end gap-0.5 h-3 flex-shrink-0">
                      <div className="w-0.5 bg-pink-500 rounded-full animate-[bounce_1s_infinite_100ms] h-full" />
                      <div className="w-0.5 bg-pink-500 rounded-full animate-[bounce_1s_infinite_300ms] h-2" />
                      <div className="w-0.5 bg-pink-500 rounded-full animate-[bounce_1s_infinite_200ms] h-3" />
                    </div>
                  )}
                </div>

                {/* Main Controls Row */}
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-2">
                    {/* Play/Pause */}
                    <button 
                      onClick={handleTogglePlayMusic}
                      className="p-3 bg-pink-500 hover:bg-pink-600 text-white rounded-xl transition active:scale-95 flex items-center justify-center"
                      title={backgroundMusic.isPlaying ? "Pause" : "Play"}
                    >
                      {backgroundMusic.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    </button>

                    {/* Stop */}
                    <button 
                      onClick={async () => {
                        const updated = { ...backgroundMusic, isPlaying: false };
                        await saveRoomMusic(room.id, updated);
                        if (audioRef.current) {
                          audioRef.current.currentTime = 0;
                        }
                      }}
                      className="p-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition active:scale-95 flex items-center justify-center"
                      title="Stop"
                    >
                      <Square className="w-3.5 h-3.5" />
                    </button>

                    {/* Loop Toggle */}
                    <button 
                      onClick={handleToggleLoopMusic}
                      className={`p-2.5 px-3.5 text-[9px] font-mono font-black rounded-xl transition border ${
                        backgroundMusic.loop 
                          ? 'bg-purple-500/20 border-purple-500/30 text-purple-300' 
                          : 'bg-slate-900 border-white/5 text-slate-400'
                      }`}
                      title="Toggle Loop"
                    >
                      🔁 {backgroundMusic.loop ? 'Loop' : 'Once'}
                    </button>
                  </div>

                  {/* Remove / Clear */}
                  <button 
                    onClick={async () => await saveRoomMusic(room.id, null)}
                    className="p-3 bg-red-650/15 hover:bg-red-650/25 border border-red-500/10 text-red-400 rounded-xl transition text-[9px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    title="Remove Music"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                </div>

                {/* Volume slider */}
                <div className="bg-white/5 p-3 rounded-2xl border border-white/5 flex items-center justify-between gap-4">
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Local Volume</span>
                  <div className="flex items-center gap-2.5 flex-grow justify-end max-w-[200px]">
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.05" 
                      value={volume} 
                      onChange={(e) => setVolume(parseFloat(e.target.value))} 
                      className="w-full accent-pink-500 h-1 bg-slate-800 rounded-lg cursor-pointer"
                    />
                    <span className="font-mono text-[9px] text-slate-400 w-8 text-right font-bold">{Math.round(volume * 100)}%</span>
                  </div>
                </div>

                {/* Upload New Option */}
                <div className="flex justify-end">
                  <label className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-white/10 p-2 px-3 rounded-xl cursor-pointer transition text-[9px] font-black uppercase text-pink-400">
                    <Plus className="w-3.5 h-3.5 text-pink-500" />
                    <span>Upload New MP3</span>
                    <input 
                      type="file" 
                      accept="audio/mp3" 
                      disabled={isUploading}
                      onChange={handleMusicUpload} 
                      className="hidden" 
                    />
                  </label>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 bg-white/5 rounded-2xl border border-white/5 gap-3">
                <span className="text-[10px] text-slate-400 font-bold text-center">No audio track uploaded for this live room yet.</span>
                <label className="flex items-center gap-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white p-3 px-5 rounded-2xl cursor-pointer transition text-[10px] font-black uppercase tracking-wider shadow-lg shadow-pink-500/20 active:scale-[0.98]">
                  <Plus className="w-4 h-4 text-white" />
                  <span>{isUploading ? "Uploading..." : "Upload MP3 Track"}</span>
                  <input 
                    type="file" 
                    accept="audio/mp3" 
                    disabled={isUploading}
                    onChange={handleMusicUpload} 
                    className="hidden" 
                  />
                </label>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2. CHAT MODERATION DIALOG */}
      <AnimatePresence>
        {selectedUserMod && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 p-5 rounded-2xl w-full max-w-[260px] text-center shadow-2xl flex flex-col"
            >
              <ShieldAlert className="w-10 h-10 text-yellow-400 mx-auto mb-2.5" />
              <h3 className="text-white text-sm font-bold">Live Moderator Control</h3>
              <p className="text-slate-400 text-[10px] mt-1.5 mb-4">
                Choose action for <span className="text-pink-400 font-bold">{selectedUserMod.name}</span>
              </p>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={() => handleModeratorAction('mute')}
                  className="py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-bold transition active:scale-95"
                >
                  🤐 Mute User in Chat
                </button>
                <button 
                  onClick={() => handleModeratorAction('kick')}
                  className="py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold transition active:scale-95"
                >
                  🥾 Kick User from Room
                </button>
                <button 
                  onClick={() => setSelectedUserMod(null)}
                  className="py-1.5 bg-slate-950 text-slate-400 hover:text-white rounded-lg text-xs transition mt-1"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 3. REPORT MODAL */}
      <AnimatePresence>
        {showReportModal && (
          <div className="absolute inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/15 p-5 rounded-2xl w-full max-w-[280px] shadow-2xl flex flex-col"
            >
              <div className="flex items-center gap-2 text-red-400 mb-2">
                <AlertCircle className="w-5 h-5" />
                <h3 className="text-white text-xs font-bold uppercase tracking-wider">Report Host Content</h3>
              </div>
              <p className="text-slate-400 text-[10px] leading-relaxed mb-4">
                Help us keep Livo Live safe! Submitting reports alerts the Admin Panel instantly for content moderation.
              </p>

              <form onSubmit={handleSubmitReport} className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-slate-300 text-[10px] font-bold">Reason for Report:</label>
                  <select 
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    required
                    className="bg-slate-950 border border-white/10 text-white rounded-lg text-xs p-2 outline-none"
                  >
                    <option value="">Select violation reason...</option>
                    <option value="Inappropriate Attire/Conduct">Inappropriate Attire/Conduct</option>
                    <option value="Hate Speech or Bullying">Hate Speech or Bullying</option>
                    <option value="Underage User Streaming">Underage User Streaming</option>
                    <option value="Intellectual Property Violation">Intellectual Property Violation</option>
                    <option value="Spam or Scams">Spam or Scams</option>
                  </select>
                </div>

                <div className="flex gap-2 justify-end mt-2">
                  <button 
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded-lg text-[10px] font-bold"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold"
                  >
                    Submit Report
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 5. FULL SCREEN IMAGE PREVIEW MODAL */}
      <AnimatePresence>
        {previewImageUrl && (
          <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4" onClick={() => setPreviewImageUrl(null)}>
            <button 
              onClick={() => setPreviewImageUrl(null)}
              className="absolute top-6 right-6 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition active:scale-95 z-50"
              title="Close Preview"
            >
              <X className="w-5 h-5" />
            </button>
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-[90%] max-h-[80%] flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <img 
                src={previewImageUrl} 
                className="w-full h-full max-h-[70vh] object-contain rounded-2xl" 
                alt="Expanded Preview" 
              />
            </motion.div>
            <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-4">Tap outside or close button to exit</p>
          </div>
        )}
      </AnimatePresence>

      {/* 6. CALL CONFIRMATION AND PREVIEW OVERLAY */}
      <AnimatePresence>
        {showCallConfirmation && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-6 select-none">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-xs text-center shadow-2xl relative"
            >
              {/* Close Button */}
              <button 
                onClick={() => setShowCallConfirmation(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="relative mb-4">
                <img src={room.creatorAvatar} className="w-16 h-16 rounded-full border-2 border-pink-500 mx-auto object-cover" alt="" />
                <div className="absolute -bottom-1 -right-1 bg-pink-500 p-1 rounded-full border border-slate-900 text-white text-[8px] font-black uppercase tracking-widest">
                  {showCallConfirmation.type}
                </div>
              </div>

              <h3 className="text-white text-xs font-black uppercase tracking-wider mb-1">
                {showCallConfirmation.type === 'video' ? '📹 Video Call Request' : '📞 Voice Call Request'}
              </h3>
              <p className="text-slate-400 text-[10.5px] mb-4 leading-relaxed">
                Connect a secure 1-on-1 {showCallConfirmation.type} call session with <b>{room.creatorName}</b>.
              </p>

              {/* Real Camera Preview for Video Call */}
              {showCallConfirmation.type === 'video' && (
                <div className="w-full h-36 bg-slate-950 rounded-2xl border border-white/10 overflow-hidden relative mb-4">
                  {localPreviewStream ? (
                    <video 
                      ref={previewVideoRef} 
                      autoPlay 
                      playsInline 
                      muted 
                      className="w-full h-full object-cover transform -scale-x-100" 
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-[9px] text-slate-500">
                      <VideoOff className="w-6 h-6 text-slate-600 mb-1.5 animate-pulse" />
                      <span>Loading Camera Preview...</span>
                    </div>
                  )}
                  <div className="absolute top-2 left-2 bg-black/60 px-2 py-0.5 rounded text-[7px] font-bold uppercase tracking-widest text-pink-400">
                    Pre-Call Preview
                  </div>
                </div>
              )}

              {/* Coin Rate breakdown */}
              <div className="bg-slate-950 rounded-2xl p-3 border border-white/5 flex flex-col gap-1 text-[10.5px] font-mono mb-5">
                <div className="flex justify-between">
                  <span className="text-slate-400">Call Rate:</span>
                  <span className="text-pink-400 font-bold">🪙 {showCallConfirmation.type === 'video' ? videoCallRate : voiceCallRate} Coins/Min</span>
                </div>
                <div className="flex justify-between border-t border-white/5 pt-1 mt-1">
                  <span className="text-slate-400">Your Balance:</span>
                  <span className="text-yellow-400 font-bold">🪙 {user.coins} Coins</span>
                </div>
              </div>

              {/* Error warning if insufficient coins */}
              {insufficientCoinsError ? (
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 bg-red-500/10 border border-red-500/20 rounded-xl p-2 text-left">
                    <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                    <span className="text-[9.5px] text-red-200">Insufficient balance. Minimum 1 minute rate (<b>🪙 {showCallConfirmation.type === 'video' ? videoCallRate : voiceCallRate} Coins</b>) is required to start calling.</span>
                  </div>
                  <button 
                    disabled 
                    className="w-full py-2.5 bg-slate-800 text-slate-500 font-black uppercase tracking-widest rounded-xl text-xs cursor-not-allowed"
                  >
                    Insufficient Coins
                  </button>
                </div>
              ) : (
                <button 
                  onClick={handleConfirmCall}
                  className="w-full py-2.5 bg-pink-500 text-white font-black uppercase tracking-widest rounded-xl text-xs hover:bg-pink-600 transition active:scale-95 shadow-lg flex items-center justify-center gap-1.5"
                >
                  Confirm & Call Host
                </button>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* PERMISSIONS REJECTION OVERLAY (DENIED & PERMANENTLY DENIED DIALOGS) */}
      <AnimatePresence>
        {showPermissionModal && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-6">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl"
            >
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center border border-red-500/30 mb-4 mx-auto">
                <AlertCircle className="w-6 h-6 text-red-500" />
              </div>
              
              <h3 className="text-center text-sm font-black uppercase tracking-wider text-white">
                {permissionStatus === 'permanently_denied' ? 'Permission Blocked Permanently' : 'Device Access Required'}
              </h3>
              
              <p className="text-center text-slate-400 text-[10.5px] mt-2 leading-relaxed">
                {permissionStatus === 'permanently_denied' 
                  ? 'Your browser has blocked Camera or Microphone access. To start this Live stream, you must manually enable access in your settings.'
                  : 'To start broadcasting and connect with your audience, Livo Live requires permission to access your device camera & microphone.'
                }
              </p>

              {permissionStatus === 'permanently_denied' ? (
                /* App Settings Simulator Trigger button */
                <div className="flex flex-col gap-2 mt-5">
                  <button 
                    type="button"
                    onClick={() => setShowSettingsSimulator(true)}
                    className="w-full py-2.5 bg-pink-500 hover:bg-pink-600 text-white text-[10.5px] font-black uppercase tracking-wider rounded-xl transition shadow cursor-pointer"
                  >
                    🛠️ Open App Settings
                  </button>
                  <p className="text-[9px] text-slate-500 text-center uppercase tracking-widest font-bold">
                    Or click the lock icon 🔒 next to the web address to enable.
                  </p>
                </div>
              ) : (
                <div className="flex gap-2.5 mt-5">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowPermissionModal(false);
                      onClose(); // Exit the live room back to main screen
                    }}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10.5px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    onClick={() => {
                      startCamera();
                    }}
                    className="flex-1 py-2 bg-pink-500 hover:bg-pink-600 text-white text-[10.5px] font-black uppercase tracking-wider rounded-xl transition shadow cursor-pointer"
                  >
                    Grant Access
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* APP SETTINGS SIMULATOR PANEL */}
      <AnimatePresence>
        {showSettingsSimulator && (
          <div className="absolute inset-0 bg-black/95 z-50 flex flex-col justify-between p-6">
            <div className="flex flex-col">
              <div className="flex justify-between items-center border-b border-white/10 pb-3 mb-5">
                <div className="flex items-center gap-2">
                  <Settings className="w-5 h-5 text-slate-400" />
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">System App Settings</span>
                </div>
                <button 
                  type="button"
                  onClick={() => setShowSettingsSimulator(false)}
                  className="p-1 bg-white/10 hover:bg-white/20 rounded-full cursor-pointer text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="bg-slate-900 border border-white/10 rounded-2xl p-4 flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <img src="https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=60&h=60" className="w-10 h-10 rounded-xl object-cover" alt="" />
                  <div>
                    <h4 className="text-xs font-bold text-white">Livo Live</h4>
                    <span className="text-[8px] text-slate-400">Version 2.4.1 (Web Production Build)</span>
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-2">
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">App Permissions</span>
                  
                  {/* Camera Permission Switcher */}
                  <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-200 font-bold">Camera</span>
                    <button 
                      type="button"
                      onClick={() => setPermissionStatus('granted')}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors ${permissionStatus === 'granted' ? 'bg-pink-500' : 'bg-slate-700'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${permissionStatus === 'granted' ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>

                  {/* Microphone Permission Switcher */}
                  <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-white/5">
                    <span className="text-[10px] text-slate-200 font-bold">Microphone</span>
                    <button 
                      type="button"
                      onClick={() => setPermissionStatus('granted')}
                      className={`w-10 h-5 rounded-full p-0.5 transition-colors ${permissionStatus === 'granted' ? 'bg-pink-500' : 'bg-slate-700'}`}
                    >
                      <div className={`w-4 h-4 rounded-full bg-white transition-transform ${permissionStatus === 'granted' ? 'translate-x-5' : 'translate-x-0'}`} />
                    </button>
                  </div>
                </div>
              </div>

              <p className="text-[9.5px] text-slate-400 mt-4 leading-relaxed">
                Enabling permissions here will immediately authorize the active live session with full camera & audio access.
              </p>
            </div>

            <button 
              type="button"
              onClick={() => {
                setShowSettingsSimulator(false);
                if (permissionStatus === 'granted') {
                  setShowPermissionModal(false);
                  startCamera();
                }
              }}
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-[10.5px] font-black uppercase tracking-wider rounded-xl transition cursor-pointer"
            >
              Back to Live
            </button>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
