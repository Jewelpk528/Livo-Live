import React, { useState } from 'react';
import { 
  X, Camera, Image as ImageIcon, Scissors, Lock, Unlock, Globe, Users, 
  Check, Sparkles, MapPin, Calendar, Plus, Shield, MessageSquare, Gift, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, LiveRoom, RoomImage } from '../types';
import { uploadRoomFile, saveRoomImages } from '../lib/firebaseService';

interface CreateLiveRoomModalProps {
  user: UserProfile;
  onClose: () => void;
  onRoomCreated: (newRoom: LiveRoom) => void;
}

const GALLERY_PRESETS = [
  'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&q=80&w=400&h=300', // Gaming
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=400&h=300', // Talk Show / Music
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=400&h=300', // Party / Music
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&q=80&w=400&h=300', // DJ / Club
  'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=400&h=300', // Gaming Console
  'https://images.unsplash.com/photo-1498038432885-c6f3f1b912ee?auto=format&fit=crop&q=80&w=400&h=300', // Lifestyle
];

const CAMERA_CAPTURES = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400&h=300', // Selfie 1
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=400&h=300', // Selfie 2
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=400&h=300', // Selfie 3
];

const CATEGORIES = [
  'Entertainment', 'Music', 'Gaming', 'Ludo', 'PUBG', 'Free Fire', 'Lifestyle', 'Education', 'Talk Show'
];

const LANGUAGES = [
  'English', 'Bengali', 'Hindi', 'Nepali', 'Urdu', 'Arabic', 'Spanish', 'French'
];

export default function CreateLiveRoomModal({ user, onClose, onRoomCreated }: CreateLiveRoomModalProps) {
  // 1. Cover Photo states
  const [coverImage, setCoverImage] = useState<string>(GALLERY_PRESETS[1]);
  const [showGallerySelector, setShowGallerySelector] = useState(false);
  const [cameraCountdown, setCameraCountdown] = useState<number | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraFlash, setCameraFlash] = useState(false);
  
  // Crop overlay states
  const [showCropWizard, setShowCropWizard] = useState(false);
  const [cropZoom, setCropZoom] = useState(1.2);
  const [cropSuccess, setCropSuccess] = useState(false);

  // 2. Form states
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [privacy, setPrivacy] = useState<'Public Live' | 'Followers Only' | 'Private Live'>('Public Live');
  const [enablePassword, setEnablePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [category, setCategory] = useState('Entertainment');
  const [language, setLanguage] = useState('English');
  
  // Tags (up to 5 tags)
  const [tagInput, setTagInput] = useState('');
  const [tags, setTags] = useState<string[]>(['Fun', 'Chatting']);

  // Toggles
  const [allowGuestJoin, setAllowGuestJoin] = useState(true);
  const [allowGifts, setAllowGifts] = useState(true);
  const [allowComments, setAllowComments] = useState(true);
  const [beautyFilter, setBeautyFilter] = useState(true);

  // Location Sharing
  const [shareLocation, setShareLocation] = useState(false);
  const [locationName, setLocationName] = useState('Dhaka, Bangladesh');

  // Scheduled Live
  const [scheduledType, setScheduledType] = useState<'now' | 'later'>('now');
  const [scheduledTime, setScheduledTime] = useState('');

  // Form Submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // My Images States
  const [myImages, setMyImages] = useState<RoomImage[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [previewImgUrl, setPreviewImgUrl] = useState<string | null>(null);

  const handleMyImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (myImages.length + files.length > 10) {
      alert("Maximum 10 images are allowed.");
      return;
    }

    setIsUploadingImages(true);
    const newImages = [...myImages];

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const format = file.name.split('.').pop()?.toLowerCase() || '';
        if (!['jpg', 'jpeg', 'png'].includes(format)) {
          alert(`Unsupported file format: ${file.name}. Only JPG, JPEG, PNG are supported.`);
          continue;
        }

        const imageUrl = await uploadRoomFile('temp_creation', file, 'images');
        newImages.push({
          imageUrl,
          uploadedAt: new Date().toISOString(),
          selected: true
        });
      }
      setMyImages(newImages);
    } catch (err: any) {
      console.error("Error uploading images:", err);
      alert(`Upload failed: ${err.message || err}`);
    } finally {
      setIsUploadingImages(false);
    }
  };

  const handleToggleSelectImage = (index: number) => {
    setMyImages(prev => prev.map((img, idx) => idx === index ? { ...img, selected: img.selected === false ? true : false } : img));
  };

  const handleMoveMyImage = (index: number, direction: 'left' | 'right') => {
    const targetIndex = direction === 'left' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= myImages.length) return;
    
    const updatedImages = [...myImages];
    const temp = updatedImages[index];
    updatedImages[index] = updatedImages[targetIndex];
    updatedImages[targetIndex] = temp;
    setMyImages(updatedImages);
  };

  // Simulated Camera Snapshot Loop
  const handleCameraCapture = () => {
    setIsCameraActive(true);
    setCameraCountdown(3);
    const interval = setInterval(() => {
      setCameraCountdown(prev => {
        if (prev === null) {
          clearInterval(interval);
          return null;
        }
        if (prev <= 1) {
          clearInterval(interval);
          // Play flash animation
          setCameraFlash(true);
          setTimeout(() => setCameraFlash(false), 200);
          
          // Set random gorgeous capture preset
          const randomSelfie = CAMERA_CAPTURES[Math.floor(Math.random() * CAMERA_CAPTURES.length)];
          setCoverImage(randomSelfie);
          setIsCameraActive(false);
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Gallery select
  const handleSelectPreset = (url: string) => {
    setCoverImage(url);
    setShowGallerySelector(false);
  };

  // Custom File Uploader simulation
  const handleCustomFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        if (reader.result) {
          setCoverImage(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle tags
  const handleAddTag = () => {
    const cleanTag = tagInput.trim().replace(/#/g, '');
    if (cleanTag && tags.length < 5 && !tags.includes(cleanTag)) {
      setTags([...tags, cleanTag]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (idx: number) => {
    setTags(tags.filter((_, i) => i !== idx));
  };

  // Handle submit room
  const handleStartLive = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload = {
        creatorId: user.id,
        coverImage,
        title: title.trim() || `${user.name}'s Live Broadcast`,
        bio: bio.trim(),
        category,
        privacy,
        password: enablePassword ? password : '',
        language,
        tags,
        allowGuestJoin,
        allowGifts,
        allowComments,
        beautyFilter,
        locationSharing: shareLocation ? locationName : '',
        scheduledTime: scheduledType === 'now' ? 'Start Now' : scheduledTime
      };

      const res = await fetch('/api/rooms/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const newRoom = await res.json();
        if (myImages.length > 0) {
          try {
            await saveRoomImages(newRoom.id, myImages);
            newRoom.images = myImages;
          } catch (err) {
            console.error("Failed to save room images:", err);
          }
        }
        onRoomCreated(newRoom);
      } else {
        alert('Could not start live stream. Please try again.');
      }
    } catch (err) {
      console.error(err);
      alert('Error connecting to backend server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="absolute inset-0 bg-[#090909]/95 backdrop-blur-md z-50 flex flex-col text-left overflow-y-auto scrollbar-none pb-8 animate-fade-in">
      
      {/* Top sticky header inside mobile frame */}
      <div className="sticky top-0 bg-[#0D0D0D]/90 backdrop-blur-md border-b border-white/10 p-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-gradient-to-tr from-red-500 to-pink-500 rounded-lg">
            <Camera className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-[7.5px] text-pink-400 font-black uppercase tracking-widest block leading-none">Studio Portal</span>
            <h2 className="text-white text-[12px] font-black uppercase tracking-wider leading-none mt-1">Create Live Room</h2>
          </div>
        </div>
        <button 
          type="button"
          onClick={onClose}
          className="p-1.5 hover:bg-white/10 rounded-full text-slate-400 hover:text-white transition active:scale-75"
        >
          <X className="w-4.5 h-4.5" />
        </button>
      </div>

      {/* Form Area */}
      <form onSubmit={handleStartLive} className="p-4 flex flex-col gap-5">
        
        {/* 1. Live Cover Photo Component */}
        <div className="flex flex-col gap-1.5">
          <label className="text-slate-400 text-[8.5px] uppercase tracking-wider font-extrabold flex items-center justify-between">
            <span>1. Broadcast Cover Banner</span>
            {cropSuccess && <span className="text-emerald-400 lowercase font-medium flex items-center gap-0.5">✂️ cropped successfully</span>}
          </label>
          
          <div className="relative w-full h-40 bg-slate-950 rounded-2xl overflow-hidden border border-white/10 group shadow-inner flex items-center justify-center">
            {/* Live Cover Photo preview */}
            <img 
              src={coverImage} 
              className="absolute inset-0 w-full h-full object-cover transition-transform duration-500"
              style={{ transform: `scale(${showCropWizard ? cropZoom : 1})` }}
              alt="Live Cover" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

            {/* Simulated Live preview frame overlay */}
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-600 px-2 py-0.5 rounded-full text-[8px] text-white uppercase font-black tracking-wider animate-pulse">
              <span className="w-1.5 h-1.5 bg-white rounded-full" />
              Live Preview
            </div>

            {/* Shutter flash animation frame */}
            {cameraFlash && (
              <div className="absolute inset-0 bg-white z-40 transition-opacity duration-150" />
            )}

            {/* Shutter Countdown overlay */}
            {cameraCountdown !== null && (
              <div className="absolute inset-0 z-40 bg-black/75 flex flex-col items-center justify-center">
                <motion.span 
                  key={cameraCountdown}
                  initial={{ scale: 0.3, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 1 }}
                  className="text-4xl font-black text-pink-500 drop-shadow-md"
                >
                  {cameraCountdown}
                </motion.span>
                <p className="text-[9px] text-slate-300 font-bold tracking-widest uppercase mt-2">Adjust your smile! 😊</p>
              </div>
            )}

            {/* Inner action buttons positioned nicely */}
            <div className="absolute bottom-3 left-3 right-3 flex justify-between gap-1.5 z-10">
              
              {/* My Images Upload */}
              <label className="flex-1 py-1.5 bg-black/60 hover:bg-black/80 border border-white/10 hover:border-pink-500/30 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer">
                <ImageIcon className="w-3 h-3 text-pink-400" />
                <span>{isUploadingImages ? 'Uploading...' : 'My Images'}</span>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/jpg" 
                  multiple 
                  disabled={isUploadingImages}
                  onChange={handleMyImagesUpload} 
                  className="hidden" 
                />
              </label>

              {/* Gallery presets dropdown toggle */}
              <button
                type="button"
                onClick={() => setShowGallerySelector(!showGallerySelector)}
                className="flex-1 py-1.5 bg-black/60 hover:bg-black/80 border border-white/10 hover:border-pink-500/30 text-white rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1 transition-all active:scale-95"
              >
                <ImageIcon className="w-3 h-3 text-pink-400" />
                <span>Gallery presets</span>
              </button>

              {/* Crop picture toggle */}
              <button
                type="button"
                onClick={() => setShowCropWizard(!showCropWizard)}
                className="px-2.5 py-1.5 bg-black/60 hover:bg-black/80 border border-white/10 text-white rounded-xl text-[9px] font-black flex items-center justify-center transition-all active:scale-95"
                title="Crop Banner"
              >
                <Scissors className="w-3 h-3 text-pink-400" />
              </button>
            </div>
          </div>

          {/* Render uploaded "My Images" gallery preview */}
          {myImages.length > 0 && (
            <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-2.5 flex flex-col gap-1.5 mt-2">
              <div className="flex justify-between items-center text-[8px] text-slate-400 uppercase tracking-widest font-black">
                <span>My Images ({myImages.length}/10)</span>
                <span className="text-pink-400 font-black">Tap image to view • Check to select</span>
              </div>
              <div className="flex gap-2.5 overflow-x-auto pb-1 scrollbar-none">
                {myImages.map((img, idx) => (
                  <div key={idx} className={`relative w-14 h-14 rounded-xl overflow-hidden border transition-all flex-shrink-0 group ${img.selected !== false ? 'border-pink-500 ring-1 ring-pink-500/30' : 'border-white/15'}`}>
                    {/* Image Thumbnail (Clickable to view) */}
                    <img 
                      src={img.imageUrl} 
                      onClick={() => setPreviewImgUrl(img.imageUrl)}
                      className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform" 
                      alt="" 
                      title="Click to view full-screen"
                    />

                    {/* Toggle Selection Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleSelectImage(idx)}
                      className={`absolute top-0.5 left-0.5 rounded-full w-4 h-4 flex items-center justify-center border transition-all ${
                        img.selected !== false 
                          ? 'bg-pink-500 border-pink-400 text-white shadow' 
                          : 'bg-black/60 border-white/30 text-transparent'
                      }`}
                      title={img.selected !== false ? "Selected for upcoming live (Click to deselect)" : "Click to select for live"}
                    >
                      <Check className="w-2.5 h-2.5 text-white stroke-[3]" />
                    </button>

                    {/* Delete Button */}
                    <button 
                      type="button"
                      onClick={() => setMyImages(prev => prev.filter((_, i) => i !== idx))}
                      className="absolute top-0.5 right-0.5 bg-red-600/95 hover:bg-red-700 text-white rounded-full p-0.5 shadow transition-all scale-90 z-10"
                      title="Delete Image"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>

                    {/* Reordering controls */}
                    <div className="absolute inset-x-0 bottom-0 bg-black/80 p-0.5 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      <button 
                        type="button"
                        onClick={() => handleMoveMyImage(idx, 'left')}
                        disabled={idx === 0}
                        className="text-white hover:text-pink-400 disabled:opacity-20 text-[9px] px-0.5"
                        title="Move Left"
                      >
                        ◀
                      </button>
                      <button 
                        type="button"
                        onClick={() => handleMoveMyImage(idx, 'right')}
                        disabled={idx === myImages.length - 1}
                        className="text-white hover:text-pink-400 disabled:opacity-20 text-[9px] px-0.5"
                        title="Move Right"
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Sub-action: Preset Drawer or File Picker */}
          <AnimatePresence>
            {showGallerySelector && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-2.5 flex flex-col gap-2"
              >
                <div className="flex justify-between items-center px-1 text-[8px] text-slate-400 uppercase tracking-widest font-black">
                  <span>Pick a dynamic theme preset</span>
                  <label className="text-pink-400 hover:underline cursor-pointer flex items-center gap-0.5">
                    <span>Upload custom image</span>
                    <input type="file" accept="image/*" onChange={handleCustomFileChange} className="hidden" />
                  </label>
                </div>
                <div className="grid grid-cols-6 gap-1.5">
                  {GALLERY_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectPreset(preset)}
                      className="aspect-square rounded-lg overflow-hidden border border-white/15 focus:ring-2 focus:ring-pink-500"
                    >
                      <img src={preset} className="w-full h-full object-cover" alt="" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Sub-action: Crop tool zoom slider inside */}
          <AnimatePresence>
            {showCropWizard && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-3 flex flex-col gap-2 overflow-hidden"
              >
                <div className="flex justify-between items-center text-[8.5px] text-slate-300 font-bold uppercase">
                  <span className="flex items-center gap-1"><Scissors className="w-3 h-3 text-pink-500" /> Fit & Scale Banner</span>
                  <span className="text-pink-500 font-mono font-bold">{cropZoom.toFixed(1)}x Zoom</span>
                </div>
                <input 
                  type="range" 
                  min="1.0" 
                  max="3.0" 
                  step="0.1" 
                  value={cropZoom} 
                  onChange={(e) => setCropZoom(parseFloat(e.target.value))}
                  className="w-full accent-pink-500 cursor-pointer h-1 bg-slate-800 rounded-lg appearance-none" 
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowCropWizard(false);
                    setCropSuccess(true);
                  }}
                  className="w-full py-1 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-[8px] font-black uppercase tracking-widest flex items-center justify-center gap-1"
                >
                  <Check className="w-3 h-3 stroke-[3]" /> Apply Crop Bounding Box
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 2. Live Room Title */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label className="text-slate-400 text-[8.5px] uppercase tracking-wider font-extrabold">2. Stream Catchy Title</label>
            <span className={`text-[8px] font-mono ${title.length > 50 ? 'text-red-500 font-black' : 'text-slate-500'}`}>
              {title.length}/50
            </span>
          </div>
          <input 
            type="text" 
            placeholder="e.g. Daily chat with sweet fans! 💖"
            maxLength={50}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-[#0D0D0D] border border-white/10 focus:border-pink-500/50 rounded-xl px-3.5 py-2 text-[10.5px] text-white placeholder-slate-500 font-medium focus:outline-none transition-colors"
          />
        </div>

        {/* 3. Short Bio / Description */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center">
            <label className="text-slate-400 text-[8.5px] uppercase tracking-wider font-extrabold">3. Room Welcome Bio</label>
            <span className={`text-[8px] font-mono ${bio.length > 150 ? 'text-red-500 font-black' : 'text-slate-500'}`}>
              {bio.length}/150
            </span>
          </div>
          <textarea 
            placeholder="Describe your stream vibes (e.g. Singing acoustic songs and taking fan requests today! Join guest seat to talk!)"
            maxLength={150}
            rows={2}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full bg-[#0D0D0D] border border-white/10 focus:border-pink-500/50 rounded-xl p-3 text-[10.5px] text-white placeholder-slate-500 font-medium focus:outline-none transition-colors resize-none leading-relaxed"
          />
        </div>

        {/* Row block: Privacy + category */}
        <div className="grid grid-cols-2 gap-3.5">
          
          {/* 4. Room Privacy Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-[8.5px] uppercase tracking-wider font-extrabold">4. Stream Privacy</label>
            <select
              value={privacy}
              onChange={(e: any) => setPrivacy(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-white/10 focus:border-pink-500/50 rounded-xl px-3 py-2 text-[10.5px] text-white focus:outline-none font-bold"
            >
              <option value="Public Live">🌐 Public Live</option>
              <option value="Followers Only">👥 Followers Only</option>
              <option value="Private Live">🔒 Private Live</option>
            </select>
          </div>

          {/* 6. Category Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-[8.5px] uppercase tracking-wider font-extrabold">6. Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-white/10 focus:border-pink-500/50 rounded-xl px-3 py-2 text-[10.5px] text-white focus:outline-none font-bold"
            >
              {CATEGORIES.map((cat, idx) => (
                <option key={idx} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* 5. Lock Room Option (Password protection) */}
        <div className="bg-[#0D0D0D] p-3 rounded-2xl border border-white/5 flex flex-col gap-2.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              {enablePassword ? <Lock className="w-3.5 h-3.5 text-pink-500" /> : <Unlock className="w-3.5 h-3.5 text-slate-500" />}
              <div>
                <span className="text-[9px] text-white font-extrabold block">5. Password Protection</span>
                <span className="text-[7.5px] text-slate-400 block mt-0.5">Require numeric password to enter room</span>
              </div>
            </div>
            
            {/* iOS style Toggle */}
            <button
              type="button"
              onClick={() => setEnablePassword(!enablePassword)}
              className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex ${
                enablePassword ? 'bg-pink-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-3.5 h-3.5 bg-white rounded-full shadow" />
            </button>
          </div>

          <AnimatePresence>
            {enablePassword && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-1"
              >
                <input 
                  type="password" 
                  placeholder="Enter numeric password (e.g. 1234)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-slate-950 border border-white/10 focus:border-pink-500/50 rounded-xl px-3 py-1.5 text-[10px] text-white placeholder-slate-600 font-mono focus:outline-none tracking-widest"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Row block: Language & Tags input */}
        <div className="grid grid-cols-2 gap-3.5">
          
          {/* 7. Language Selection */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-[8.5px] uppercase tracking-wider font-extrabold">7. Stream Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full bg-[#0D0D0D] border border-white/10 focus:border-pink-500/50 rounded-xl px-3 py-2 text-[10.5px] text-white focus:outline-none font-bold"
            >
              {LANGUAGES.map((lang, idx) => (
                <option key={idx} value={lang}>{lang}</option>
              ))}
            </select>
          </div>

          {/* 8. Tags adder */}
          <div className="flex flex-col gap-1.5">
            <label className="text-slate-400 text-[8.5px] uppercase tracking-wider font-extrabold">8. Tags (Max 5)</label>
            <div className="flex gap-1">
              <input 
                type="text" 
                placeholder="Tag name"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTag(); } }}
                className="flex-grow bg-[#0D0D0D] border border-white/10 rounded-xl px-3 py-1.5 text-[10.5px] text-white focus:outline-none focus:border-pink-500/50"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="px-2.5 bg-pink-500 text-white rounded-xl flex items-center justify-center text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* Tags pills rendered cleanly below */}
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 -mt-2">
            {tags.map((tag, idx) => (
              <span 
                key={idx} 
                className="bg-pink-500/10 text-pink-400 border border-pink-500/20 text-[8.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1"
              >
                #{tag}
                <button 
                  type="button" 
                  onClick={() => handleRemoveTag(idx)}
                  className="text-pink-400/50 hover:text-pink-400 hover:bg-pink-500/20 rounded-full w-3 h-3 flex items-center justify-center text-[7px]"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}

        {/* 9-12. Permissions iOS styled checkboard Grid */}
        <div className="bg-[#0D0D0D] p-3 rounded-2xl border border-white/5 flex flex-col gap-3">
          <span className="text-slate-400 text-[8.5px] uppercase tracking-wider font-extrabold">Interaction permissions</span>
          
          <div className="grid grid-cols-2 gap-3">
            {/* Allow Guest Join */}
            <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-white/5">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[9px] text-slate-200 font-bold">9. Guest Join</span>
              </div>
              <button
                type="button"
                onClick={() => setAllowGuestJoin(!allowGuestJoin)}
                className={`w-7 h-4 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex ${
                  allowGuestJoin ? 'bg-pink-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <div className="w-3 h-3 bg-white rounded-full shadow" />
              </button>
            </div>

            {/* Allow Gifts */}
            <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-white/5">
              <div className="flex items-center gap-1.5">
                <Gift className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-[9px] text-slate-200 font-bold">10. Allow Gifts</span>
              </div>
              <button
                type="button"
                onClick={() => setAllowGifts(!allowGifts)}
                className={`w-7 h-4 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex ${
                  allowGifts ? 'bg-pink-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <div className="w-3 h-3 bg-white rounded-full shadow" />
              </button>
            </div>

            {/* Allow Comments */}
            <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-white/5">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                <span className="text-[9px] text-slate-200 font-bold">11. Comments</span>
              </div>
              <button
                type="button"
                onClick={() => setAllowComments(!allowComments)}
                className={`w-7 h-4 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex ${
                  allowComments ? 'bg-pink-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <div className="w-3 h-3 bg-white rounded-full shadow" />
              </button>
            </div>

            {/* Beauty Filter */}
            <div className="flex justify-between items-center bg-slate-950 p-2.5 rounded-xl border border-white/5">
              <div className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
                <span className="text-[9px] text-slate-200 font-bold">12. Beauty Glow</span>
              </div>
              <button
                type="button"
                onClick={() => setBeautyFilter(!beautyFilter)}
                className={`w-7 h-4 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex ${
                  beautyFilter ? 'bg-pink-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <div className="w-3 h-3 bg-white rounded-full shadow" />
              </button>
            </div>
          </div>
        </div>

        {/* 13. Location Sharing */}
        <div className="bg-[#0D0D0D] p-3 rounded-2xl border border-white/5 flex flex-col gap-2.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-red-400" />
              <div>
                <span className="text-[9px] text-white font-extrabold block">13. Geolocation Broadcast Tag</span>
                <span className="text-[7.5px] text-slate-400 block mt-0.5">Let nearby users find your live feed</span>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShareLocation(!shareLocation)}
              className={`w-8 h-4.5 rounded-full p-0.5 transition-colors duration-200 focus:outline-none flex ${
                shareLocation ? 'bg-pink-500 justify-end' : 'bg-slate-700 justify-start'
              }`}
            >
              <div className="w-3.5 h-3.5 bg-white rounded-full shadow" />
            </button>
          </div>
          <AnimatePresence>
            {shareLocation && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-1"
              >
                <input 
                  type="text" 
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="Dhaka, Bangladesh"
                  className="w-full bg-slate-950 border border-white/10 focus:border-pink-500/50 rounded-xl px-3 py-1.5 text-[10px] text-white placeholder-slate-600 focus:outline-none font-bold"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 14. Scheduled Live Options */}
        <div className="bg-[#0D0D0D] p-3 rounded-2xl border border-white/5 flex flex-col gap-2.5">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              <div>
                <span className="text-[9px] text-white font-extrabold block">14. Schedule Streaming Time</span>
                <span className="text-[7.5px] text-slate-400 block mt-0.5">Start instantly or reserve slots for later</span>
              </div>
            </div>
          </div>

          {/* Toggle Buttons */}
          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              type="button"
              onClick={() => setScheduledType('now')}
              className={`py-2 rounded-xl text-[9px] font-bold uppercase transition ${
                scheduledType === 'now' 
                  ? 'bg-pink-500 text-white shadow' 
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              Start Stream Now
            </button>
            <button
              type="button"
              onClick={() => setScheduledType('later')}
              className={`py-2 rounded-xl text-[9px] font-bold uppercase transition ${
                scheduledType === 'later' 
                  ? 'bg-pink-500 text-white shadow' 
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              Schedule Later
            </button>
          </div>

          <AnimatePresence>
            {scheduledType === 'later' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden mt-1"
              >
                <input 
                  type="datetime-local" 
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 focus:border-pink-500/50 rounded-xl px-3 py-1.5 text-[10px] text-white font-mono focus:outline-none font-bold accent-pink-500"
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Start button */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-4 w-full py-3 bg-gradient-to-r from-red-500 via-pink-500 to-purple-600 hover:from-red-600 hover:via-pink-600 hover:to-purple-700 disabled:opacity-50 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-pink-500/20"
        >
          {isSubmitting ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Broadcasting...</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 fill-white animate-bounce" />
              <span>Start Live Streaming</span>
            </>
          )}
        </button>

      </form>

      {/* Lightbox for previewing uploaded images */}
      <AnimatePresence>
        {previewImgUrl && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex flex-col items-center justify-center p-4">
            <button
              type="button"
              onClick={() => setPreviewImgUrl(null)}
              className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition active:scale-95"
            >
              <X className="w-5 h-5" />
            </button>
            <img 
              src={previewImgUrl} 
              className="max-w-full max-h-[80%] rounded-2xl object-contain border border-white/10" 
              alt="Preview" 
            />
            <p className="text-[10px] text-slate-400 mt-4 font-mono">Tap outside or click X to close preview</p>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
