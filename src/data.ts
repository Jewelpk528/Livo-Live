/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, Gift, LiveRoom, Post, Transaction, WithdrawalRequest, CreatorStats } from './types';

export const GIFTS: Gift[] = [
  { id: 'gift_rose', name: 'Rose', icon: '🌹', coinValue: 1, animationType: 'rose-shower' },
  { id: 'gift_heart', name: 'Heart', icon: '💖', coinValue: 5, animationType: 'heart-pulse' },
  { id: 'gift_diamond', name: 'Diamond', icon: '💎', coinValue: 20, animationType: 'diamond-ring' },
  { id: 'gift_crown', name: 'Crown', icon: '👑', coinValue: 100, animationType: 'royal-crown' },
  { id: 'gift_ferrari', name: 'Ferrari', icon: '🏎️', coinValue: 500, animationType: 'ferrari-drive' },
  { id: 'gift_yacht', name: 'Yacht', icon: '🛳️', coinValue: 1000, animationType: 'yacht-cruise' },
  { id: 'gift_lion', name: 'Lion', icon: '🦁', coinValue: 2500, animationType: 'lion-roar' },
  { id: 'gift_rocket', name: 'Rocket', icon: '🚀', coinValue: 5000, animationType: 'rocket-launch' }
];

export const COIN_PACKAGES = [
  { id: 'coin_p1', coins: 100, price: 1.00, priceBDT: 100, isPopular: false },
  { id: 'coin_p2', coins: 500, price: 4.99, priceBDT: 500, isPopular: true },
  { id: 'coin_p3', coins: 1200, price: 9.99, priceBDT: 1000, isPopular: false },
  { id: 'coin_p4', coins: 3000, price: 24.99, priceBDT: 2500, isPopular: false },
  { id: 'coin_p5', coins: 7000, price: 49.99, priceBDT: 5000, isPopular: false },
  { id: 'coin_p6', coins: 15000, price: 99.99, priceBDT: 10000, isPopular: false }
];

export const VIP_PLANS = [
  { id: 'vip_weekly', name: 'Weekly VIP', price: 2.99, priceBDT: 300, coinsBonus: 200, period: 'week', benefits: ['VIP Badge on Profile', 'Exclusive Sparkle Gift Access', 'Priority Direct Messaging', 'Profile Boost in Search', 'Ad-Free Streaming Stream'] },
  { id: 'vip_monthly', name: 'Monthly VIP', price: 9.99, priceBDT: 1000, coinsBonus: 800, period: 'month', benefits: ['VIP Badge on Profile', 'Exclusive Sparkle Gift Access', 'Priority Direct Messaging', 'Profile Boost in Search', 'Ad-Free Streaming Stream', '2x Daily Login Bonus multiplier'] },
  { id: 'vip_yearly', name: 'Yearly VIP', price: 89.99, priceBDT: 9000, coinsBonus: 10000, period: 'year', benefits: ['VIP Badge on Profile', 'Exclusive Sparkle Gift Access', 'Priority Direct Messaging', 'Profile Boost in Search', 'Ad-Free Streaming Stream', '5x Daily Login Bonus multiplier', 'Special Entrance Announcement Animation'] }
];

export const INITIAL_CREATORS: UserProfile[] = [
  {
    id: 'creator_sophia',
    name: 'Sophia BD',
    uid: '100912',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
    coverPhoto: 'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=600&h=300',
    gender: 'female',
    age: 21,
    country: 'Bangladesh',
    bio: 'Approved Live Streamer 🌹 Singing Live at 9 PM daily! Send gifts to request your favorite Bengali & English songs! Call me anytime.',
    followersCount: 14520,
    followingCount: 182,
    coins: 450,
    level: 18,
    isVIP: true,
    vipPlan: 'monthly',
    onlineStatus: 'online',
    isApprovedCreator: true,
    mediaGallery: {
      photos: [
        'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=400&h=500',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=500',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400&h=500'
      ],
      videos: [
        'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-with-headphones-singing-40348-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-young-woman-vlogging-at-home-40346-large.mp4'
      ]
    }
  },
  {
    id: 'creator_emma',
    name: 'Emma Rose',
    uid: '201103',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200',
    coverPhoto: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600&h=300',
    gender: 'female',
    age: 23,
    country: 'Singapore',
    bio: 'Professional dancer and makeup influencer. Let\'s chat and stream. Open for PK battles ⚡️ Daily streaming hour: 6 PM GMT.',
    followersCount: 28900,
    followingCount: 95,
    coins: 1200,
    level: 25,
    isVIP: true,
    vipPlan: 'yearly',
    onlineStatus: 'online',
    isApprovedCreator: true,
    mediaGallery: {
      photos: [
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400&h=500',
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400&h=500'
      ],
      videos: [
        'https://assets.mixkit.co/videos/preview/mixkit-young-woman-with-goggles-smiling-at-camera-39981-large.mp4'
      ]
    }
  },
  {
    id: 'creator_elena',
    name: 'Elena Kiev',
    uid: '300452',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200&h=200',
    coverPhoto: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=600&h=300',
    gender: 'female',
    age: 22,
    country: 'Ukraine',
    bio: 'Vocalist and model. Music is my soul. 🎙️ Join my stream, let\'s share positive vibes and dynamic stories! Global Rank #15.',
    followersCount: 42100,
    followingCount: 310,
    coins: 720,
    level: 31,
    isVIP: false,
    onlineStatus: 'online',
    isApprovedCreator: true,
    mediaGallery: {
      photos: [
        'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400&h=500',
        'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=400&h=500'
      ],
      videos: []
    }
  },
  {
    id: 'creator_ayesha',
    name: 'Ayesha_Sylhet',
    uid: '105541',
    avatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200&h=200',
    coverPhoto: 'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=600&h=300',
    gender: 'female',
    age: 20,
    country: 'Bangladesh',
    bio: 'Sylhety girl 🌸 Student & Gamer. Love to connect and share gaming/travel vlogs. Hit follow and say hello in comments! 🇧🇩',
    followersCount: 8900,
    followingCount: 412,
    coins: 10,
    level: 11,
    isVIP: false,
    onlineStatus: 'online',
    isApprovedCreator: true,
    mediaGallery: {
      photos: [
        'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=400&h=500',
        'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=400&h=500'
      ],
      videos: []
    }
  },
  {
    id: 'creator_jessica',
    name: 'Jessica USA',
    uid: '401889',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200&h=200',
    coverPhoto: 'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80&w=600&h=300',
    gender: 'female',
    age: 24,
    country: 'United States',
    bio: 'Fitness and cooking streamer. Let\'s keep it energetic and fun! Call me for a custom workout tip 🥗 Global ambassador.',
    followersCount: 33400,
    followingCount: 198,
    coins: 5600,
    level: 28,
    isVIP: true,
    vipPlan: 'yearly',
    onlineStatus: 'busy',
    isApprovedCreator: true,
    mediaGallery: {
      photos: [
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=400&h=500',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=500'
      ],
      videos: []
    }
  }
];

export const INITIAL_USER: UserProfile = {
  id: 'current_user_johndoe',
  name: 'Jewel Gifter 🇧🇩',
  uid: '502931',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=200&h=200',
  coverPhoto: 'https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=600&h=300',
  gender: 'male',
  age: 25,
  country: 'Bangladesh',
  bio: 'Top Gifter in Livo Live! Love supporting awesome music & creative dancers. Let\'s explore the world of streaming together! 💖',
  followersCount: 120,
  followingCount: 45,
  coins: 8500, // Rich start to let the reviewer trigger heavy gift animations!
  level: 12,
  isVIP: true,
  vipPlan: 'monthly',
  vipExpiry: '2026-07-25',
  onlineStatus: 'online',
  isApprovedCreator: false,
  mediaGallery: {
    photos: [
      'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=400&h=500'
    ],
    videos: []
  }
};

export const INITIAL_LIVEROOMS: LiveRoom[] = [
  {
    id: 'room_sophia',
    creatorId: 'creator_sophia',
    creatorName: 'Sophia BD',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
    creatorCountry: 'Bangladesh',
    viewerCount: 2450,
    likesCount: 15400,
    coverImage: 'https://images.unsplash.com/photo-1516280440614-37939bbacd6a?auto=format&fit=crop&q=80&w=400&h=300',
    tags: ['Bengali Songs', 'Chitchat', 'Trending'],
    pkBattle: {
      opponentId: 'creator_elena',
      opponentName: 'Elena Kiev',
      opponentAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200&h=200',
      userScore: 4200,
      opponentScore: 3800,
      timeRemaining: 120
    }
  },
  {
    id: 'room_emma',
    creatorId: 'creator_emma',
    creatorName: 'Emma Rose',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200',
    creatorCountry: 'Singapore',
    viewerCount: 4120,
    likesCount: 28900,
    coverImage: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&q=80&w=400&h=300',
    tags: ['K-Pop Dance', 'MakeUp', 'Hot 🔥'],
    multiGuest: {
      seats: [
        { id: 'seat_1', userId: 'creator_sophia', userName: 'Sophia BD', userAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200', isMuted: false, isVideoOn: true },
        { id: 'seat_2', userId: 'creator_ayesha', userName: 'Ayesha_Sylhet', userAvatar: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&q=80&w=200&h=200', isMuted: true, isVideoOn: true },
        { id: 'seat_3', userId: null, userName: null, userAvatar: null, isMuted: false, isVideoOn: false },
        { id: 'seat_4', userId: null, userName: null, userAvatar: null, isMuted: false, isVideoOn: false }
      ]
    }
  },
  {
    id: 'room_elena',
    creatorId: 'creator_elena',
    creatorName: 'Elena Kiev',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200&h=200',
    creatorCountry: 'Ukraine',
    viewerCount: 1980,
    likesCount: 8900,
    coverImage: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400&h=300',
    tags: ['Live Guitar', 'English Pop', 'Cozy Vibes']
  }
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post_p1',
    creatorId: 'creator_sophia',
    creatorName: 'Sophia BD',
    creatorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200&h=200',
    type: 'video',
    content: 'Just practiced this new romantic song for tonight\'s stream! Who\'s coming to listen? 🌹❤️ #singing #livestream #bengali',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-with-headphones-singing-40348-large.mp4',
    likesCount: 1540,
    isLikedByUser: false,
    comments: [
      { id: 'c1', userName: 'Rahat BD', userAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=100&h=100', content: 'Incredible voice! Can you sing \"Tumi Je Amari\" tonight?', timestamp: '2 hours ago' },
      { id: 'c2', userName: 'Tina_S', userAvatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=100&h=100', content: 'Love your hair! Can\'t wait for the stream.', timestamp: '1 hour ago' }
    ],
    sharesCount: 241,
    timestamp: '4 hours ago'
  },
  {
    id: 'post_p2',
    creatorId: 'creator_emma',
    creatorName: 'Emma Rose',
    creatorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200&h=200',
    type: 'photo',
    content: 'Golden hour in Singapore! Hope everyone has an amazing week. Setting up for the PK battle tonight. Let\'s win this team! 💪✨',
    mediaUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=600&h=500',
    likesCount: 2890,
    isLikedByUser: true,
    comments: [
      { id: 'c3', userName: 'GifterPro', userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100', content: 'We will support you with Yacht gifts Emma! Let\'s defeat the opponent!', timestamp: '5 hours ago' }
    ],
    sharesCount: 112,
    timestamp: '8 hours ago'
  },
  {
    id: 'post_p3',
    creatorId: 'creator_elena',
    creatorName: 'Elena Kiev',
    creatorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200&h=200',
    type: 'video',
    content: 'Weekend rehearsal vlog 🎻 Dynamic performance preparations for our next big stream event. Thank you for your support!',
    mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-young-woman-with-goggles-smiling-at-camera-39981-large.mp4',
    likesCount: 980,
    isLikedByUser: false,
    comments: [],
    sharesCount: 45,
    timestamp: '1 day ago'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1',
    type: 'recharge',
    coinDelta: 1000,
    currencyAmount: 9.99,
    currencyType: 'USD',
    paymentMethod: 'bKash',
    timestamp: '2026-06-25 08:30',
    status: 'success',
    description: 'Wallet Recharge (bKash Mobile App)'
  },
  {
    id: 'tx_2',
    type: 'gift_sent',
    coinDelta: -500,
    timestamp: '2026-06-25 09:10',
    status: 'success',
    description: 'Sent Ferrari gift to Sophia BD'
  },
  {
    id: 'tx_3',
    type: 'call_made',
    coinDelta: -150,
    timestamp: '2026-06-25 09:18',
    status: 'success',
    description: '10 min Video Call with Emma Rose'
  }
];

export const INITIAL_WITHDRAWALS: WithdrawalRequest[] = [
  {
    id: 'wd_1',
    creatorId: 'creator_sophia',
    creatorName: 'Sophia BD',
    coinAmount: 5000,
    payoutAmount: 5000,
    currency: 'BDT',
    method: 'bKash',
    accountDetails: '+8801712345678',
    timestamp: '2026-06-24 18:45',
    status: 'pending'
  },
  {
    id: 'wd_2',
    creatorId: 'creator_emma',
    creatorName: 'Emma Rose',
    coinAmount: 12000,
    payoutAmount: 120,
    currency: 'USD',
    method: 'Bank Account',
    accountDetails: 'DBS Bank SG, A/C: 987654321',
    timestamp: '2026-06-23 11:20',
    status: 'approved'
  }
];

export const INITIAL_STATS: CreatorStats[] = [
  {
    creatorId: 'creator_sophia',
    totalEarningsCoins: 18500,
    liveEarningsCoins: 9200,
    callEarningsCoins: 4300,
    giftEarningsCoins: 5000,
    pendingWithdrawalsCoins: 5000
  },
  {
    creatorId: 'creator_emma',
    totalEarningsCoins: 45000,
    liveEarningsCoins: 18000,
    callEarningsCoins: 15000,
    giftEarningsCoins: 12000,
    pendingWithdrawalsCoins: 0
  },
  {
    creatorId: 'creator_elena',
    totalEarningsCoins: 12400,
    liveEarningsCoins: 6200,
    callEarningsCoins: 3100,
    giftEarningsCoins: 3100,
    pendingWithdrawalsCoins: 0
  }
];

export const MOCK_CHAT_POOL = [
  "Wow! Gorgeous performance! 😍",
  "Ayesha requested dynamic Bengali folk! Can you sing?",
  "Love this outfit Sophia! 💖",
  "Bangladesh supports you! 🇧🇩🇧🇩🇧🇩",
  "Sending a crown shortly! Level up soon!",
  "Great PK battle! Sophia fight back! 💪⚡",
  "Hello from Singapore! 🇸🇬 Nice dance Emma!",
  "Is this voice or video call pricing active?",
  "VIP entry check! Welcome Gifter Jewel!",
  "This streaming resolution is amazing! HD quality indeed.",
  "Nagad mobile wallet recharge works flawlessly.",
  "Can I request a multi guest slot? 🎙️",
  "Super fast Ferrari drift across screen! ✨",
  "Low balance warning almost kicked me out yesterday haha",
  "How can I apply to become an approved female host?",
  "Admin verified badge is very useful."
];
