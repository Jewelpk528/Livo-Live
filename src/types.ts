/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface UserProfile {
  id: string;
  name: string;
  uid: string;
  avatar: string;
  coverPhoto: string;
  gender: 'female' | 'male';
  age: number;
  country: string;
  bio: string;
  followersCount: number;
  followingCount: number;
  coins: number;
  level: number;
  isVIP: boolean;
  vipPlan?: 'weekly' | 'monthly' | 'yearly';
  vipExpiry?: string;
  onlineStatus: 'online' | 'offline' | 'busy';
  isApprovedCreator: boolean;
  role?: 'user' | 'admin' | 'superadmin';
  voiceCallRate?: number;
  videoCallRate?: number;
  lastRateUpdated?: string;
  mediaGallery: {
    photos: string[];
    videos: string[];
  };
}

export interface CallHistoryRecord {
  id?: string;
  callId: string;
  callerId: string;
  receiverId: string;
  callType: 'voice' | 'video';
  startedAt: string; // ISO String
  endedAt: string; // ISO String
  duration: number; // in seconds
  coinsCharged: number;
  status: 'completed' | 'missed' | 'cancelled';
  receiverEarned?: number;
  adminEarned?: number;
}

export interface Post {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  type: 'photo' | 'video';
  content: string;
  mediaUrl: string;
  likesCount: number;
  isLikedByUser: boolean;
  comments: Comment[];
  sharesCount: number;
  timestamp: string;
}

export interface Comment {
  id: string;
  userName: string;
  userAvatar: string;
  content: string;
  timestamp: string;
}

export interface Gift {
  id: string;
  name: string;
  icon: string;
  coinValue: number;
  animationType: 'rose-shower' | 'heart-pulse' | 'diamond-ring' | 'royal-crown' | 'ferrari-drive' | 'yacht-cruise' | 'lion-roar' | 'rocket-launch';
}

export interface RoomImage {
  imageUrl: string;
  uploadedAt: string; // ISO format or timestamp
  selected?: boolean;
}

export interface BackgroundMusicState {
  fileName: string;
  audioUrl: string;
  duration: number;
  isPlaying: boolean;
  loop: boolean;
  volume?: number;
}

export interface LiveRoom {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  creatorCountry: string;
  viewerCount: number;
  likesCount: number;
  coverImage: string;
  tags: string[];
  title?: string;
  bio?: string;
  category?: string;
  privacy?: string;
  password?: string;
  language?: string;
  allowGuestJoin?: boolean;
  allowGifts?: boolean;
  allowComments?: boolean;
  beautyFilter?: boolean;
  locationSharing?: string;
  scheduledTime?: string;
  images?: RoomImage[];
  backgroundMusic?: BackgroundMusicState | null;
  pkBattle?: {
    opponentId: string;
    opponentName: string;
    opponentAvatar: string;
    userScore: number;
    opponentScore: number;
    timeRemaining: number; // in seconds
  };
  multiGuest?: {
    seats: {
      id: string;
      userId: string | null;
      userName: string | null;
      userAvatar: string | null;
      isMuted: boolean;
      isVideoOn: boolean;
    }[];
  };
}

export interface LiveMessage {
  id: string;
  userId: string;
  userName: string;
  userLevel: number;
  isVIP: boolean;
  content: string;
  type: 'chat' | 'gift' | 'system' | 'join';
  giftName?: string;
  giftIcon?: string;
}

export interface CallSession {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar: string;
  type: 'voice' | 'video';
  ratePerMinute: number;
  status: 'dialing' | 'ringing' | 'connected' | 'ended';
  durationSeconds: number;
  accumulatedCost: number;
  isRecording: boolean;
  rating?: number;
}

export interface Transaction {
  id: string;
  type: 'recharge' | 'gift_sent' | 'gift_received' | 'call_made' | 'call_received' | 'withdrawal' | 'bonus';
  coinDelta: number;
  currencyAmount?: number; // USD or BDT
  currencyType?: 'USD' | 'BDT';
  paymentMethod?: string; // bKash, Nagad, Card, PayPal, stripe
  timestamp: string;
  status: 'success' | 'pending' | 'failed';
  description: string;
}

export interface WithdrawalRequest {
  id: string;
  creatorId: string;
  creatorName: string;
  coinAmount: number;
  payoutAmount: number; // in BDT or USD
  currency: 'BDT' | 'USD';
  method: 'bKash' | 'Nagad' | 'Bank Account';
  accountDetails: string;
  timestamp: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface CreatorStats {
  creatorId: string;
  totalEarningsCoins: number;
  liveEarningsCoins: number;
  callEarningsCoins: number;
  giftEarningsCoins: number;
  privateLiveEarningsCoins: number;
  premiumContentEarningsCoins: number;
  dailyEarningsCoins: number;
  weeklyEarningsCoins: number;
  monthlyEarningsCoins: number;
  pendingWithdrawalsCoins: number;
}
