/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { UserProfile, LiveRoom, Post, Transaction, WithdrawalRequest, CreatorStats, LiveMessage, Gift } from './src/types';
import { INITIAL_CREATORS, INITIAL_USER, INITIAL_LIVEROOMS, INITIAL_POSTS, INITIAL_TRANSACTIONS, INITIAL_WITHDRAWALS, INITIAL_STATS, GIFTS } from './src/data';
import { generate100DemoUsers, generateLiveRoomsFromDemo } from './src/lib/demoGenerator';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Server-side in-memory State Engine (synchronized database)
let creators: UserProfile[] = [...INITIAL_CREATORS];
let currentUser: UserProfile = { ...INITIAL_USER };
let liveRooms: LiveRoom[] = [...INITIAL_LIVEROOMS];
let posts: Post[] = [...INITIAL_POSTS];
let transactions: Transaction[] = [...INITIAL_TRANSACTIONS];
let withdrawals: WithdrawalRequest[] = [...INITIAL_WITHDRAWALS];
let creatorStats: CreatorStats[] = [...INITIAL_STATS];
let callHistory: any[] = [];

// Lazy Gemini API client wrapper to prevent startup crashes if GEMINI_API_KEY is not defined yet
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });
  }
  return aiClient;
}

function getAdminCallStats() {
  const now = new Date();
  const todayStr = now.toISOString().substring(0, 10);
  
  // Weekly boundary (last 7 days)
  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  // Monthly boundary (last 30 days)
  const oneMonthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  let totalVoiceCalls = 0;
  let totalVideoCalls = 0;
  let totalRevenue = 0; // 25% of coinsCharged
  let todayRevenue = 0;
  let weeklyRevenue = 0;
  let monthlyRevenue = 0;
  let totalCharged = 0;

  callHistory.forEach(c => {
    if (c.status !== 'completed') return;

    if (c.callType === 'voice') totalVoiceCalls++;
    if (c.callType === 'video') totalVideoCalls++;

    const charged = c.coinsCharged || 0;
    const adminShare = charged * 0.25;
    totalCharged += charged;
    totalRevenue += adminShare;

    const callDate = new Date(c.startedAt);
    const callDateStr = c.startedAt.substring(0, 10);

    if (callDateStr === todayStr) {
      todayRevenue += adminShare;
    }
    if (callDate >= oneWeekAgo) {
      weeklyRevenue += adminShare;
    }
    if (callDate >= oneMonthAgo) {
      monthlyRevenue += adminShare;
    }
  });

  return {
    todayRevenue: Math.floor(todayRevenue),
    weeklyRevenue: Math.floor(weeklyRevenue),
    monthlyRevenue: Math.floor(monthlyRevenue),
    totalRevenue: Math.floor(totalRevenue),
    totalVoiceCalls,
    totalVideoCalls,
    totalCharged
  };
}

// REST API Endpoints for Livo Live

// Unified Global Initialization Endpoint
app.get('/api/init', (req, res) => {
  res.json({
    creators,
    user: currentUser,
    rooms: liveRooms,
    posts,
    transactions,
    withdrawals,
    stats: creatorStats,
    adminCallStats: getAdminCallStats()
  });
});

// Admin Call Revenue Stats Endpoint
app.get('/api/admin/call-stats', (req, res) => {
  res.json(getAdminCallStats());
});

// Delete all demo users from memory state
app.post('/api/demo-users/delete', (req, res) => {
  creators = creators.filter(c => !c.id.startsWith('demo_user_'));
  liveRooms = liveRooms.filter(r => !r.creatorId.startsWith('demo_user_') && !r.id.startsWith('room_demo_'));
  res.json({ success: true });
});

// Regenerates all demo users in memory state
app.post('/api/demo-users/regenerate', (req, res) => {
  // First clear old demo users
  creators = creators.filter(c => !c.id.startsWith('demo_user_'));
  liveRooms = liveRooms.filter(r => !r.creatorId.startsWith('demo_user_') && !r.id.startsWith('room_demo_'));
  
  // Generate 100 new ones
  const newDemoUsers = generate100DemoUsers();
  creators = [...creators, ...newDemoUsers];
  
  // Create live rooms for the live demo users
  const newRooms = generateLiveRoomsFromDemo(newDemoUsers);
  liveRooms = [...newRooms, ...liveRooms];
  
  res.json({ success: true, count: newDemoUsers.length, liveCount: newRooms.length });
});

// Update User Role Endpoint
app.post('/api/user/role', (req, res) => {
  const { role } = req.body;
  if (role === 'user' || role === 'admin' || role === 'superadmin') {
    currentUser.role = role;
    res.json({ success: true, role: currentUser.role });
  } else {
    res.status(400).json({ error: 'Invalid role value' });
  }
});

// Recharge Balance Endpoint Alias
app.post('/api/recharge', (req, res) => {
  const { coins, price, method } = req.body;
  currentUser.coins += coins;
  
  const newTx: Transaction = {
    id: `tx_${Date.now()}`,
    type: 'recharge',
    coinDelta: coins,
    currencyAmount: price,
    currencyType: method === 'bKash' || method === 'Nagad' || method === 'Rocket' ? 'BDT' : 'USD',
    paymentMethod: method,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    status: 'success',
    description: `Wallet Recharge via ${method}`
  };
  
  transactions.unshift(newTx);
  res.json({ success: true, user: currentUser, transaction: newTx });
});

// Deduct Coins (calls or gifts) Endpoint Alias
app.post('/api/deduct-coins', (req, res) => {
  const { coins, type, creatorId, description } = req.body;
  
  if (currentUser.coins < coins) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  currentUser.coins -= coins;
  
  const newTx: Transaction = {
    id: `tx_${Date.now()}`,
    type: type, // 'gift_sent' | 'call_made'
    coinDelta: -coins,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    status: 'success',
    description: description || `Coins Deducted`
  };
  
  transactions.unshift(newTx);

  // Update Creator Earnings Stats
  if (creatorId) {
    let stat = creatorStats.find(s => s.creatorId === creatorId);
    if (!stat) {
      stat = {
        creatorId,
        totalEarningsCoins: 0,
        liveEarningsCoins: 0,
        callEarningsCoins: 0,
        giftEarningsCoins: 0,
        privateLiveEarningsCoins: 0,
        premiumContentEarningsCoins: 0,
        dailyEarningsCoins: 0,
        weeklyEarningsCoins: 0,
        monthlyEarningsCoins: 0,
        pendingWithdrawalsCoins: 0
      };
      creatorStats.push(stat);
    }
    
    const isCall = type === 'call_made';
    const receiverShare = isCall ? Math.floor(coins * 0.75) : coins;

    stat.totalEarningsCoins += receiverShare;
    stat.dailyEarningsCoins += receiverShare;
    stat.weeklyEarningsCoins += receiverShare;
    stat.monthlyEarningsCoins += receiverShare;

    if (type === 'gift_sent') {
      stat.giftEarningsCoins += coins;
    } else if (isCall) {
      stat.callEarningsCoins += receiverShare;
    } else if (type === 'private_live') {
      stat.privateLiveEarningsCoins += coins;
    } else if (type === 'premium_content') {
      stat.premiumContentEarningsCoins += coins;
    }
  }

  res.json({ success: true, user: currentUser, transaction: newTx, creatorStats });
});

// Send Virtual Gift Endpoint
app.post('/api/send-gift', (req, res) => {
  const { creatorId, giftId } = req.body;
  const gift = GIFTS.find(g => g.id === giftId);
  if (!gift) {
    return res.status(404).json({ error: 'Gift not found' });
  }
  
  const coins = gift.coinValue;
  if (currentUser.coins < coins) {
    return res.status(400).json({ error: 'Insufficient balance to send gift' });
  }
  
  currentUser.coins -= coins;
  const creator = creators.find(c => c.id === creatorId) || { name: 'Host' };
  
  const newTx: Transaction = {
    id: `tx_${Date.now()}`,
    type: 'gift_sent',
    coinDelta: -coins,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    status: 'success',
    description: `Sent ${gift.icon} ${gift.name} to ${creator.name}`
  };
  
  transactions.unshift(newTx);
  
  // Update Creator Earnings Stats
  let stat = creatorStats.find(s => s.creatorId === creatorId);
  if (!stat) {
    stat = {
      creatorId,
      totalEarningsCoins: 0,
      liveEarningsCoins: 0,
      callEarningsCoins: 0,
      giftEarningsCoins: 0,
      privateLiveEarningsCoins: 0,
      premiumContentEarningsCoins: 0,
      dailyEarningsCoins: 0,
      weeklyEarningsCoins: 0,
      monthlyEarningsCoins: 0,
      pendingWithdrawalsCoins: 0
    };
    creatorStats.push(stat);
  }
  
  stat.totalEarningsCoins += coins;
  stat.giftEarningsCoins += coins;
  stat.dailyEarningsCoins += coins;
  stat.weeklyEarningsCoins += coins;
  stat.monthlyEarningsCoins += coins;
  
  res.json({ success: true, user: currentUser, transaction: newTx, creatorStats });
});

// Submit Withdrawal/Cashout Endpoint Alias
app.post('/api/withdraw', (req, res) => {
  const { creatorId, coins, method, accountDetails } = req.body;
  
  const creator = creators.find(c => c.id === creatorId) || currentUser;
  let stat = creatorStats.find(s => s.creatorId === creatorId);
  
  const coinBal = stat ? (stat.totalEarningsCoins - stat.pendingWithdrawalsCoins) : 0;
  if (coinBal < coins) {
    return res.status(400).json({ error: 'Insufficient balance to withdraw' });
  }

  const payout = method === 'bKash' || method === 'Nagad' ? coins : coins / 100;
  const currency = method === 'bKash' || method === 'Nagad' ? 'BDT' : 'USD';

  const newWd: WithdrawalRequest = {
    id: `wd_${Date.now()}`,
    creatorId,
    creatorName: creator.name,
    coinAmount: coins,
    payoutAmount: payout,
    currency,
    method,
    accountDetails,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    status: 'pending'
  };

  withdrawals.unshift(newWd);
  if (stat) {
    stat.pendingWithdrawalsCoins += coins;
  }
  
  res.json({ success: true, withdrawal: newWd, stats: creatorStats });
});

// Approve/Reject Withdrawal Endpoint Alias
app.post('/api/withdrawals/approve', (req, res) => {
  const { withdrawalId, status } = req.body;
  const wd = withdrawals.find(w => w.id === withdrawalId);
  
  if (wd) {
    wd.status = status;
    const stat = creatorStats.find(s => s.creatorId === wd.creatorId);
    if (stat) {
      if (status === 'approved') {
        stat.totalEarningsCoins -= wd.coinAmount;
        if (stat.giftEarningsCoins >= wd.coinAmount) {
          stat.giftEarningsCoins -= wd.coinAmount;
        } else {
          stat.liveEarningsCoins = Math.max(0, stat.liveEarningsCoins - wd.coinAmount);
        }
      }
      stat.pendingWithdrawalsCoins = Math.max(0, stat.pendingWithdrawalsCoins - wd.coinAmount);
    }
    res.json({ success: true, withdrawals, stats: creatorStats });
  } else {
    res.status(404).json({ error: 'Withdrawal not found' });
  }
});

// 1. User & Profiles
app.get('/api/user', (req, res) => {
  res.json(currentUser);
});

app.post('/api/user/update', (req, res) => {
  const updates = req.body;
  currentUser = { ...currentUser, ...updates };
  res.json(currentUser);
});

// Update Call Rates with 24 Hours Restriction Rule
app.post('/api/user/rates', (req, res) => {
  try {
    const { voiceCallRate, videoCallRate } = req.body;
    
    // Convert to integers
    const voiceVal = Math.floor(Number(voiceCallRate));
    const videoVal = Math.floor(Number(videoCallRate));

    if (isNaN(voiceVal) || voiceVal < 1 || voiceVal > 20) {
      return res.status(400).json({ error: 'Voice call rate must be an integer between 1 and 20 Coins/Minute.' });
    }
    if (isNaN(videoVal) || videoVal < 5 || videoVal > 50) {
      return res.status(400).json({ error: 'Video call rate must be an integer between 5 and 50 Coins/Minute.' });
    }

    const now = Date.now();
    const lastUpdated = currentUser.lastRateUpdated ? new Date(currentUser.lastRateUpdated).getTime() : 0;
    const twentyFourHours = 24 * 60 * 60 * 1000;

    if (lastUpdated > 0 && (now - lastUpdated) < twentyFourHours) {
      const timeLeft = twentyFourHours - (now - lastUpdated);
      const hoursLeft = Math.floor(timeLeft / (1000 * 60 * 60));
      const minsLeft = Math.ceil((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
      return res.status(400).json({ error: `Rates can be updated only once every 24 hours. Next update available in ${hoursLeft} hours and ${minsLeft} minutes.` });
    }

    currentUser.voiceCallRate = voiceVal;
    currentUser.videoCallRate = videoVal;
    currentUser.lastRateUpdated = new Date().toISOString();

    // Also update in creators list to ensure consistency across other screens
    const idx = creators.findIndex(c => c.id === currentUser.id);
    if (idx !== -1) {
      creators[idx].voiceCallRate = voiceVal;
      creators[idx].videoCallRate = videoVal;
      creators[idx].lastRateUpdated = currentUser.lastRateUpdated;
    }

    console.log(`[User Rates] Updated: Voice=${voiceVal}, Video=${videoVal} Coins. Last Update: ${currentUser.lastRateUpdated}`);
    res.json({ success: true, user: currentUser });
  } catch (error: any) {
    console.error('Failed to update call rates:', error);
    res.status(500).json({ error: 'Failed to update call rates' });
  }
});

app.get('/api/creators', (req, res) => {
  res.json(creators);
});

app.post('/api/creators/verify', (req, res) => {
  const { creatorId, isVerified } = req.body;
  const creator = creators.find(c => c.id === creatorId);
  if (creator) {
    creator.isApprovedCreator = isVerified;
    if (isVerified) {
      // Add a live room if they don't have one and are verified
      const exists = liveRooms.some(r => r.creatorId === creatorId);
      if (!exists) {
        liveRooms.push({
          id: `room_${creatorId.split('_')[1] || creatorId}`,
          creatorId: creator.id,
          creatorName: creator.name,
          creatorAvatar: creator.avatar,
          creatorCountry: creator.country,
          viewerCount: Math.floor(Math.random() * 500) + 50,
          likesCount: Math.floor(Math.random() * 1000) + 100,
          coverImage: creator.coverPhoto,
          tags: ['Talks', 'Verified']
        });
      }
    } else {
      // Remove live room if unapproved
      liveRooms = liveRooms.filter(r => r.creatorId !== creatorId);
    }
    res.json({ success: true, creators, liveRooms });
  } else {
    res.status(404).json({ error: 'Creator not found' });
  }
});

// 2. Live Rooms
app.get('/api/rooms', (req, res) => {
  res.json(liveRooms);
});

app.post('/api/rooms/create', (req, res) => {
  const { 
    creatorId, 
    coverImage, 
    title, 
    bio, 
    category, 
    privacy, 
    password, 
    language, 
    tags, 
    allowGuestJoin, 
    allowGifts, 
    allowComments, 
    beautyFilter, 
    locationSharing, 
    scheduledTime 
  } = req.body;
  
  const creator = creators.find(c => c.id === creatorId) || currentUser;
  
  const newRoom: LiveRoom = {
    id: `room_custom_${Date.now()}`,
    creatorId: creator.id,
    creatorName: creator.name,
    creatorAvatar: creator.avatar,
    creatorCountry: creator.country,
    viewerCount: Math.floor(Math.random() * 50) + 1,
    likesCount: 0,
    coverImage: coverImage || creator.coverPhoto || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400&h=300',
    tags: tags && tags.length > 0 ? tags : ['Entertainment'],
    title: title || `${creator.name}'s Live Room`,
    bio: bio || creator.bio,
    category: category || 'Entertainment',
    privacy: privacy || 'Public Live',
    password: password || '',
    language: language || 'English',
    allowGuestJoin: allowGuestJoin !== undefined ? allowGuestJoin : true,
    allowGifts: allowGifts !== undefined ? allowGifts : true,
    allowComments: allowComments !== undefined ? allowComments : true,
    beautyFilter: beautyFilter !== undefined ? beautyFilter : true,
    locationSharing: locationSharing || '',
    scheduledTime: scheduledTime || 'Start Now'
  };

  // Ensure creator doesn't already have a room active
  liveRooms = liveRooms.filter(r => r.creatorId !== creator.id);
  liveRooms.unshift(newRoom);
  res.json(newRoom);
});

app.post('/api/rooms/close', (req, res) => {
  const { roomId } = req.body;
  liveRooms = liveRooms.filter(r => r.id !== roomId);
  res.json({ success: true, liveRooms });
});

// Save Voice/Video Call History
app.post('/api/calls/history', (req, res) => {
  try {
    const { callId, callerId, receiverId, callType, startedAt, endedAt, duration, coinsCharged, status } = req.body;
    
    if (!callId || !callerId || !receiverId || !callType) {
      return res.status(400).json({ error: 'Missing required call details' });
    }

    const chargedAmount = coinsCharged || 0;
    const isCompleted = status === 'completed';
    const receiverEarned = isCompleted ? Math.floor(chargedAmount * 0.75) : 0;
    const adminEarned = isCompleted ? Math.floor(chargedAmount * 0.25) : 0;

    const newHistoryRecord = {
      id: `call_${Date.now()}`,
      callId,
      callerId,
      receiverId,
      callType,
      startedAt: startedAt || new Date().toISOString(),
      endedAt: endedAt || new Date().toISOString(),
      duration: duration || 0,
      coinsCharged: chargedAmount,
      status: status || 'completed',
      receiverEarned,
      adminEarned
    };

    callHistory.unshift(newHistoryRecord);
    console.log(`[Call History] Saved call: ${callId} (${callType}) - Charged: ${coinsCharged} Coins`);
    res.json({ success: true, record: newHistoryRecord });
  } catch (error: any) {
    console.error('Failed to save call history:', error);
    res.status(500).json({ error: error.message || 'Failed to save call history' });
  }
});

// Serve client-side Firebase configuration if set up
app.get('/api/firebase-config', (req, res) => {
  const available = !!(
    process.env.FIREBASE_API_KEY &&
    process.env.FIREBASE_PROJECT_ID
  );
  res.json({
    available,
    config: available ? {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID
    } : null
  });
});

// Configure and serve Uploads folder
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Endpoint to upload images/audio as Base64 format
app.post('/api/upload', (req, res) => {
  try {
    const { fileName, fileData } = req.body;
    if (!fileName || !fileData) {
      return res.status(400).json({ error: 'fileName and fileData are required' });
    }

    const safeFileName = `${Date.now()}_${path.basename(fileName).replace(/[^a-zA-Z0-9.\-_]/g, '')}`;
    const filePath = path.join(uploadsDir, safeFileName);

    const base64Data = fileData.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${safeFileName}`;
    res.json({ success: true, url: fileUrl });
  } catch (e: any) {
    console.error('File Upload error:', e);
    res.status(500).json({ error: e.message || 'Failed to save uploaded file' });
  }
});

// GET Room Settings
app.get('/api/rooms/:roomId/settings', (req, res) => {
  const { roomId } = req.params;
  const room = liveRooms.find(r => r.id === roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({
    images: room.images || [],
    backgroundMusic: room.backgroundMusic || null
  });
});

// POST Room Settings
app.post('/api/rooms/:roomId/settings', (req, res) => {
  const { roomId } = req.params;
  const { images, backgroundMusic } = req.body;
  const room = liveRooms.find(r => r.id === roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }

  if (images !== undefined) {
    room.images = images;
  }
  if (backgroundMusic !== undefined) {
    room.backgroundMusic = backgroundMusic;
  }

  res.json({
    success: true,
    images: room.images || [],
    backgroundMusic: room.backgroundMusic || null
  });
});

// 3. Transactions & Wallet System
app.get('/api/transactions', (req, res) => {
  res.json(transactions);
});

app.post('/api/user/recharge', (req, res) => {
  const { coins, price, method } = req.body;
  currentUser.coins += coins;
  
  const newTx: Transaction = {
    id: `tx_${Date.now()}`,
    type: 'recharge',
    coinDelta: coins,
    currencyAmount: price,
    currencyType: method === 'bKash' || method === 'Nagad' || method === 'Rocket' ? 'BDT' : 'USD',
    paymentMethod: method,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    status: 'success',
    description: `Wallet Recharge via ${method}`
  };
  
  transactions.unshift(newTx);
  res.json({ success: true, user: currentUser, transaction: newTx });
});

app.post('/api/user/deduct', (req, res) => {
  const { coins, type, creatorId, description } = req.body;
  
  if (currentUser.coins < coins) {
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  
  currentUser.coins -= coins;
  
  const newTx: Transaction = {
    id: `tx_${Date.now()}`,
    type: type, // 'gift_sent' | 'call_made'
    coinDelta: -coins,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    status: 'success',
    description: description || `Coins Deducted`
  };
  
  transactions.unshift(newTx);

  // Update Creator Earnings Stats
  if (creatorId) {
    let stat = creatorStats.find(s => s.creatorId === creatorId);
    if (!stat) {
      stat = {
        creatorId,
        totalEarningsCoins: 0,
        liveEarningsCoins: 0,
        callEarningsCoins: 0,
        giftEarningsCoins: 0,
        privateLiveEarningsCoins: 0,
        premiumContentEarningsCoins: 0,
        dailyEarningsCoins: 0,
        weeklyEarningsCoins: 0,
        monthlyEarningsCoins: 0,
        pendingWithdrawalsCoins: 0
      };
      creatorStats.push(stat);
    }
    
    stat.totalEarningsCoins += coins;
    stat.dailyEarningsCoins += coins;
    stat.weeklyEarningsCoins += coins;
    stat.monthlyEarningsCoins += coins;

    if (type === 'gift_sent') {
      stat.giftEarningsCoins += coins;
    } else if (type === 'call_made') {
      stat.callEarningsCoins += coins;
    } else if (type === 'private_live') {
      stat.privateLiveEarningsCoins += coins;
    } else if (type === 'premium_content') {
      stat.premiumContentEarningsCoins += coins;
    }
  }

  res.json({ success: true, user: currentUser, transaction: newTx, creatorStats });
});

// 4. Feed Posts
app.get('/api/posts', (req, res) => {
  res.json(posts);
});

app.post('/api/posts/create', (req, res) => {
  const { type, content, mediaUrl } = req.body;
  const newPost: Post = {
    id: `post_${Date.now()}`,
    creatorId: currentUser.id,
    creatorName: currentUser.name,
    creatorAvatar: currentUser.avatar,
    type: type || 'photo',
    content: content,
    mediaUrl: mediaUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400&h=300',
    likesCount: 0,
    isLikedByUser: false,
    comments: [],
    sharesCount: 0,
    timestamp: 'Just now'
  };
  posts.unshift(newPost);
  res.json(newPost);
});

app.post('/api/posts/like', (req, res) => {
  const { postId } = req.body;
  const post = posts.find(p => p.id === postId);
  if (post) {
    post.isLikedByUser = !post.isLikedByUser;
    post.likesCount += post.isLikedByUser ? 1 : -1;
    res.json(post);
  } else {
    res.status(404).json({ error: 'Post not found' });
  }
});

app.post('/api/posts/comment', (req, res) => {
  const { postId, content } = req.body;
  const post = posts.find(p => p.id === postId);
  if (post) {
    const newComment = {
      id: `comm_${Date.now()}`,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content: content,
      timestamp: 'Just now'
    };
    post.comments.push(newComment);
    res.json(post);
  } else {
    res.status(404).json({ error: 'Post not found' });
  }
});

// 5. Creator Studio, Statistics, & Withdrawals
app.get('/api/creator/stats', (req, res) => {
  res.json(creatorStats);
});

app.get('/api/withdrawals', (req, res) => {
  res.json(withdrawals);
});

app.post('/api/withdrawals/create', (req, res) => {
  const { creatorId, coins, method, accountDetails } = req.body;
  
  // Find creator details
  const creator = creators.find(c => c.id === creatorId) || currentUser;
  let stat = creatorStats.find(s => s.creatorId === creatorId);
  
  const coinBal = stat ? (stat.totalEarningsCoins - stat.pendingWithdrawalsCoins) : 0;
  if (coinBal < coins) {
    return res.status(400).json({ error: 'Insufficient balance to withdraw' });
  }

  const payout = method === 'bKash' || method === 'Nagad' ? coins : coins / 100; // 1 Coin = 1 BDT, or 100 Coins = 1 USD
  const currency = method === 'bKash' || method === 'Nagad' ? 'BDT' : 'USD';

  const newWd: WithdrawalRequest = {
    id: `wd_${Date.now()}`,
    creatorId,
    creatorName: creator.name,
    coinAmount: coins,
    payoutAmount: payout,
    currency,
    method,
    accountDetails,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    status: 'pending'
  };

  withdrawals.unshift(newWd);
  if (stat) {
    stat.pendingWithdrawalsCoins += coins;
  }
  
  res.json({ success: true, withdrawal: newWd, stats: creatorStats });
});

app.post('/api/withdrawals/status', (req, res) => {
  const { withdrawalId, status } = req.body; // 'approved' | 'rejected'
  const wd = withdrawals.find(w => w.id === withdrawalId);
  
  if (wd) {
    wd.status = status;
    const stat = creatorStats.find(s => s.creatorId === wd.creatorId);
    if (stat) {
      if (status === 'approved') {
        stat.totalEarningsCoins -= wd.coinAmount;
        if (stat.giftEarningsCoins >= wd.coinAmount) {
          stat.giftEarningsCoins -= wd.coinAmount;
        } else {
          stat.liveEarningsCoins = Math.max(0, stat.liveEarningsCoins - wd.coinAmount);
        }
      }
      stat.pendingWithdrawalsCoins = Math.max(0, stat.pendingWithdrawalsCoins - wd.coinAmount);
    }
    res.json({ success: true, withdrawals, stats: creatorStats });
  } else {
    res.status(404).json({ error: 'Withdrawal not found' });
  }
});

// 6. Content Moderation / Reports
let reports: { id: string; reporterName: string; targetId: string; targetName: string; reason: string; timestamp: string; status: 'pending' | 'resolved' }[] = [];

app.get('/api/reports', (req, res) => {
  res.json(reports);
});

app.post('/api/reports/submit', (req, res) => {
  const { targetId, targetName, reason } = req.body;
  const newReport = {
    id: `rep_${Date.now()}`,
    reporterName: currentUser.name,
    targetId,
    targetName,
    reason,
    timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
    status: 'pending' as const
  };
  reports.unshift(newReport);
  res.json({ success: true, report: newReport });
});

app.post('/api/reports/resolve', (req, res) => {
  const { reportId } = req.body;
  const report = reports.find(r => r.id === reportId);
  if (report) {
    report.status = 'resolved';
    res.json({ success: true, reports });
  } else {
    res.status(404).json({ error: 'Report not found' });
  }
});

// Ban/Suspend users
app.post('/api/users/suspend', (req, res) => {
  const { userId, status, isSuspended } = req.body; // status is 'online' or 'busy' or 'offline'
  let targetStatus = status;
  if (isSuspended !== undefined) {
    targetStatus = isSuspended ? 'busy' : 'online';
  }
  const creator = creators.find(c => c.id === userId);
  if (creator) {
    creator.onlineStatus = targetStatus || 'busy';
    res.json({ success: true, creators });
  } else if (userId === currentUser.id) {
    currentUser.onlineStatus = targetStatus || 'busy';
    res.json({ success: true, currentUser });
  } else {
    res.status(404).json({ error: 'User not found' });
  }
});


// 7. Server-Side AI Chat Assistant (Direct Messages Simulator with Gemini)
app.post('/api/gemini/reply', async (req, res) => {
  const { creatorId, creatorName, userMessage } = req.body;

  try {
    const ai = getGeminiClient();
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === 'MY_GEMINI_API_KEY') {
      // Fallback response if API key is not configured or left as default
      const defaultReplies = [
        `Hey there! 🥰 Thanks so much for messaging me! Are you joining my live stream stream tonight?`,
        `Oh wow, I was just thinking about my sweet fans! How is your day going? ❤️`,
        `Hey Jewel! Sending lots of love. Can't wait to see you in my live room!`,
        `Thank you for checking in on me! You always make me smile. Send me some roses tonight! 🌹`
      ];
      const randomReply = defaultReplies[Math.floor(Math.random() * defaultReplies.length)];
      return res.json({ reply: randomReply, isMock: true });
    }

    const systemInstruction = `You are ${creatorName}, a very friendly and engaging female live-streaming creator on the Livo Live app. 
You are talking directly to your fan, who just sent you a private message. Keep your reply warm, a bit flirty or sweet (using appropriate emojis like 💖, 🥰, ✨, 🌹), 
and encourage them to join your live room or start a video call with you. Make sure the reply is relatively short (1 to 3 sentences maximum) so it reads like a real chat message on a live streaming app. 
Do not use formal speech; be casual and charming. User's name is Jewel.`;

    const prompt = `User sent you this message: "${userMessage}". Reply back as ${creatorName}.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.85
      }
    });

    res.json({ reply: response.text?.trim() || "Thank you for the sweet note! 😘 See you soon on my live stream!", isMock: false });
  } catch (error: any) {
    console.error('Gemini API Error:', error);
    res.json({ 
      reply: `Aww, sorry I got a bit distracted! 🥰 But I always appreciate your messages. Call me or let's stream together! 💖`, 
      error: error.message,
      isMock: true 
    });
  }
});

// Setup Vite Dev Server / Static Asset Handler
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Livo Live Full-Stack App running on http://localhost:${PORT}`);
  });
}

startServer();
