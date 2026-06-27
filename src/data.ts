/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserProfile, Gift, LiveRoom, Post, Transaction, WithdrawalRequest, CreatorStats } from './types';
import { DEMO_CREATORS } from './demoUsers';

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

// Map 100 Demo creators to UserProfile structure
const mappedDemoCreators: UserProfile[] = DEMO_CREATORS.map(c => ({
  id: c.profile.userId,
  name: c.profile.displayName,
  uid: c.profile.userId.replace('LV', ''),
  avatar: c.profile.profilePhotoUrl,
  coverPhoto: c.profile.coverPhotoUrl,
  gender: c.profile.gender === 'other' ? 'female' : c.profile.gender,
  age: c.profile.age,
  country: c.profile.country,
  bio: c.profile.shortBio,
  followersCount: c.profile.followers,
  followingCount: c.profile.following,
  coins: c.profile.coinsBalance,
  level: c.profile.level,
  isVIP: c.profile.vipStatus.includes('VIP'),
  onlineStatus: c.liveRoom.currentStatus === 'Live' ? 'online' : 'offline',
  isApprovedCreator: true,
  voiceCallRate: c.profile.level > 20 ? 10 : c.profile.level > 10 ? 8 : 5,
  videoCallRate: c.profile.level > 20 ? 25 : c.profile.level > 10 ? 18 : 15,
  mediaGallery: {
    photos: c.media.photoTitles.map((title, idx) => {
      const photoIds = [
        'photo-1524504388940-b1c1722653e1',
        'photo-1534528741775-53994a69daeb',
        'photo-1494790108377-be9c29b29330',
        'photo-1544005313-94ddf0286df2',
        'photo-1517841905240-472988babdf9'
      ];
      return `https://images.unsplash.com/${photoIds[idx % photoIds.length]}?auto=format&fit=crop&q=80&w=400&h=500`;
    }),
    videos: [
      'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-with-headphones-singing-40348-large.mp4',
      'https://assets.mixkit.co/videos/preview/mixkit-young-woman-vlogging-at-home-40346-large.mp4'
    ]
  }
}));

// Map 100 Demo live rooms to LiveRoom structure
const mappedDemoRooms: LiveRoom[] = DEMO_CREATORS.filter(c => c.liveRoom.currentStatus === 'Live').map(c => ({
  id: c.liveRoom.roomId,
  creatorId: c.profile.userId,
  creatorName: c.profile.displayName,
  creatorAvatar: c.profile.profilePhotoUrl,
  creatorCountry: c.profile.country,
  viewerCount: c.liveRoom.totalViewers,
  likesCount: Math.floor(c.liveRoom.totalFollowers / 3),
  coverImage: c.profile.coverPhotoUrl,
  tags: c.liveRoom.popularTags
}));

// Map 100 Demo creators to CreatorStats structure
const mappedDemoStats: CreatorStats[] = DEMO_CREATORS.map(c => ({
  creatorId: c.profile.userId,
  totalEarningsCoins: c.profile.totalGiftsReceived,
  liveEarningsCoins: Math.floor(c.profile.totalGiftsReceived * 0.4),
  callEarningsCoins: Math.floor(c.profile.totalVideoCalls * 30),
  giftEarningsCoins: Math.floor(c.profile.totalGiftsReceived * 0.3),
  privateLiveEarningsCoins: Math.floor(c.profile.totalGiftsReceived * 0.2),
  premiumContentEarningsCoins: Math.floor(c.profile.totalGiftsReceived * 0.1),
  dailyEarningsCoins: Math.floor(c.profile.totalGiftsReceived / 30),
  weeklyEarningsCoins: Math.floor(c.profile.totalGiftsReceived / 7),
  monthlyEarningsCoins: Math.floor(c.profile.totalGiftsReceived / 2),
  pendingWithdrawalsCoins: 0
}));

export const INITIAL_CREATORS: UserProfile[] = [
  {
    id: 'creator_sophia',
    name: 'Sophia BD',
    uid: '100912',
    avatar: 'https://images.unsplash.com/photo-1618015358954-115ef1ed6515?auto=format&fit=crop&q=80&w=250&h=250',
    coverPhoto: 'https://images.unsplash.com/photo-1624224971170-2f84fed5eb5e?auto=format&fit=crop&q=80&w=600&h=450',
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
        'https://images.unsplash.com/photo-1618015358954-115ef1ed6515?auto=format&fit=crop&q=80&w=400&h=500',
        'https://images.unsplash.com/photo-1624224971170-2f84fed5eb5e?auto=format&fit=crop&q=80&w=400&h=500',
        'https://images.unsplash.com/photo-1620932934088-fbdb2920e484?auto=format&fit=crop&q=80&w=400&h=500'
      ],
      videos: [
        'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-with-headphones-singing-40348-large.mp4',
        'https://assets.mixkit.co/videos/preview/mixkit-young-woman-vlogging-at-home-40346-large.mp4'
      ]
    }
  },
  {
    id: 'creator_emma',
    name: 'Ananya Sharma',
    uid: '201103',
    avatar: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&q=80&w=250&h=250',
    coverPhoto: 'https://images.unsplash.com/photo-1630156984285-d60927a7c933?auto=format&fit=crop&q=80&w=600&h=450',
    gender: 'female',
    age: 23,
    country: 'India',
    bio: 'Classical and Bollywood dancer. Let\'s chat and stream. Open for PK battles ⚡️ Daily streaming hour: 6 PM GMT.',
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
        'https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&q=80&w=400&h=500',
        'https://images.unsplash.com/photo-1630156984285-d60927a7c933?auto=format&fit=crop&q=80&w=400&h=500'
      ],
      videos: [
        'https://assets.mixkit.co/videos/preview/mixkit-young-woman-with-goggles-smiling-at-camera-39981-large.mp4'
      ]
    }
  },
  {
    id: 'creator_elena',
    name: 'Kriti Tamang',
    uid: '300452',
    avatar: 'https://images.unsplash.com/photo-1562088287-bde35a1ea917?auto=format&fit=crop&q=80&w=250&h=250',
    coverPhoto: 'https://images.unsplash.com/photo-1625897428517-7e2062829a26?auto=format&fit=crop&q=80&w=600&h=450',
    gender: 'female',
    age: 22,
    country: 'Nepal',
    bio: 'Singer, guitarist and model from Kathmandu. Music is my soul. 🎙️ Join my stream, let\'s share positive vibes! Global Rank #15.',
    followersCount: 42100,
    followingCount: 310,
    coins: 720,
    level: 31,
    isVIP: false,
    onlineStatus: 'online',
    isApprovedCreator: true,
    mediaGallery: {
      photos: [
        'https://images.unsplash.com/photo-1562088287-bde35a1ea917?auto=format&fit=crop&q=80&w=400&h=500',
        'https://images.unsplash.com/photo-1625897428517-7e2062829a26?auto=format&fit=crop&q=80&w=400&h=500'
      ],
      videos: []
    }
  },
  {
    id: 'creator_ayesha',
    name: 'Ayesha_Sylhet',
    uid: '105541',
    avatar: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=250&h=250',
    coverPhoto: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=600&h=450',
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
        'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=400&h=500',
        'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?auto=format&fit=crop&q=80&w=400&h=500'
      ],
      videos: []
    }
  },
  {
    id: 'creator_jessica',
    name: 'Hania Amir',
    uid: '401889',
    avatar: 'https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?auto=format&fit=crop&q=80&w=250&h=250',
    coverPhoto: 'https://images.unsplash.com/photo-1601412436009-d964bd02edbc?auto=format&fit=crop&q=80&w=600&h=450',
    gender: 'female',
    age: 24,
    country: 'Pakistan',
    bio: 'Drama artist and vlogger. Let\'s keep it energetic and fun! Call me for a custom chat session 🎙️ Streaming live daily.',
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
        'https://images.unsplash.com/photo-1614283233556-f35b0c801ef1?auto=format&fit=crop&q=80&w=400&h=500',
        'https://images.unsplash.com/photo-1601412436009-d964bd02edbc?auto=format&fit=crop&q=80&w=400&h=500'
      ],
      videos: []
    }
  },
  ...mappedDemoCreators
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
  role: 'superadmin',
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
    creatorAvatar: 'https://images.unsplash.com/photo-1618015358954-115ef1ed6515?auto=format&fit=crop&q=80&w=250&h=250',
    creatorCountry: 'Bangladesh',
    viewerCount: 2450,
    likesCount: 15400,
    coverImage: 'https://images.unsplash.com/photo-1624224971170-2f84fed5eb5e?auto=format&fit=crop&q=80&w=600&h=450',
    tags: ['Bengali Songs', 'Chitchat', 'Trending'],
    pkBattle: {
      opponentId: 'creator_elena',
      opponentName: 'Kriti Tamang',
      opponentAvatar: 'https://images.unsplash.com/photo-1562088287-bde35a1ea917?auto=format&fit=crop&q=80&w=250&h=250',
      userScore: 4200,
      opponentScore: 3800,
      timeRemaining: 120
    }
  },
  {
    id: 'room_emma',
    creatorId: 'creator_emma',
    creatorName: 'Ananya Sharma',
    creatorAvatar: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&q=80&w=250&h=250',
    creatorCountry: 'India',
    viewerCount: 4120,
    likesCount: 28900,
    coverImage: 'https://images.unsplash.com/photo-1630156984285-d60927a7c933?auto=format&fit=crop&q=80&w=600&h=450',
    tags: ['Kathak Dance', 'BollyJam', 'Hot 🔥'],
    multiGuest: {
      seats: [
        { id: 'seat_1', userId: 'creator_sophia', userName: 'Sophia BD', userAvatar: 'https://images.unsplash.com/photo-1618015358954-115ef1ed6515?auto=format&fit=crop&q=80&w=250&h=250', isMuted: false, isVideoOn: true },
        { id: 'seat_2', userId: 'creator_ayesha', userName: 'Ayesha_Sylhet', userAvatar: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&q=80&w=250&h=250', isMuted: true, isVideoOn: true },
        { id: 'seat_3', userId: null, userName: null, userAvatar: null, isMuted: false, isVideoOn: false },
        { id: 'seat_4', userId: null, userName: null, userAvatar: null, isMuted: false, isVideoOn: false }
      ]
    }
  },
  {
    id: 'room_elena',
    creatorId: 'creator_elena',
    creatorName: 'Kriti Tamang',
    creatorAvatar: 'https://images.unsplash.com/photo-1562088287-bde35a1ea917?auto=format&fit=crop&q=80&w=250&h=250',
    creatorCountry: 'Nepal',
    viewerCount: 1980,
    likesCount: 8900,
    coverImage: 'https://images.unsplash.com/photo-1625897428517-7e2062829a26?auto=format&fit=crop&q=80&w=600&h=450',
    tags: ['Live Guitar', 'Nepali Folk', 'Cozy Vibes']
  },
  ...mappedDemoRooms
];

export const INITIAL_POSTS: Post[] = [
  {
    id: 'post_p1',
    creatorId: 'creator_sophia',
    creatorName: 'Sophia BD',
    creatorAvatar: 'https://images.unsplash.com/photo-1618015358954-115ef1ed6515?auto=format&fit=crop&q=80&w=250&h=250',
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
    creatorName: 'Ananya Sharma',
    creatorAvatar: 'https://images.unsplash.com/photo-1589156280159-27698a70f29e?auto=format&fit=crop&q=80&w=250&h=250',
    type: 'photo',
    content: 'Golden hour in Mumbai! Hope everyone has an amazing week. Setting up for the PK battle tonight. Let\'s win this team! 💪✨',
    mediaUrl: 'https://images.unsplash.com/photo-1630156984285-d60927a7c933?auto=format&fit=crop&q=80&w=600&h=500',
    likesCount: 2890,
    isLikedByUser: true,
    comments: [
      { id: 'c3', userName: 'GifterPro', userAvatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100&h=100', content: 'We will support you with Yacht gifts Ananya! Let\'s defeat the opponent!', timestamp: '5 hours ago' }
    ],
    sharesCount: 112,
    timestamp: '8 hours ago'
  },
  {
    id: 'post_p3',
    creatorId: 'creator_elena',
    creatorName: 'Kriti Tamang',
    creatorAvatar: 'https://images.unsplash.com/photo-1562088287-bde35a1ea917?auto=format&fit=crop&q=80&w=250&h=250',
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
    totalEarningsCoins: 22500,
    liveEarningsCoins: 9200,
    callEarningsCoins: 4300,
    giftEarningsCoins: 5000,
    privateLiveEarningsCoins: 2500,
    premiumContentEarningsCoins: 1500,
    dailyEarningsCoins: 1200,
    weeklyEarningsCoins: 6400,
    monthlyEarningsCoins: 22500,
    pendingWithdrawalsCoins: 5000
  },
  {
    creatorId: 'creator_emma',
    totalEarningsCoins: 55000,
    liveEarningsCoins: 18000,
    callEarningsCoins: 15000,
    giftEarningsCoins: 12000,
    privateLiveEarningsCoins: 6000,
    premiumContentEarningsCoins: 4000,
    dailyEarningsCoins: 3500,
    weeklyEarningsCoins: 14500,
    monthlyEarningsCoins: 55000,
    pendingWithdrawalsCoins: 0
  },
  {
    creatorId: 'creator_elena',
    totalEarningsCoins: 16400,
    liveEarningsCoins: 6200,
    callEarningsCoins: 3100,
    giftEarningsCoins: 3100,
    privateLiveEarningsCoins: 2500,
    premiumContentEarningsCoins: 1500,
    dailyEarningsCoins: 800,
    weeklyEarningsCoins: 4800,
    monthlyEarningsCoins: 16400,
    pendingWithdrawalsCoins: 0
  },
  ...mappedDemoStats
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
