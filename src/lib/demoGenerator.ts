/**
 * src/lib/demoGenerator.ts
 * Utility to generate 100 realistic, unique demo broadcaster accounts.
 */

import { UserProfile } from '../types';

// Pools of realistic names, bios, countries, languages, and titles
const FIRST_NAMES = [
  'Aria', 'Maya', 'Zara', 'Elena', 'Ananya', 'Meera', 'Riya', 'Shaila', 'Nisha', 'Tanya',
  'Sophia', 'Chloe', 'Emma', 'Olivia', 'Layla', 'Kriti', 'Ayesha', 'Fatima', 'Sana', 'Zoya',
  'Priya', 'Anika', 'Hania', 'Sajal', 'Yumna', 'Alia', 'Sara', 'Neha', 'Pooja', 'Sneha',
  'Kiara', 'Tara', 'Rhea', 'Evelyn', 'Isabella', 'Harper', 'Amelia', 'Mia', 'Charlotte', 'Emily',
  'Abha', 'Bela', 'Charu', 'Divya', 'Esha', 'Gita', 'Hina', 'Ipsa', 'Jaya', 'Komal',
  'Lata', 'Mona', 'Nutan', 'Oma', 'Pipa', 'Rina', 'Sima', 'Tula', 'Uma', 'Vani',
  'Alisha', 'Bipasha', 'Dia', 'Farhana', 'Ishita', 'Jannat', 'Karishma', 'Mehzabin', 'Nusrat', 'Oishee',
  'Purnima', 'Runa', 'Sabrina', 'Tasnim', 'Urshi', 'Vishma', 'Warda', 'Yasmin', 'Zarin', 'Mahi',
  'Afrin', 'Mim', 'Lamia', 'Sumi', 'Soniya', 'Rimi', 'Keya', 'Kona', 'Niva', 'Esha',
  'Trisha', 'Rupa', 'Toma', 'Pavel', 'Adnan', 'Naim', 'Fahim', 'Tahmid', 'Shuvo', 'Tanvir'
];

const LAST_NAMES = [
  'BD', 'Chowdhury', 'Khan', 'Roy', 'Sharma', 'Sen', 'Ahmed', 'Ali', 'Rahman', 'Hasan',
  'Begum', 'Akter', 'Islam', 'Sultana', 'Jahan', 'Khatun', 'Parvin', 'Yasmin', 'Tamang', 'Amir',
  'Patel', 'Singh', 'Kapoor', 'Mehta', 'Joshi', 'Verma', 'Rao', 'Reddy', 'Nair', 'Iyer',
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez',
  'Gupta', 'Das', 'Dutta', 'Banerjee', 'Mukherjee', 'Chatterjee', 'Ghosh', 'Bose', 'Mitra', 'Sarkar'
];

const COUNTRIES = [
  { name: 'Bangladesh', flag: '🇧🇩', lang: 'Bengali, English' },
  { name: 'India', flag: '🇮🇳', lang: 'Hindi, English' },
  { name: 'Pakistan', flag: '🇵🇰', lang: 'Urdu, English' },
  { name: 'Nepal', flag: '🇳🇵', lang: 'Nepali, English' },
  { name: 'Saudi Arabia', flag: '🇸🇦', lang: 'Arabic, English' },
  { name: 'United Arab Emirates', flag: '🇦🇪', lang: 'Arabic, English' },
  { name: 'United States', flag: '🇺🇸', lang: 'English' },
  { name: 'United Kingdom', flag: '🇬🇧', lang: 'English' },
  { name: 'Singapore', flag: '🇸🇬', lang: 'English, Mandarin' }
];

const BIOTEMPLATE_PREFIX = [
  'Just a simple soul loving life.',
  'Music is my escape. 🎸',
  'Classical & Bollywood dancer.',
  'Approved live creator!',
  'Student & part-time streamer 📚✨',
  'Chasing dreams and positive vibes.',
  'Let\'s connect, chat, and stream!',
  'Livo Live official star host ⚡',
  'Spreading happiness and smiles.',
  'PK Battles and friendly games! 🔥'
];

const BIOTEMPLATE_SUFFIX = [
  'Catch me live daily at 8 PM! Drop a follow and say hello. 💖',
  'Let\'s chat and enjoy together! Sending love to all my viewers.',
  'Open for video/voice requests. Drop by and send some gifts! 👑',
  'Join my community! New stream vlogs coming soon.',
  'PK battles are my favorite! Challenge me anytime.',
  'Sharing my travel, music, and food vlogs with the world!',
  'Support me by sending virtual roses and hearts. Appreciate you all!',
  'Your friendly neighborhood star broadcaster. Let\'s keep it fun!',
  'Connecting lives globally. Peace and love only!'
];

// 10 abstract, non-human landscapes/patterns from Unsplash as safe placeholders
const GALLERY_IMAGE_POOL = [
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=400&h=500',
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&q=80&w=400&h=500',
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&q=80&w=400&h=500',
  'https://images.unsplash.com/photo-1472214222541-d510753a4707?auto=format&fit=crop&q=80&w=400&h=500',
  'https://images.unsplash.com/photo-1518495973542-4542c06a5843?auto=format&fit=crop&q=80&w=400&h=500',
  'https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&q=80&w=400&h=500',
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=400&h=500',
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&q=80&w=400&h=500',
  'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=400&h=500',
  'https://images.unsplash.com/photo-1434725039720-abb26e2b4848?auto=format&fit=crop&q=80&w=400&h=500'
];

// Beautiful abstract laser, neon and futuristic video loops from Mixkit (completely safe)
const VIDEO_POOL = [
  'https://assets.mixkit.co/videos/preview/mixkit-abstract-laser-lights-background-loop-41853-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-tunnel-of-futuristic-blue-lights-42220-large.mp4',
  'https://assets.mixkit.co/videos/preview/mixkit-neon-light-retro-futuristic-square-loop-41854-large.mp4'
];

const BROADCAST_TITLES = [
  'Chill chat and guitar tunes 🎸🎵',
  'Late night PK battles! Support me guys! ⚡🔥',
  'Dancing to classical hits! Drop a rose 🌹💃',
  'Q&A Session! Ask me anything about my vlogs',
  'Let\'s build a friendly global community! 🌍',
  'Singing beautiful songs live! Request your favorite 🎙️',
  'Cozy weekend stream with virtual coffee ☕',
  'Gamer girl vlogging & relaxing hours 🎮✨',
  'Celebrity PK matches tonight! 🏆👑',
  'Silent study with beautiful background music 📚🎧'
];

export function generate100DemoUsers(): UserProfile[] {
  const users: UserProfile[] = [];

  // Seeded random helper to ensure reproducibility or randomness
  for (let i = 1; i <= 100; i++) {
    const firstName = FIRST_NAMES[(i * 3) % FIRST_NAMES.length];
    const lastName = LAST_NAMES[(i * 7) % LAST_NAMES.length];
    const fullName = `${firstName} ${lastName}`;
    const username = `${firstName.toLowerCase()}_${lastName.toLowerCase()}_livo${i}`;

    const countryObj = COUNTRIES[i % COUNTRIES.length];
    const bioPrefix = BIOTEMPLATE_PREFIX[(i * 13) % BIOTEMPLATE_PREFIX.length];
    const bioSuffix = BIOTEMPLATE_SUFFIX[(i * 17) % BIOTEMPLATE_SUFFIX.length];
    const bio = `${countryObj.flag} ${bioPrefix} ${bioSuffix}`;

    // Age 18-24 only!
    const age = 18 + (i % 7);

    // Level 1-50
    const level = 5 + (i % 45);

    // Unique user ID
    const userId = `demo_user_${1000 + i}`;

    // Followers and Following Count
    const followersCount = 2000 + (i * 471) + (i % 3 ? i * 29 : 0);
    const followingCount = 100 + (i * 3) + (i % 5);

    // Call rates
    const voiceCallRate = level > 30 ? 15 : level > 15 ? 10 : 5;
    const videoCallRate = level > 30 ? 30 : level > 15 ? 20 : 15;

    // Coins
    const coins = 200 + (i * 88) + (i % 11 * 40);

    // VIP and Verification Status
    const isVIP = (i % 4 === 0);
    const isApprovedCreator = true;

    // Online Status
    const onlineStatus = (i % 3 === 0) ? 'busy' : (i % 3 === 1) ? 'online' : 'offline';

    // DiceBear Avatars (Vector illustrations, completely non-real people)
    const avatar = `https://api.dicebear.com/7.x/lorelei/svg?seed=${username}`;
    const coverPhoto = GALLERY_IMAGE_POOL[(i * 2) % GALLERY_IMAGE_POOL.length];

    // Select 5 distinct gallery images
    const photos: string[] = [];
    for (let g = 0; g < 5; g++) {
      photos.push(GALLERY_IMAGE_POOL[(i + g * 2) % GALLERY_IMAGE_POOL.length]);
    }

    // Select 2 distinct video clips
    const videos = [
      VIDEO_POOL[i % VIDEO_POOL.length],
      VIDEO_POOL[(i + 1) % VIDEO_POOL.length]
    ];

    users.push({
      id: userId,
      name: fullName,
      uid: String(100000 + i),
      avatar,
      coverPhoto,
      gender: 'female', // All broadcasters are female creators as in original data
      age,
      country: `${countryObj.flag} ${countryObj.name}`,
      bio,
      followersCount,
      followingCount,
      coins,
      level,
      isVIP,
      vipPlan: isVIP ? (i % 2 === 0 ? 'monthly' : 'yearly') : undefined,
      onlineStatus,
      isApprovedCreator,
      voiceCallRate,
      videoCallRate,
      mediaGallery: {
        photos,
        videos
      }
    });
  }

  // Choose exactly 20 to 30 random users to be "Live"
  // Let's make it reproducible or dynamic. Let's make indices 5 to 30 (26 users) live.
  // This ensures exactly 26 users are Live. We can randomly distribute.
  const liveCount = 20 + (Math.floor(Math.random() * 11)); // 20 to 30
  
  // Set live properties
  for (let idx = 0; idx < 100; idx++) {
    const user = users[idx];
    if (idx < liveCount) {
      // Make it live
      user.onlineStatus = 'online';
      // We will flag this user as live by setting a custom property or we can attach it in the liveRooms list
    }
  }

  return users;
}

export function generateLiveRoomsFromDemo(demoUsers: UserProfile[]): any[] {
  const rooms: any[] = [];
  const liveTitles = BROADCAST_TITLES;

  // Find the users flagged to be live
  // First 25 users will be live
  const liveCount = 20 + (Math.floor(Math.random() * 11)); // 20 to 30
  
  for (let idx = 0; idx < Math.min(liveCount, demoUsers.length); idx++) {
    const user = demoUsers[idx];
    const roomTitle = liveTitles[idx % liveTitles.length];
    
    // Viewer count between 50 and 5000
    const viewerCount = 50 + (idx * 163) + (idx % 7 * 11);
    
    rooms.push({
      id: `room_demo_${user.id}`,
      creatorId: user.id,
      creatorName: user.name,
      creatorAvatar: user.avatar,
      creatorCountry: user.country,
      viewerCount,
      likesCount: Math.floor(viewerCount / 2),
      coverImage: user.coverPhoto,
      tags: [idx % 2 === 0 ? 'Music' : 'Chat', 'Friendly', 'Gaming'],
      title: roomTitle,
      bio: user.bio,
      category: idx % 2 === 0 ? 'Music' : 'Entertainment',
      privacy: 'Public Live',
      password: '',
      language: 'English',
      allowGuestJoin: true,
      allowGifts: true,
      allowComments: true,
      beautyFilter: true,
      locationSharing: '',
      scheduledTime: 'Start Now'
    });
  }
  
  return rooms;
}
