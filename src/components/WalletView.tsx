/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  CreditCard, Smartphone, CheckCircle, ArrowRight, History, Shield, Wallet, ArrowDown, Sparkles
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile, Transaction } from '../types';
import { COIN_PACKAGES } from '../data';

interface WalletViewProps {
  user: UserProfile;
  transactions: Transaction[];
  onRechargeSuccess: (coins: number, price: number, method: string) => void;
  onClose?: () => void;
}

export default function WalletView({ user, transactions, onRechargeSuccess, onClose }: WalletViewProps) {
  const [selectedPackage, setSelectedPackage] = useState<any>(null);
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Rocket' | 'Stripe' | 'PayPal' | null>(null);
  
  // Modal Stages
  const [modalStage, setModalStage] = useState<'closed' | 'payment_select' | 'mobile_otp' | 'pin_confirm' | 'card_entry' | 'paypal_entry' | 'success'>('closed');
  
  // Checkout Inputs
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [pin, setPin] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [paypalEmail, setPaypalEmail] = useState('');

  // Choose package action
  const handleSelectPackage = (pack: any) => {
    setSelectedPackage(pack);
    setModalStage('payment_select');
  };

  // Choose payment gateway
  const handleSelectGateway = (method: 'bKash' | 'Nagad' | 'Rocket' | 'Stripe' | 'PayPal') => {
    setPaymentMethod(method);
    if (method === 'bKash' || method === 'Nagad' || method === 'Rocket') {
      setModalStage('mobile_otp');
    } else if (method === 'Stripe') {
      setModalStage('card_entry');
    } else {
      setModalStage('paypal_entry');
    }
  };

  // Bangladesh Mobile OTP stage
  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber) return;
    setModalStage('pin_confirm');
  };

  // Bangladesh Mobile PIN confirmation
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pin) return;
    triggerSuccess();
  };

  // Stripe checkout submit
  const handleCardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cardNumber || !cardExpiry || !cardCvv) return;
    triggerSuccess();
  };

  // PayPal checkout submit
  const handlePaypalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!paypalEmail) return;
    triggerSuccess();
  };

  // Recharge trigger
  const triggerSuccess = () => {
    if (!selectedPackage || !paymentMethod) return;
    
    const price = paymentMethod === 'bKash' || paymentMethod === 'Nagad' || paymentMethod === 'Rocket' 
      ? selectedPackage.priceBDT 
      : selectedPackage.price;

    onRechargeSuccess(selectedPackage.coins, price, paymentMethod);
    setModalStage('success');
  };

  // Close everything
  const handleFinish = () => {
    setSelectedPackage(null);
    setPaymentMethod(null);
    setPhoneNumber('');
    setOtp('');
    setPin('');
    setCardNumber('');
    setCardExpiry('');
    setCardCvv('');
    setPaypalEmail('');
    setModalStage('closed');
  };

  return (
    <div className="w-full h-full bg-[#090909] flex flex-col p-4 overflow-y-auto scrollbar-none pb-20">
      
      {/* WALLET BANNER CARD */}
      <div className="bg-gradient-to-br from-[#FF007A] via-[#8E2DE2] to-[#FFD700]/70 rounded-3xl p-5 shadow-xl relative overflow-hidden mb-6 flex flex-col">
        {/* Sparkle background vectors */}
        <div className="absolute top-[-20px] right-[-20px] w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-10px] left-[-10px] w-24 h-24 bg-black/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex justify-between items-start z-10">
          <div className="flex items-center gap-1.5 bg-black/20 p-1 px-3 rounded-full text-[9px] uppercase tracking-wider font-extrabold text-white">
            <Wallet className="w-3.5 h-3.5 text-yellow-300" />
            <span>Secure Livo Wallet</span>
          </div>
          <span className="text-[10px] bg-white/20 text-white font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-yellow-300" /> VIP Bonus Enabled
          </span>
        </div>

        <div className="mt-5 z-10">
          <span className="text-slate-200 text-[10px] uppercase font-semibold tracking-widest">Available Coin Balance</span>
          <h2 className="text-white text-3xl font-black mt-1 font-mono tracking-wide flex items-center gap-2">
            <span>🪙</span>
            <span>{user.coins.toLocaleString()}</span>
          </h2>
          <p className="text-pink-100/90 text-[10px] mt-1.5 leading-relaxed">
            Coins are used to support approved creators with premium virtual gifts or make direct voice/video calls.
          </p>
        </div>
      </div>

      {/* COIN PACKAGES GRID */}
      <h3 className="text-white text-xs font-black uppercase tracking-wider mb-3 flex items-center gap-1.5 px-1">
        <span>🛒</span>
        <span>Choose Recharge Package</span>
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {COIN_PACKAGES.map((pack) => (
          <div 
            key={pack.id}
            onClick={() => handleSelectPackage(pack)}
            className="bg-[#0D0D0D] hover:bg-[#0D0D0D]/80 rounded-2xl p-4 border border-white/10 hover:border-[#FF007A]/30 transition flex flex-col justify-between cursor-pointer relative overflow-hidden group hover:scale-[1.02] active:scale-[0.98]"
          >
            {pack.isPopular && (
              <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-yellow-500 text-slate-950 text-[7px] font-black tracking-widest px-2 py-0.5 rounded-bl-lg uppercase">
                Best Value
              </div>
            )}
            
            <div className="flex items-center gap-1.5">
              <span className="text-2xl">🪙</span>
              <div>
                <h4 className="text-white font-black font-mono text-sm group-hover:text-[#FF007A] transition">{pack.coins}</h4>
                <span className="text-[8px] text-slate-400">Coins package</span>
              </div>
            </div>

            <div className="mt-4 flex justify-between items-center bg-white/5 p-1.5 px-3 rounded-xl border border-white/10">
              <span className="text-[9px] text-slate-400 font-bold">Price</span>
              <span className="text-green-400 text-xs font-extrabold font-mono">${pack.price} / ৳{pack.priceBDT}</span>
            </div>
          </div>
        ))}
      </div>

      {/* RECENT TRANSACTIONS LIST */}
      <div className="flex justify-between items-center mb-3 px-1">
        <h3 className="text-white text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
          <History className="w-4 h-4 text-[#FF007A]" />
          <span>Wallet Statement</span>
        </h3>
        <span className="text-[9px] text-slate-500 uppercase tracking-widest font-mono">Real-time sync</span>
      </div>

      <div className="flex flex-col gap-2.5">
        {transactions.length === 0 ? (
          <div className="bg-[#0D0D0D] border border-white/10 rounded-2xl p-6 text-center">
            <p className="text-slate-400 text-[10px]">No statement logs found in this wallet.</p>
          </div>
        ) : (
          transactions.map((tx) => (
            <div 
              key={tx.id}
              className="bg-[#0D0D0D]/60 p-3.5 rounded-2xl border border-white/10 flex justify-between items-center hover:bg-[#0D0D0D] transition"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl flex items-center justify-center ${
                  tx.type === 'recharge' 
                    ? 'bg-green-500/10 text-green-400' 
                    : tx.type === 'withdrawal' 
                      ? 'bg-white/5 text-slate-400' 
                      : 'bg-red-500/10 text-red-400'
                }`}>
                  <ArrowDown className={`w-4 h-4 ${tx.type === 'recharge' ? '' : 'rotate-180'}`} />
                </div>
                <div>
                  <h4 className="text-white text-[11px] font-bold leading-tight">{tx.description}</h4>
                  <p className="text-[9px] text-slate-400 mt-1 flex items-center gap-1">
                    <span>{tx.timestamp}</span>
                    <span>•</span>
                    <span className="capitalize">{tx.paymentMethod || 'Wallet Delta'}</span>
                  </p>
                </div>
              </div>

              <div className="text-right">
                <span className={`font-mono text-xs font-bold ${tx.coinDelta > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {tx.coinDelta > 0 ? '+' : ''}{tx.coinDelta}
                </span>
                <p className="text-[8px] text-slate-500 uppercase tracking-widest font-bold mt-1">coins</p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* SECURE ENCRYPTION BADGING */}
      <div className="mt-6 flex items-center justify-center gap-1.5 text-slate-500 text-[9px] bg-white/5 p-2.5 rounded-2xl border border-dashed border-white/10 max-w-xs mx-auto text-center">
        <Shield className="w-3.5 h-3.5 text-green-500" />
        <span>Fully Secured Payments, TLS 1.3 Certified</span>
      </div>


      {/* ============ PAYMENT GATEWAY DIALOG OVERLAYS ============ */}
      <AnimatePresence>
        {modalStage !== 'closed' && (
          <div className="absolute inset-0 bg-black/85 backdrop-blur-sm z-50 flex items-end justify-center">
            <motion.div 
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="bg-[#0D0D0D] border-t border-white/10 rounded-t-3xl w-full p-5 shadow-2xl flex flex-col animate-none"
            >
              {/* Header */}
              <div className="flex justify-between items-center pb-3.5 border-b border-white/10 mb-4">
                <div>
                  <h3 className="text-white text-xs font-bold uppercase tracking-wider">Livo Live Payment Checkout</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Coins recharge amount: {selectedPackage?.coins} Coins</p>
                </div>
                <button 
                  onClick={handleFinish}
                  className="p-1 bg-white/10 hover:bg-white/20 rounded-full text-white text-[10px]"
                >
                  ✕
                </button>
              </div>

              {/* 1. SELECT PAYMENT METHOD GATEWAY */}
              {modalStage === 'payment_select' && (
                <div className="flex flex-col gap-3">
                  <h4 className="text-slate-300 text-[10px] font-bold uppercase tracking-wider mb-1 px-1">Select payment system:</h4>
                  
                  {/* Bangladesh Local Wallets */}
                  <div className="flex flex-col gap-2 bg-white/5 p-3 rounded-2xl border border-white/10">
                    <span className="text-[8px] uppercase tracking-widest text-slate-400 font-bold px-1">Bangladesh Mobile Wallets</span>
                    <div className="grid grid-cols-3 gap-2 mt-1">
                      <button 
                        onClick={() => handleSelectGateway('bKash')}
                        className="bg-[#E2125D] hover:scale-105 transition active:scale-95 text-white font-black text-xs py-2 rounded-xl text-center shadow"
                      >
                        bKash
                      </button>
                      <button 
                        onClick={() => handleSelectGateway('Nagad')}
                        className="bg-[#F05A24] hover:scale-105 transition active:scale-95 text-white font-black text-xs py-2 rounded-xl text-center shadow"
                      >
                        Nagad
                      </button>
                      <button 
                        onClick={() => handleSelectGateway('Rocket')}
                        className="bg-[#8C2381] hover:scale-105 transition active:scale-95 text-white font-black text-xs py-2 rounded-xl text-center shadow"
                      >
                        Rocket
                      </button>
                    </div>
                  </div>

                  {/* Global Gateways */}
                  <div className="flex flex-col gap-2 bg-white/5 p-3 rounded-2xl border border-white/10">
                    <span className="text-[8px] uppercase tracking-widest text-slate-400 font-bold px-1">Global Payment Gateways</span>
                    <div className="grid grid-cols-2 gap-2 mt-1">
                      <button 
                        onClick={() => handleSelectGateway('Stripe')}
                        className="bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow"
                      >
                        <CreditCard className="w-3.5 h-3.5" /> Stripe Card
                      </button>
                      <button 
                        onClick={() => handleSelectGateway('PayPal')}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 rounded-xl flex items-center justify-center gap-1.5 shadow"
                      >
                        PayPal
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 2. BANGLADESH WALLET MOBILE NUMBER & OTP GATE */}
              {modalStage === 'mobile_otp' && (
                <form onSubmit={handleMobileSubmit} className="flex flex-col gap-3 text-left">
                  <div className="flex items-center gap-1.5 text-xs text-yellow-400 font-bold mb-1 uppercase tracking-wider">
                    <Smartphone className="w-4 h-4" />
                    <span>{paymentMethod} Gateway Simulator</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-slate-300 text-[10px] font-bold">Enter {paymentMethod} Account Number:</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 017XXXXXXXX"
                      required
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="bg-[#090909] border border-white/10 text-white rounded-xl p-2 px-3 text-xs outline-none"
                    />
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-slate-300 text-[10px] font-bold">One Time Password (OTP) - Auto sent:</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 129038"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="bg-[#090909] border border-white/10 text-white rounded-xl p-2 px-3 text-xs outline-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full mt-3 bg-gradient-to-r from-[#FF007A] to-[#8E2DE2] text-white py-2 rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-1 hover:scale-105 active:scale-95 transition"
                  >
                    <span>Proceed Next</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </form>
              )}

              {/* 3. BANGLADESH WALLET SECURE PIN CONFIRMATION */}
              {modalStage === 'pin_confirm' && (
                <form onSubmit={handlePinSubmit} className="flex flex-col gap-3 text-left">
                  <div className="text-center p-3">
                    <h4 className="text-white text-xs font-bold">Enter your Secure {paymentMethod} Wallet PIN</h4>
                    <p className="text-[9px] text-slate-400 mt-1">This is a fully isolated secure simulation. Your PIN is never recorded.</p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <input 
                      type="password" 
                      placeholder="••••"
                      maxLength={4}
                      required
                      value={pin}
                      onChange={(e) => setPin(e.target.value)}
                      className="bg-[#090909] border border-white/10 text-white text-center rounded-xl p-2 px-3 text-sm tracking-widest outline-none font-bold"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full mt-3 bg-gradient-to-r from-green-600 to-emerald-700 text-white py-2 rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-1 hover:scale-105 active:scale-95 transition"
                  >
                    <span>Confirm ৳{selectedPackage?.priceBDT} Payment</span>
                  </button>
                </form>
              )}

              {/* 4. STRIPE CREDIT CARD ENTRY GATE */}
              {modalStage === 'card_entry' && (
                <form onSubmit={handleCardSubmit} className="flex flex-col gap-3 text-left">
                  <div className="flex items-center gap-1.5 text-xs text-indigo-400 font-bold mb-1 uppercase tracking-wider">
                    <CreditCard className="w-4 h-4" />
                    <span>Stripe payment gateway</span>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-slate-300 text-[10px] font-bold">Card Number:</label>
                    <input 
                      type="text" 
                      placeholder="4111 2222 3333 4444"
                      required
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="bg-[#090909] border border-white/10 text-white rounded-xl p-2 px-3 text-xs outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-slate-300 text-[10px] font-bold">Expiry Date:</label>
                      <input 
                        type="text" 
                        placeholder="MM/YY"
                        required
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="bg-[#090909] border border-white/10 text-white rounded-xl p-2 px-3 text-xs outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-slate-300 text-[10px] font-bold">CVC / CVV:</label>
                      <input 
                        type="password" 
                        placeholder="•••"
                        maxLength={3}
                        required
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="bg-[#090909] border border-white/10 text-white rounded-xl p-2 px-3 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    className="w-full mt-3 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white py-2 rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-1 hover:scale-105 active:scale-95 transition"
                  >
                    <span>Pay ${selectedPackage?.price} via Stripe</span>
                  </button>
                </form>
              )}

              {/* 5. PAYPAL SIMULATOR */}
              {modalStage === 'paypal_entry' && (
                <form onSubmit={handlePaypalSubmit} className="flex flex-col gap-3 text-left">
                  <div className="text-center p-3">
                    <h4 className="text-blue-400 text-xs font-extrabold uppercase tracking-widest">PayPal Simulator</h4>
                    <p className="text-[9px] text-slate-400 mt-1">Sign in with PayPal to recharge immediately</p>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-slate-300 text-[10px] font-bold">Email Address:</label>
                    <input 
                      type="email" 
                      placeholder="yourname@domain.com"
                      required
                      value={paypalEmail}
                      onChange={(e) => setPaypalEmail(e.target.value)}
                      className="bg-[#090909] border border-white/10 text-white rounded-xl p-2 px-3 text-xs outline-none"
                    />
                  </div>

                  <button 
                    type="submit"
                    className="w-full mt-3 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl text-xs font-bold shadow-lg flex items-center justify-center gap-1 hover:scale-105 active:scale-95 transition"
                  >
                    <span>Pay ${selectedPackage?.price} via PayPal</span>
                  </button>
                </form>
              )}

              {/* 6. SUCCESS FEEDBACK */}
              {modalStage === 'success' && (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <motion.div 
                    initial={{ scale: 0.5, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', damping: 10 }}
                    className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center text-green-400 mb-4 border border-green-500/30"
                  >
                    <CheckCircle className="w-8 h-8" />
                  </motion.div>
                  <h3 className="text-white text-md font-bold">Recharge Transaction Success!</h3>
                  <p className="text-slate-400 text-[10px] mt-1.5 leading-relaxed">
                    We have successfully credited <span className="text-yellow-400 font-bold">{selectedPackage?.coins} Coins</span> into your Livo Wallet using {paymentMethod}.
                  </p>

                  <button 
                    onClick={handleFinish}
                    className="w-full mt-5 bg-gradient-to-r from-[#FF007A] to-[#8E2DE2] text-white py-2 rounded-xl text-xs font-bold shadow-lg"
                  >
                    Done & Return
                  </button>
                </div>
              )}

            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
