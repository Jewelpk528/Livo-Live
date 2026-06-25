/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { UserProfile, LiveRoom, Post, Transaction, WithdrawalRequest, CreatorStats, LiveMessage } from './src/types';
import { INITIAL_CREATORS, INITIAL_USER, INITIAL_LIVEROOMS, INITIAL_POSTS, INITIAL_TRANSACTIONS, INITIAL_WITHDRAWALS, INITIAL_STATS } from './src/data';

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

// REST API Endpoints for Livo Live

// 1. User & Profiles
app.get('/api/user', (req, res) => {
  res.json(currentUser);
});

app.post('/api/user/update', (req, res) => {
  const updates = req.body;
  currentUser = { ...currentUser, ...updates };
  res.json(currentUser);
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
  const { creatorId, tags } = req.body;
  const creator = creators.find(c => c.id === creatorId) || currentUser;
  const newRoom: LiveRoom = {
    id: `room_${creator.id.split('_')[1] || creator.id}`,
    creatorId: creator.id,
    creatorName: creator.name,
    creatorAvatar: creator.avatar,
    creatorCountry: creator.country,
    viewerCount: Math.floor(Math.random() * 100) + 5,
    likesCount: 0,
    coverImage: creator.coverPhoto,
    tags: tags || ['Chat']
  };
  // Ensure creator doesn't already have a room active
  liveRooms = liveRooms.filter(r => r.creatorId !== creatorId);
  liveRooms.push(newRoom);
  res.json(newRoom);
});

app.post('/api/rooms/close', (req, res) => {
  const { roomId } = req.body;
  liveRooms = liveRooms.filter(r => r.id !== roomId);
  res.json({ success: true, liveRooms });
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
        pendingWithdrawalsCoins: 0
      };
      creatorStats.push(stat);
    }
    
    stat.totalEarningsCoins += coins;
    if (type === 'gift_sent') {
      stat.giftEarningsCoins += coins;
    } else if (type === 'call_made') {
      stat.callEarningsCoins += coins;
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
  const { userId, status } = req.body; // status is 'online' or 'busy' or 'offline'
  const creator = creators.find(c => c.id === userId);
  if (creator) {
    creator.onlineStatus = status; // e.g. 'offline' or 'busy'
    res.json({ success: true, creators });
  } else if (userId === currentUser.id) {
    currentUser.onlineStatus = status;
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
