/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Heart, MessageCircle, Share2, Upload, Plus, X, Image as ImageIcon, Film, MessageSquare, Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Post, UserProfile } from '../types';

interface FeedViewProps {
  posts: Post[];
  user: UserProfile;
  onLikePost: (postId: string) => void;
  onCommentPost: (postId: string, content: string) => void;
  onUploadPost: (type: 'photo' | 'video', content: string, url: string) => void;
}

export default function FeedView({ posts, user, onLikePost, onCommentPost, onUploadPost }: FeedViewProps) {
  const [activePostIdx, setActivePostIdx] = useState(0);
  const [commentOpenPostId, setCommentOpenPostId] = useState<string | null>(null);
  const [commentInput, setCommentInput] = useState('');
  
  // Upload modal states
  const [showUpload, setShowUpload] = useState(false);
  const [uploadType, setUploadType] = useState<'photo' | 'video'>('photo');
  const [postCaption, setPostCaption] = useState('');
  const [mediaUrlInput, setMediaUrlInput] = useState('');

  // Handle write and submit comment
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentOpenPostId || !commentInput.trim()) return;
    onCommentPost(commentOpenPostId, commentInput);
    setCommentInput('');
  };

  // Handle post submit
  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postCaption.trim()) return;
    
    // Fallback default photos/videos if url left blank
    const defaultUrl = uploadType === 'photo'
      ? 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=600&h=400'
      : 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-with-headphones-singing-40348-large.mp4';

    onUploadPost(uploadType, postCaption, mediaUrlInput.trim() || defaultUrl);
    setPostCaption('');
    setMediaUrlInput('');
    setShowUpload(false);
    alert('🎉 Post published to global Livo Live Feed!');
  };

  const currentPost = posts[activePostIdx];

  return (
    <div className="absolute inset-0 bg-[#090909] text-white flex flex-col justify-between overflow-hidden select-none">
      
      {/* TIKTOK HEADER */}
      <div className="absolute top-0 inset-x-0 z-30 p-4 bg-gradient-to-b from-[#0D0D0D]/90 to-transparent flex justify-between items-center pt-5">
        <h2 className="text-white text-md font-black uppercase tracking-wider">Livo Feed</h2>
        <div className="flex gap-4 text-xs font-bold">
          <span className="text-[#FF007A] border-b-2 border-[#FF007A] pb-1 cursor-pointer">Trending</span>
          <span className="text-slate-400 pb-1 cursor-pointer">Following</span>
        </div>
        {/* Upload Trigger button */}
        <button 
          onClick={() => setShowUpload(true)}
          className="p-1.5 bg-[#FF007A] hover:bg-[#FF007A]/90 text-white rounded-full transition active:scale-95 shadow-md flex items-center justify-center"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* TIKTOK BODY: Immersive visual slider with action buttons */}
      {posts.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center p-6 text-center">
          <p className="text-slate-400 text-xs">No posts uploaded to feed yet.</p>
        </div>
      ) : (
        <div className="relative flex-grow flex items-center justify-center overflow-hidden">
          
          {/* Swiping Indicator buttons */}
          <div className="absolute left-3 inset-y-0 flex flex-col justify-center gap-4 z-20">
            {activePostIdx > 0 && (
              <button 
                onClick={() => setActivePostIdx(prev => prev - 1)}
                className="w-7 h-7 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white border border-white/10 text-xs active:scale-95"
              >
                ▲
              </button>
            )}
            {activePostIdx < posts.length - 1 && (
              <button 
                onClick={() => setActivePostIdx(prev => prev + 1)}
                className="w-7 h-7 bg-black/40 hover:bg-black/60 rounded-full flex items-center justify-center text-white border border-white/10 text-xs active:scale-95"
              >
                ▼
              </button>
            )}
          </div>

          {/* Active Post Content Layer */}
          <div className="absolute inset-0 z-0 bg-[#090909] flex items-center justify-center">
            {currentPost.type === 'video' ? (
              <video 
                key={currentPost.id}
                src={currentPost.mediaUrl}
                className="w-full h-full object-cover filter brightness-90 saturate-110"
                autoPlay
                loop
                muted
                playsInline
              />
            ) : (
              <img 
                src={currentPost.mediaUrl} 
                className="w-full h-full object-contain filter brightness-95" 
                alt="" 
              />
            )}
            {/* Ambient translucent gradient bottom overlay */}
            <div className="absolute inset-x-0 bottom-0 h-44 bg-gradient-to-t from-black via-black/40 to-transparent z-10" />
          </div>

          {/* TIKTOK SIDE ACTIONS (Likes, Comments, Shares) */}
          <div className="absolute right-3 bottom-16 z-20 flex flex-col items-center gap-4">
            
            {/* Host Avatar */}
            <div className="relative mb-2">
              <img src={currentPost.creatorAvatar} className="w-10 h-10 rounded-full border-2 border-[#FF007A] object-cover" alt="" />
              <div className="absolute bottom-[-6px] left-1/2 -translate-x-1/2 bg-[#FF007A] text-white rounded-full p-0.5 shadow-md">
                <Plus className="w-2.5 h-2.5" />
              </div>
            </div>

            {/* Like Action */}
            <button 
              onClick={() => onLikePost(currentPost.id)}
              className="flex flex-col items-center gap-1 group active:scale-75 transition"
            >
              <div className={`p-2.5 rounded-full backdrop-blur-md border ${
                currentPost.isLikedByUser 
                  ? 'bg-rose-700 border-rose-600 text-white' 
                  : 'bg-black/40 border-white/10 text-white group-hover:text-rose-500'
              }`}>
                <Heart className={`w-5 h-5 ${currentPost.isLikedByUser ? 'fill-white' : ''}`} />
              </div>
              <span className="text-[10px] text-white font-bold drop-shadow">{currentPost.likesCount}</span>
            </button>

            {/* Comments Action */}
            <button 
              onClick={() => setCommentOpenPostId(currentPost.id)}
              className="flex flex-col items-center gap-1 group active:scale-75 transition"
            >
              <div className="p-2.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white group-hover:text-[#FF007A]">
                <MessageCircle className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-white font-bold drop-shadow">{currentPost.comments.length}</span>
            </button>

            {/* Share Action */}
            <button 
              onClick={() => alert(`Link copied! Share this post with your friends.`)}
              className="flex flex-col items-center gap-1 group active:scale-75 transition"
            >
              <div className="p-2.5 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white group-hover:text-blue-400">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-white font-bold drop-shadow">{currentPost.sharesCount}</span>
            </button>
          </div>

          {/* TIKTOK OVERLAY DETAILS (Creator, Caption) */}
          <div className="absolute left-4 bottom-14 z-20 right-16 pr-4">
            <h3 className="text-white text-xs font-bold flex items-center gap-1.5 leading-none">
              <span>@{currentPost.creatorName}</span>
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-ping" />
            </h3>
            <p className="text-[11px] text-slate-200 mt-2 font-medium leading-relaxed drop-shadow-sm">
              {currentPost.content}
            </p>
            <div className="flex items-center gap-1 text-[10px] text-[#FF007A] font-bold mt-2.5 bg-black/30 w-fit px-2 py-0.5 rounded-full border border-pink-500/10">
              <span>🎵</span>
              <span className="animate-pulse">Original Audio - Livo Records</span>
            </div>
          </div>

        </div>
      )}

      {/* ============ OVERLAYS / MODALS ============ */}

      {/* 1. COMMENTS SHEET DRAWER */}
      <AnimatePresence>
        {commentOpenPostId && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-40 flex items-end justify-center">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-[#0D0D0D] border-t border-white/10 rounded-t-3xl w-full max-h-[380px] p-4 flex flex-col shadow-2xl"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-3 border-b border-white/10 mb-3">
                <span className="text-white text-xs font-black uppercase tracking-wider flex items-center gap-1">
                  <MessageSquare className="w-4 h-4 text-[#FF007A]" />
                  <span>Comments ({posts.find(p => p.id === commentOpenPostId)?.comments.length})</span>
                </span>
                <button 
                  onClick={() => setCommentOpenPostId(null)}
                  className="p-1 bg-white/10 hover:bg-white/20 rounded-full text-white"
                >
                  ✕
                </button>
              </div>

              {/* List */}
              <div className="flex-grow overflow-y-auto flex flex-col gap-3 pb-4 max-h-[260px] scrollbar-none">
                {posts.find(p => p.id === commentOpenPostId)?.comments.length === 0 ? (
                  <div className="text-center p-6">
                    <p className="text-slate-400 text-[10px]">No comments yet. Be the first to comment!</p>
                  </div>
                ) : (
                  posts.find(p => p.id === commentOpenPostId)?.comments.map((comm) => (
                    <div key={comm.id} className="flex gap-2.5 bg-white/5 p-2.5 rounded-2xl border border-white/10">
                      <img src={comm.userAvatar} className="w-6 h-6 rounded-full object-cover" alt="" />
                      <div>
                        <div className="flex gap-1.5 items-center text-[10px]">
                          <span className="text-white font-bold leading-none">{comm.userName}</span>
                          <span className="text-slate-500 text-[8px] leading-none">{comm.timestamp}</span>
                        </div>
                        <p className="text-slate-200 text-[10px] mt-1 font-medium leading-normal">{comm.content}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Footer text field */}
              <form onSubmit={handleCommentSubmit} className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10">
                <input 
                  type="text" 
                  placeholder="Post comments securely..." 
                  value={commentInput}
                  onChange={(e) => setCommentInput(e.target.value)}
                  className="flex-grow bg-transparent text-white outline-none border-none text-[10px] p-2 pl-3"
                />
                <button type="submit" className="p-2 bg-[#FF007A] rounded-full text-white transition active:scale-95">
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 2. UPLOAD NEW POST MODAL */}
      <AnimatePresence>
        {showUpload && (
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm z-40 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0D0D0D] border border-white/10 p-5 rounded-2xl w-full max-w-[280px] shadow-2xl flex flex-col text-slate-100"
            >
              <div className="flex justify-between items-center pb-2.5 border-b border-white/10 mb-3">
                <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <Upload className="w-4 h-4 text-[#FF007A]" /> Upload Livo Feed
                </h3>
                <button onClick={() => setShowUpload(false)} className="text-slate-400 hover:text-white text-[10px]">✕</button>
              </div>

              <form onSubmit={handlePostSubmit} className="flex flex-col gap-3 text-left">
                {/* Type Selection */}
                <div className="flex flex-col gap-1">
                  <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Feed Media Type:</span>
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      type="button"
                      onClick={() => setUploadType('photo')}
                      className={`py-1.5 rounded-lg text-[10px] font-bold border transition flex items-center justify-center gap-1 ${
                        uploadType === 'photo' 
                          ? 'bg-[#FF007A]/20 border-[#FF007A] text-white' 
                          : 'bg-black/30 border-white/10 text-slate-400'
                      }`}
                    >
                      <ImageIcon className="w-3 h-3" /> Photo Post
                    </button>
                    <button 
                      type="button"
                      onClick={() => setUploadType('video')}
                      className={`py-1.5 rounded-lg text-[10px] font-bold border transition flex items-center justify-center gap-1 ${
                        uploadType === 'video' 
                          ? 'bg-[#FF007A]/20 border-[#FF007A] text-white' 
                          : 'bg-black/30 border-white/10 text-slate-400'
                      }`}
                    >
                      <Film className="w-3 h-3" /> Short Video
                    </button>
                  </div>
                </div>

                {/* Caption Input */}
                <div className="flex flex-col gap-1">
                  <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Caption Description:</span>
                  <textarea 
                    placeholder="Describe your post details..."
                    required
                    value={postCaption}
                    onChange={(e) => setPostCaption(e.target.value)}
                    className="bg-[#090909] border border-white/10 text-white rounded-lg p-2.5 text-[10px] outline-none h-16 resize-none"
                  />
                </div>

                {/* Media Url Input */}
                <div className="flex flex-col gap-1">
                  <span className="text-slate-400 text-[9px] font-bold uppercase tracking-wider">Media URL (Optional, fallback set):</span>
                  <input 
                    type="text" 
                    placeholder="https://domain.com/photo.jpg"
                    value={mediaUrlInput}
                    onChange={(e) => setMediaUrlInput(e.target.value)}
                    className="bg-[#090909] border border-white/10 text-white rounded-lg p-2 px-3 text-[10px] outline-none"
                  />
                </div>

                <button 
                  type="submit"
                  className="w-full mt-2 bg-gradient-to-r from-[#FF007A] to-[#8E2DE2] text-white py-2 rounded-xl text-xs font-bold shadow-lg"
                >
                  Publish Post
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
