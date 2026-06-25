/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Phone, Video, ShieldAlert, AlertCircle, ArrowLeft, Heart, Sparkles, MessageCircle, Mic
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';

interface MessageItem {
  id: string;
  sender: 'user' | 'creator';
  content: string;
  timestamp: string;
}

interface MessagesViewProps {
  creators: UserProfile[];
  user: UserProfile;
  activeCreatorId: string | null;
  onSelectCreatorChat: (creatorId: string | null) => void;
  onStartCall: (creator: UserProfile, type: 'voice' | 'video') => void;
}

export default function MessagesView({ creators, user, activeCreatorId, onSelectCreatorChat, onStartCall }: MessagesViewProps) {
  const [conversations, setConversations] = useState<Record<string, MessageItem[]>>({});
  const [inputMsg, setInputMsg] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedCreator = creators.find(c => c.id === activeCreatorId);

  // Initialize mock conversations with greetings from each creator if empty
  useEffect(() => {
    const initialConv: Record<string, MessageItem[]> = {};
    creators.forEach(c => {
      initialConv[c.id] = [
        {
          id: `msg_g_${c.id}`,
          sender: 'creator',
          content: `Hey Jewel! 🥰 I am currently online! Are you coming to watch my live stream later? Ask me anything! 🌹`,
          timestamp: 'Just now'
        }
      ];
    });
    setConversations(initialConv);
  }, [creators]);

  // Scroll to bottom of chat
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeCreatorId, isTyping]);

  // Handle Send Direct Message & trigger AI replica reply
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCreatorId || !selectedCreator || !inputMsg.trim()) return;

    const userText = inputMsg.trim();
    const myMsg: MessageItem = {
      id: `m_user_${Date.now()}`,
      sender: 'user',
      content: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Update message log immediately
    setConversations(prev => ({
      ...prev,
      [activeCreatorId]: [...(prev[activeCreatorId] || []), myMsg]
    }));
    setInputMsg('');
    setIsTyping(true);

    // Call server API for server-side Gemini AI response
    try {
      const response = await fetch('/api/gemini/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: activeCreatorId,
          creatorName: selectedCreator.name,
          userMessage: userText
        })
      });

      const data = await response.json();
      setIsTyping(false);

      const aiReply: MessageItem = {
        id: `m_ai_${Date.now()}`,
        sender: 'creator',
        content: data.reply || `Hey Jewel! 😘 Loved chatting with you. Let's make a video call to talk in real-time! 💖`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConversations(prev => ({
        ...prev,
        [activeCreatorId]: [...(prev[activeCreatorId] || []), aiReply]
      }));

    } catch (err) {
      console.error('Error getting Gemini message response:', err);
      setIsTyping(false);
      
      const errorMsg: MessageItem = {
        id: `m_err_${Date.now()}`,
        sender: 'creator',
        content: `Aww, sorry Jewel! My internet lagged, but I always love connecting with you! 🥰 Call me!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setConversations(prev => ({
        ...prev,
        [activeCreatorId]: [...(prev[activeCreatorId] || []), errorMsg]
      }));
    }
  };

  return (
    <div className="absolute inset-0 bg-[#090909] text-white flex flex-col justify-between overflow-hidden select-none">
      
      {/* 1. VIEW A: MESSAGES DIRECTORY LIST */}
      {!activeCreatorId ? (
        <div className="w-full h-full flex flex-col p-4 overflow-y-auto scrollbar-none pb-20 pt-5">
          <div className="flex justify-between items-center mb-5">
            <h2 className="text-white text-md font-black uppercase tracking-wider flex items-center gap-1.5">
              <MessageCircle className="w-4 h-4 text-[#FF007A]" /> Direct Messages
            </h2>
            <span className="text-[8px] bg-[#FF007A]/10 text-[#FF007A] border border-[#FF007A]/25 rounded px-2 py-0.5 uppercase tracking-widest font-black flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-yellow-300" /> AI Powered Chats
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {creators.map((creator) => {
              const lastMsg = conversations[creator.id]?.[conversations[creator.id].length - 1];
              return (
                <div 
                  key={creator.id}
                  onClick={() => onSelectCreatorChat(creator.id)}
                  className="bg-[#0D0D0D]/60 hover:bg-[#0D0D0D] border border-white/10 p-3 rounded-2xl flex items-center gap-3 cursor-pointer transition active:scale-98"
                >
                  <div className="relative">
                    <img src={creator.avatar} className="w-10 h-10 rounded-full border border-[#FF007A] object-cover" alt="" />
                    {creator.onlineStatus === 'online' && (
                      <div className="absolute bottom-0 right-0 bg-green-500 w-3 h-3 rounded-full border-2 border-slate-950" />
                    )}
                  </div>

                  <div className="flex-grow overflow-hidden text-left">
                    <div className="flex justify-between items-center">
                      <h4 className="text-white text-[11px] font-black">{creator.name}</h4>
                      <span className="text-[8px] text-slate-500">Just now</span>
                    </div>
                    <p className="text-[9px] text-slate-400 mt-1 truncate">
                      {lastMsg ? lastMsg.content : `Start secure chatting...`}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 p-3.5 bg-white/5 rounded-2xl border border-dashed border-white/10 text-center max-w-xs mx-auto">
            <ShieldAlert className="w-5 h-5 text-green-500 mx-auto mb-1.5" />
            <span className="text-[8px] uppercase tracking-wider text-slate-500 block font-bold">Secure Guard Protection</span>
            <p className="text-[8px] text-slate-500 mt-0.5 leading-relaxed">
              All interactions comply with content safety guidelines. Chat logs are private.
            </p>
          </div>
        </div>
      ) : (
        /* 2. VIEW B: CREATOR PRIVATE CONVERSATION PANEL */
        <div className="absolute inset-0 bg-[#090909] flex flex-col justify-between overflow-hidden">
          
          {/* Header */}
          <div className="p-3 bg-[#0D0D0D]/90 border-b border-white/10 flex justify-between items-center pt-5">
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => onSelectCreatorChat(null)}
                className="p-1 hover:bg-white/10 rounded-full text-slate-300 active:scale-75 transition"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center gap-2 text-left">
                <img src={selectedCreator?.avatar} className="w-8 h-8 rounded-full border border-[#FF007A] object-cover" alt="" />
                <div>
                  <h3 className="text-white text-[11px] font-bold leading-tight">{selectedCreator?.name}</h3>
                  <span className="text-[8px] text-green-400 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" /> Online
                  </span>
                </div>
              </div>
            </div>

            {/* Direct Calling Triggers from Header */}
            <div className="flex gap-2">
              <button 
                onClick={() => onStartCall(selectedCreator!, 'voice')}
                className="p-1.5 bg-white/5 hover:bg-white/10 rounded-full text-white active:scale-90 transition border border-white/10"
                title="Start Voice Call"
              >
                <Phone className="w-3.5 h-3.5 text-[#FF007A]" />
              </button>
              <button 
                onClick={() => onStartCall(selectedCreator!, 'video')}
                className="p-1.5 bg-gradient-to-tr from-[#FF007A] to-[#8E2DE2] rounded-full text-white active:scale-90 transition shadow"
                title="Start Video Call"
              >
                <Video className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Conversation Chat Logs List */}
          <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-3 scrollbar-none pb-5">
            <div className="text-center mb-2 bg-white/5 p-2 rounded-xl border border-white/10 text-[8px] text-slate-500 flex items-center gap-1 justify-center max-w-xs mx-auto">
              <AlertCircle className="w-3.5 h-3.5" /> Direct pricing: 5/min voice, 15/min video
            </div>

            {(conversations[activeCreatorId] || []).map((msg) => (
              <div 
                key={msg.id}
                className={`flex flex-col max-w-[80%] ${
                  msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'
                }`}
              >
                <div className={`p-3 rounded-2xl text-[10px] leading-relaxed font-medium shadow-sm ${
                  msg.sender === 'user' 
                    ? 'bg-gradient-to-r from-[#FF007A] to-[#8E2DE2] text-white rounded-br-none' 
                    : 'bg-[#0D0D0D] border border-white/10 text-slate-100 rounded-bl-none'
                }`}>
                  {msg.content}
                </div>
                <span className="text-[7px] text-slate-500 mt-1 font-mono">{msg.timestamp}</span>
              </div>
            ))}

            {/* Typing status indicator */}
            {isTyping && (
              <div className="flex items-center gap-1 bg-white/5 p-2 px-3 border border-white/10 rounded-full w-fit self-start">
                <span className="w-1 h-1 bg-[#FF007A] rounded-full animate-bounce delay-100" />
                <span className="w-1 h-1 bg-[#FF007A] rounded-full animate-bounce delay-200" />
                <span className="w-1 h-1 bg-[#FF007A] rounded-full animate-bounce delay-300" />
                <span className="text-[8px] text-slate-400 font-semibold ml-1.5">{selectedCreator?.name} typing...</span>
              </div>
            )}
            <div ref={scrollRef} />
          </div>

          {/* Message form text field bottom */}
          <form onSubmit={handleSendMessage} className="p-3 bg-[#0D0D0D]/80 border-t border-white/10 flex items-center gap-2.5 pb-4">
            <div className="flex-grow flex items-center bg-[#090909] rounded-full border border-white/10 px-3 py-1">
              <input 
                type="text" 
                placeholder="Type a sweet message..." 
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                className="flex-grow bg-transparent text-white outline-none border-none text-[10px] p-1.5 placeholder-slate-400 text-left"
              />
              <button type="submit" className="p-1 hover:bg-white/10 rounded-full text-[#FF007A] transition active:scale-95">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>

        </div>
      )}

    </div>
  );
}
