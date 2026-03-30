import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Smartphone, User, Landmark, CreditCard, Banknote, History,
  Search, CheckCircle, AlertCircle, RefreshCw, ArrowRight,
  ShieldCheck, Layers, Phone, Wallet, Plus, Send, ChevronRight,
  Building, Fingerprint, Receipt, TrendingUp
} from 'lucide-react';
import { dmtService } from '../../services/apiService';
import { dataService } from '../../services/dataService';
import { initSpeech, speak, announceSuccess, announceFailure, announceProcessing, announceWarning } from '../../services/speechService';
import logo from '../../assets/rupiksha_logo.png';

const NAVY = '#0f2557';
const NAVY2 = '#1a3a6b';
const NAVY3 = '#2257a8';

const DMT = () => {
  const [step, setStep] = useState('mobile'); // mobile | validate | ekyc | beneficiaries | transaction | success
  const [mobile, setMobile] = useState('');
  const [customerData, setCustomerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [selectedBene, setSelectedBene] = useState(null);
  const [amount, setAmount] = useState('');
  const [showAddBene, setShowAddBene] = useState(false);
  const [newBene, setNewBene] = useState({ name: '', accountNumber: '', ifsc: '', bankName: '' });
  const [otp, setOtp] = useState('');
  const [otpToken, setOtpToken] = useState('');
  const [txnOtp, setTxnOtp] = useState('');
  const [txnOtpToken, setTxnOtpToken] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [aadhaarToken, setAadhaarToken] = useState('');
  const [ekycStage, setEkycStage] = useState('aadhaar'); // aadhaar | otp | finish
  const [walletLimit, setWalletLimit] = useState(null);
  const [lastTx, setLastTx] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const currentUser = dataService.getCurrentUser();
    setUser(currentUser);
    initSpeech();
    if (currentUser?.id) {
       fetchWalletLimit(currentUser.id);
    }
  }, []);

  const fetchWalletLimit = async (userId) => {
    try {
      const res = await dmtService.walletLimit({ userId: userId }); 
      if (res.status === "SUCCESS") {
        setWalletLimit(res.data);
      }
    } catch (e) {
      console.error("Limit error", e);
    }
  };

  const handleValidateCustomer = async () => {
    if (mobile.length !== 10) {
      announceWarning("Please enter a valid 10-digit mobile number");
      return;
    }
    setLoading(true);
    try {
      const res = await dmtService.validateCustomer(mobile);
      if (res.status === "SUCCESS") {
        setCustomerData(res.data);
        fetchBeneficiaries(mobile);
        setStep('beneficiaries');
      } else if (
        res.status === "NOT_FOUND" || 
        res.code === "404" || 
        res.message?.toLowerCase().includes("not found") || 
        res.message?.toLowerCase().includes("not registered")
      ) {
        setStep('validate');
      } else {
        announceFailure(res.message || "Validation failed");
      }
    } catch (e) {
      announceFailure("Connection error");
    } finally {
      setLoading(false);
    }
  };

  const fetchBeneficiaries = async (mob) => {
    setLoading(true);
    try {
      const res = await dmtService.getAllBeneficiaries(mob);
      if (res.status === "SUCCESS") {
        setBeneficiaries(res.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRegistrationOtp = async () => {
    setLoading(true);
    try {
      const res = await dmtService.sendOtp(mobile);
      // Backend might return token in root OR within a data object
      const token = res.token || res.data?.token;

      if (token) {
        setOtpToken(token);
        speak("OTP sent successfully");
      } else if (res.status === "SUCCESS") {
        announceFailure("OTP sent but token was missing from response");
      } else {
        announceFailure(res.message || "Failed to send OTP");
      }
    } catch (e) {
      speak("Error sending OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyRegistrationOtp = async () => {
    if (!otp) { announceWarning("Enter OTP"); return; }
    setLoading(true);
    try {
      const res = await dmtService.verifyOtp(mobile, otp, otpToken);
      if (res.status === "SUCCESS") {
        speak("Mobile verified. Now proceed with Aadhaar Validation.");
        setStep('ekyc');
      } else {
        announceFailure(res.message);
      }
    } catch (e) {
      announceFailure("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAadhaarValidate = async () => {
    if (aadhaar.length !== 12) { announceWarning("Enter 12-digit Aadhaar"); return; }
    setLoading(true);
    try {
      const res = await dmtService.validateAadhaar(mobile, aadhaar, otpToken);
      if (res.status === "SUCCESS") {
        setAadhaarToken(res.token);
        setEkycStage('otp');
        speak("Aadhaar OTP sent");
      } else {
        announceFailure(res.message);
      }
    } catch (e) {
      announceFailure("Aadhaar validation failed");
    } finally {
      setLoading(false);
    }
  };

  const handlePerformEkyc = async () => {
    setLoading(true);
    try {
      const payload = {
        mobile: mobile,
        aadhaar: aadhaar,
        otp: otp,
        token: aadhaarToken
      };
      const res = await dmtService.performEkyc(payload);
      if (res.status === "SUCCESS") {
        speak("E-K-Y-C processing complete. You are now registered.");
        setStep('beneficiaries');
        fetchBeneficiaries(mobile);
      } else {
        announceFailure(res.message);
      }
    } catch (e) {
      announceFailure("EKYC failed");
    } finally {
      setLoading(false);
    }
  };

  const handleAddBeneficiary = async () => {
    if (!newBene.name || !newBene.accountNumber || !newBene.ifsc) {
      announceWarning("Please fill all details");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        mobile: mobile,
        beneName: newBene.name,
        bankAccount: newBene.accountNumber,
        bankName: newBene.bankName,
        ifsc: newBene.ifsc,
        partnerSubId: "RX" + Date.now()
      };
      const res = await dmtService.addBeneficiary(payload);
      if (res.status === "SUCCESS") {
        speak("Beneficiary added successfully");
        setShowAddBene(false);
        fetchBeneficiaries(mobile);
      } else {
        announceFailure(res.message);
      }
    } catch (e) {
      announceFailure("Error adding beneficiary");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAccount = async (bene) => {
    setLoading(true);
    announceProcessing("Verifying bank account...");
    try {
      const payload = {
        mobile: mobile,
        bankAccount: bene.bankAccount,
        ifsc: bene.ifsc,
        name: bene.beneName
      };
      const res = await dmtService.accountVerification(payload);
      if (res.status === "SUCCESS") {
        speak(`Account verified. Holder name is ${res.data.name || bene.beneName}`);
      } else {
        announceFailure(res.message);
      }
    } catch (e) {
      announceFailure("Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSendTransactionOtp = async () => {
    if (!amount || amount <= 0) { announceWarning("Enter valid amount"); return; }
    setLoading(true);
    try {
      const payload = {
        mobile: mobile,
        amount: amount,
        beneId: selectedBene.id
      };
      const res = await dmtService.sendTxnOtp(payload);
      if (res.status === "SUCCESS") {
        setTxnOtpToken(res.token);
        speak("Transaction O-T-P sent to your mobile");
      } else {
        announceFailure(res.message);
      }
    } catch (e) {
      announceFailure("Error sending transaction OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteTransaction = async () => {
    if (!txnOtp) { announceWarning("Enter transaction OTP"); return; }
    setLoading(true);
    announceProcessing("Executing money transfer...");
    try {
      const payload = {
        channel: "2",
        clientUniqueID: "TXN" + Date.now(),
        beneIFSCCode: selectedBene.ifsc,
        beneAccountNo: selectedBene.bankAccount,
        beneName: selectedBene.beneName,
        customerName: customerData?.name || "Customer",
        amount: amount,
        panNumber: "LRQPK5651R", 
        pinCode: "845418", 
        customerMobileNo: mobile,
        bankName: selectedBene.bankName,
        token: txnOtpToken,
        otp: txnOtp
      };
      const res = await dmtService.transaction(payload);
      if (res.status === "SUCCESS") {
        const txData = {
          txId: res.txnid || payload.clientUniqueID,
          amount: amount,
          bene: selectedBene.beneName,
          bank: selectedBene.bankName,
          date: new Date().toLocaleString()
        };
        setLastTx(txData);
        setStep('success');
        announceSuccess(amount);
        await dataService.logTransaction(user.id, 'DMT', amount, selectedBene.bankName, selectedBene.bankAccount, 'SUCCESS');
      } else {
        announceFailure(res.message || "Transaction failed");
      }
    } catch (e) {
      announceFailure("Transaction error");
    } finally {
      setLoading(false);
    }
  };

  const resetFlow = () => {
    setStep('mobile');
    setMobile('');
    setCustomerData(null);
    setBeneficiaries([]);
    setSelectedBene(null);
    setAmount('');
    setLastTx(null);
  };

  return (
    <div className="h-full bg-slate-50 overflow-y-auto font-['Inter']">


      <div className="max-w-7xl mx-auto p-6 md:p-8">
        <AnimatePresence mode="wait">
          {step === 'mobile' && (
            <motion.div key="landing" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto space-y-10 py-6">
              
              <div className="text-center space-y-3">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">DMT Service Hub</h2>
                <p className="text-sm text-slate-500 font-medium">Domestic Money Transfer & Instant KYC Enrollment</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Option 1: KYC Enrollment (Primary) */}
                <motion.div 
                  whileHover={{ y: -8, scale: 1.02 }}
                  onClick={() => setStep('mobile_kyc')}
                  className="group relative h-96 bg-gradient-to-br from-emerald-600 to-emerald-800 rounded-[3rem] p-10 text-white shadow-2xl shadow-emerald-200 cursor-pointer overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-white/20 transition-all" />
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-3xl flex items-center justify-center border border-white/20 shadow-xl shadow-emerald-900/20">
                      <ShieldCheck size={40} className="text-white" />
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-emerald-200 uppercase tracking-[0.4em]">Mandatory Enrollment</span>
                        <h3 className="text-3xl font-black tracking-tight leading-none uppercase">NEW CUSTOMER<br/>KYC (ADHAAR)</h3>
                      </div>
                      <p className="text-xs text-blue-50/80 font-medium leading-relaxed uppercase">
                        Start here for new customers. Complete Aadhaar-based KYC to enable 24/7 instant bank transfers for any mobile number.
                      </p>
                      <div className="flex items-center gap-3 pt-4">
                        <div className="px-6 py-4 bg-white text-emerald-700 rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl">START ENROLLMENT</div>
                        <ArrowRight size={24} className="text-emerald-300 group-hover:translate-x-2 transition-all" />
                      </div>
                    </div>
                  </div>
                </motion.div>

                {/* Option 2: Existing Transaction */}
                <motion.div 
                  whileHover={{ y: -8, scale: 1.02 }}
                  onClick={() => setStep('mobile_tx')}
                  className="group relative h-96 bg-white rounded-[3rem] p-10 text-slate-900 shadow-2xl shadow-slate-200/50 border border-slate-100 cursor-pointer overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl group-hover:bg-blue-100 transition-all pointer-events-none" />
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="w-20 h-20 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-2xl shadow-slate-200">
                      <Send size={40} />
                    </div>
                    <div className="space-y-4">
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.4em]">Member Service</span>
                        <h3 className="text-3xl font-black tracking-tight leading-none uppercase">EXISTING<br/>TRANSFER</h3>
                      </div>
                      <p className="text-xs text-slate-500 font-medium leading-relaxed uppercase">
                        Already completed KYC? Direct send money to saved beneficiaries instantly. High limits and real-time status updates.
                      </p>
                      <div className="flex items-center gap-3 pt-4">
                        <div className="px-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl">SEND MONEY</div>
                        <ArrowRight size={24} className="text-slate-300 group-hover:translate-x-2 transition-all hover:text-slate-900" />
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              {/* Service Stats Bar */}
              <div className="bg-white rounded-[2.5rem] border border-slate-100 p-8 shadow-sm grid grid-cols-2 md:grid-cols-4 gap-8">
                <div className="text-center space-y-1">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">IMPS Status</p>
                  <p className="text-xs font-black text-emerald-600 flex items-center justify-center gap-1 uppercase"><div className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" /> Live & Stable</p>
                </div>
                <div className="text-center space-y-1 border-l border-slate-50 pl-8 md:pl-0">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Avg Speed</p>
                  <p className="text-xs font-black text-slate-900 uppercase">Instant Transfer</p>
                </div>
                <div className="text-center space-y-1 border-l border-slate-50 pl-8 md:pl-0 hidden md:block">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Commission</p>
                  <p className="text-xs font-black text-blue-600 uppercase">Best Margin</p>
                </div>
                <div className="text-center space-y-1 border-l border-slate-50 pl-8 md:pl-0 hidden md:block">
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Escrow</p>
                  <p className="text-xs font-black text-emerald-600 uppercase">NPCI Secured</p>
                </div>
              </div>
            </motion.div>
          )}

          {(step === 'mobile_kyc' || step === 'mobile_tx') && (
            <motion.div key="mobile_entry" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -30 }}
              className="max-w-xl mx-auto bg-white rounded-[3rem] border border-slate-200 p-10 md:p-14 shadow-[0_32px_128px_rgba(0,0,0,0.08)] relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-50/50 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
              
              <div className="relative z-10 space-y-10">
                <div className="text-center space-y-3">
                  <div className={`w-24 h-24 ${step === 'mobile_kyc' ? 'bg-emerald-600 shadow-emerald-200' : 'bg-slate-900 shadow-slate-200'} rounded-[2.5rem] mx-auto flex items-center justify-center text-white shadow-2xl mb-8`}>
                    {step === 'mobile_kyc' ? <Fingerprint size={48} /> : <Smartphone size={48} />}
                  </div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none uppercase">{step === 'mobile_kyc' ? 'KYC Enrollment' : 'Enter Member Mobile'}</h2>
                  <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{step === 'mobile_kyc' ? 'Register New Customer via Aadhaar' : 'Initiate Money Transfer'}</p>
                </div>

                <div className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Verified Mobile Number</label>
                    <div className="relative">
                      <Phone size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input 
                        type="text" 
                        maxLength={10} 
                        value={mobile} 
                        onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                        placeholder="0000 000 000"
                        className="w-full pl-16 pr-6 py-8 rounded-[2rem] border-2 border-slate-100 bg-slate-50 text-slate-900 font-black text-2xl outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner placeholder:text-slate-200"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    <button 
                      onClick={handleValidateCustomer} 
                      disabled={loading || mobile.length < 10}
                      className={`w-full py-6 rounded-[1.5rem] ${step === 'mobile_kyc' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-100' : 'bg-slate-900 hover:bg-black shadow-slate-100'} text-white font-black text-sm uppercase tracking-[0.3em] shadow-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-4`}
                    >
                      {loading ? <RefreshCw className="animate-spin" size={24} /> : <>VERIFY & PROCEED <ArrowRight size={24} /></>}
                    </button>
                    
                    <button onClick={() => setStep('mobile')} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600 transition-all">Cancel Enrollment</button>
                  </div>
                </div>

                {step === 'mobile_kyc' && (
                  <div className="p-6 rounded-[2rem] bg-emerald-50 border-2 border-emerald-100 flex items-start gap-4">
                    <ShieldCheck className="text-emerald-600 shrink-0 mt-0.5" size={20} />
                    <p className="text-[10px] font-black text-emerald-800 leading-relaxed uppercase">
                      New customers must provide Aadhaar-linked mobile for one-time KYC. It takes less than 2 minutes.
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 'validate' && (
            <motion.div key="validate" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
              className="max-w-2xl mx-auto space-y-6">
              <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-xl">
                <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-600 border border-amber-100">
                    <Fingerprint size={28} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">KYC & Registration</h2>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Enroll Mobile: {mobile}</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="p-8 rounded-[2rem] bg-amber-50 border border-amber-100 flex items-start gap-5">
                    <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-amber-600 shadow-sm shrink-0">
                      <AlertCircle size={24} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight">KYC Enrollment Required</h4>
                      <p className="text-[10px] font-bold text-amber-700/80 leading-relaxed uppercase mt-1">
                        This number is not yet verified for domestic money transfers. To proceed, please verify mobile ownership and complete Aadhaar-based KYC.
                      </p>
                    </div>
                  </div>

                  <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 space-y-6">
                    <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-4">
                      <div className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-[8px]">01</div>
                      <span>Step 1: Mobile Ownership Proof</span>
                    </div>

                    <div className="flex gap-4">
                      <button onClick={() => setStep('mobile')} className="flex-1 py-4 rounded-2xl bg-white border border-slate-200 text-slate-400 font-black text-xs uppercase tracking-widest">Back</button>
                      <button onClick={handleSendRegistrationOtp} className="flex-[2] py-4 rounded-2xl bg-blue-600 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-blue-100 hover:bg-slate-900 transition-all">Send OTP to {mobile}</button>
                    </div>

                    {otpToken && (
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4 pt-6 mt-4 border-t-2 border-dashed border-slate-200">
                        <div className="space-y-1.5">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1 text-center">Enter 6-Digit OTP</label>
                          <input 
                            type="text" 
                            maxLength={6} 
                            value={otp} 
                            onChange={e => setOtp(e.target.value)}
                            className="w-full px-4 py-6 rounded-2xl border-2 border-blue-500 bg-white text-center text-4xl font-black tracking-[0.5em] focus:shadow-2xl focus:shadow-blue-200/50 transition-all outline-none" 
                            placeholder="XXXXXX"
                          />
                        </div>
                        <button onClick={handleVerifyRegistrationOtp} className="w-full py-6 rounded-2xl bg-emerald-600 text-white font-black text-sm uppercase tracking-widest shadow-2xl shadow-emerald-100 hover:bg-emerald-700 transition-all">Verify & Proceed to KYC</button>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'ekyc' && (
            <motion.div key="ekyc" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl mx-auto bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-2xl space-y-8">
              <div className="text-center space-y-2">
                <div className="w-20 h-20 bg-emerald-600 rounded-3xl mx-auto flex items-center justify-center text-white shadow-xl mb-6">
                  <ShieldCheck size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Aadhaar Verification</h2>
                <p className="text-sm text-slate-500 font-medium">Verify your identity to enable DMT services</p>
              </div>

              {ekycStage === 'aadhaar' ? (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Aadhaar Number</label>
                    <input 
                      type="text" maxLength={12} value={aadhaar} 
                      onChange={e => setAadhaar(e.target.value.replace(/\D/g, ''))}
                      placeholder="XXXX-XXXX-XXXX"
                      className="w-full px-6 py-5 rounded-2xl border-2 border-slate-100 bg-slate-50 text-slate-900 font-black text-2xl text-center outline-none focus:border-emerald-500 transition-all"
                    />
                  </div>
                  <button onClick={handleAadhaarValidate} className="w-full py-5 rounded-2xl bg-slate-900 text-white font-black text-sm uppercase tracking-widest shadow-xl">Get Aadhaar OTP</button>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Enter Aadhaar OTP</label>
                    <input 
                      type="text" maxLength={6} value={otp} 
                      onChange={e => setOtp(e.target.value)}
                      className="w-full px-6 py-5 rounded-2xl border-2 border-emerald-500 bg-emerald-50 text-slate-900 font-black text-3xl text-center tracking-[0.5em] outline-none"
                    />
                  </div>
                  <button onClick={handlePerformEkyc} className="w-full py-5 rounded-2xl bg-emerald-600 text-white font-black text-sm uppercase tracking-widest shadow-xl">Complete KYC</button>
                </div>
              )}
            </motion.div>
          )}

          {step === 'beneficiaries' && (
            <motion.div key="beneficiaries" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-8">
              
              <div className="space-y-8">
                {/* Customer Summary */}
                <div className="bg-slate-900 text-white rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full -mr-40 -mt-40 blur-3xl pointer-events-none" />
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                    <div className="flex items-center gap-6">
                      <div className="w-20 h-20 rounded-3xl bg-blue-600 flex items-center justify-center text-white shadow-2xl shadow-blue-900">
                        <User size={40} />
                      </div>
                      <div>
                        <h2 className="text-3xl font-black tracking-tight">{customerData?.name || "Member Registered"}</h2>
                        <div className="flex items-center gap-2 mt-2">
                          <Phone size={14} className="text-blue-400" />
                          <p className="text-sm font-black text-blue-400 uppercase tracking-[0.2em]">{mobile}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-8 bg-white/5 backdrop-blur-xl rounded-[2rem] p-6 border border-white/10">
                      <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Transfer Limit</p>
                        <p className="text-xl font-black tracking-tighter text-emerald-400 text-center">₹{walletLimit?.monthly_limit || "25,000"}</p>
                      </div>
                      <div className="border-l border-white/10 pl-8">
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 text-center">Available</p>
                        <p className="text-xl font-black tracking-tighter text-white text-center">₹{walletLimit?.remaining_limit || "25,000"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Beneficiary List */}
                <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm space-y-8">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 leading-none">Beneficiaries</h3>
                      <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-2">Manage your money transfer recipients</p>
                    </div>
                    <button onClick={() => setShowAddBene(true)} 
                      className="flex items-center gap-3 px-6 py-4 rounded-2xl bg-blue-600 text-white font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl shadow-blue-100">
                      <Plus size={20} /> Add New
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {beneficiaries.length === 0 ? (
                      <div className="col-span-2 py-16 text-center bg-slate-50 rounded-[3rem] border-2 border-dashed border-slate-200">
                        <div className="w-20 h-20 bg-white rounded-full mx-auto flex items-center justify-center text-slate-200 mb-6 shadow-sm">
                          <User size={40} />
                        </div>
                        <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">No saved beneficiaries</p>
                      </div>
                    ) : beneficiaries.map((bene, idx) => (
                      <motion.div 
                        key={idx} 
                        whileHover={{ y: -6 }}
                        className="group p-8 rounded-[2.5rem] border-2 border-slate-50 bg-white hover:border-blue-600 hover:shadow-2xl hover:shadow-blue-200/50 transition-all relative overflow-hidden"
                      >
                        <div className="flex flex-col gap-6 relative z-10">
                          <div className="flex items-start justify-between">
                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-sm">
                              <Building size={24} />
                            </div>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleVerifyAccount(bene); }}
                              className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 hover:text-white transition-all"
                            >
                              Verify
                            </button>
                          </div>
                          <div onClick={() => { setSelectedBene(bene); setStep('transaction'); }} className="cursor-pointer space-y-1">
                            <h4 className="text-base font-black text-slate-900 uppercase group-hover:text-blue-600 transition-colors">{bene.beneName}</h4>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight">{bene.bankName}</p>
                            <p className="text-sm font-black text-slate-900 tracking-tight">{bene.bankAccount}</p>
                          </div>
                          <div onClick={() => { setSelectedBene(bene); setStep('transaction'); }} className="cursor-pointer flex items-center justify-between pt-6 border-t border-slate-50 group-hover:border-blue-50">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Send Money</span>
                            <ArrowRight size={18} className="text-blue-600 group-hover:translate-x-2 transition-all" />
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-8">
                <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-sm">
                  <h3 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-8 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-emerald-500" /> Secure Gateway
                  </h3>
                  <div className="space-y-6">
                    {[
                      { step: "01", text: "Verify recipient name using Penny Drop verification." },
                      { step: "02", text: "IMPS transfers are instant and available 24x7." },
                      { step: "03", text: "Ensure your mobile has network for transaction OTP." }
                    ].map((item, i) => (
                      <div key={i} className="flex gap-4">
                        <span className="text-xs font-black text-blue-600 bg-blue-50 w-8 h-8 rounded-lg flex items-center justify-center shrink-0">{item.step}</span>
                        <p className="text-[11px] font-bold text-slate-500 leading-relaxed uppercase">{item.text}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-blue-800 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
                  <h4 className="text-xl font-black leading-tight relative z-10">Wallet Limits</h4>
                  <div className="mt-6 space-y-4 relative z-10">
                    <div>
                      <div className="flex justify-between text-[10px] font-black text-blue-200 uppercase mb-2">
                        <span>Used</span>
                        <span>{(walletLimit?.monthly_limit - walletLimit?.remaining_limit) || 0} / {walletLimit?.monthly_limit || 25000}</span>
                      </div>
                      <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${((walletLimit?.monthly_limit - walletLimit?.remaining_limit) / walletLimit?.monthly_limit) * 100 || 10}%` }} className="h-full bg-blue-400" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'transaction' && (
            <motion.div key="transaction" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-[1fr_360px] gap-10">
              
              <div className="bg-white rounded-[3rem] border border-slate-200 p-10 shadow-2xl space-y-10">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-blue-100">
                    <Send size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 tracking-tight">Financial Transfer</h2>
                    <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mt-1">Recipient: {selectedBene?.beneName}</p>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="p-8 rounded-[2.5rem] bg-slate-50 border border-slate-100 grid grid-cols-2 gap-8">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Account Number</p>
                      <p className="text-base font-black text-slate-900 mt-2">{selectedBene?.bankAccount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Bank / IFSC</p>
                      <p className="text-base font-black text-slate-900 mt-2 uppercase">{selectedBene?.bankName} / {selectedBene?.ifsc}</p>
                    </div>
                  </div>

                  {!txnOtpToken ? (
                    <div className="space-y-6">
                      <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest block ml-2">Transfer Amount (INR)</label>
                        <div className="relative">
                          <span className="absolute left-8 top-1/2 -translate-y-1/2 text-5xl font-black text-slate-200 tracking-tighter">₹</span>
                          <input 
                            type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00"
                            className="w-full pl-20 pr-8 py-10 rounded-[2.5rem] border-2 border-slate-100 bg-slate-50 text-slate-900 font-black text-6xl outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner placeholder:text-slate-200"
                          />
                        </div>
                      </div>
                      <button 
                        onClick={handleSendTransactionOtp} disabled={loading || !amount || amount <= 0}
                        className="w-full py-6 rounded-[1.5rem] bg-slate-900 text-white font-black text-sm uppercase tracking-[0.2em] shadow-xl hover:bg-black transition-all disabled:opacity-50"
                      >
                        {loading ? <RefreshCw className="animate-spin mx-auto" /> : 'GENERATE TRANSACTION OTP'}
                      </button>
                    </div>
                  ) : (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
                      <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex items-center gap-4">
                        <AlertCircle className="text-blue-600" size={24} />
                        <p className="text-sm font-bold text-blue-700">Enter the 6-digit verification code sent to {mobile}.</p>
                      </div>
                      <div className="space-y-3">
                        <input 
                          type="text" maxLength={6} value={txnOtp} onChange={e => setTxnOtp(e.target.value)}
                          placeholder="XXXXXX"
                          className="w-full py-8 rounded-[1.5rem] border-2 border-blue-500 bg-white text-slate-900 font-black text-5xl text-center tracking-[0.6em] outline-none"
                        />
                      </div>
                      <button 
                        onClick={handleExecuteTransaction} disabled={loading || txnOtp.length < 6}
                        className="w-full py-6 rounded-[1.5rem] bg-emerald-600 text-white font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-emerald-200 hover:bg-emerald-700 transition-all"
                      >
                        {loading ? <RefreshCw className="animate-spin mx-auto" strokeWidth={3} /> : 'CONFIRM & EXECUTE TRANSFER'}
                      </button>
                    </motion.div>
                  )}
                  
                  <button onClick={() => setStep('beneficiaries')} className="w-full py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-rose-500 transition-all">Cancel and Return</button>
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-white rounded-[2.5rem] border border-slate-200 p-8 shadow-sm">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Transfer Summary</h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center text-xs font-bold border-b border-slate-50 pb-3">
                      <span className="text-slate-400">AMOUNT</span>
                      <span className="text-slate-900 font-black">₹{amount || 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold border-b border-slate-50 pb-3">
                      <span className="text-slate-400">CHARGES</span>
                      <span className="text-slate-900 font-black">₹{amount > 0 ? (amount > 1000 ? 10 : 5) : 0}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs font-bold pt-1">
                      <span className="text-slate-400">TOTAL PAYABLE</span>
                      <span className="text-lg font-black text-blue-600">₹{amount > 0 ? (Number(amount) + (amount > 1000 ? 10 : 5)) : 0}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 rounded-[2.5rem] bg-emerald-50 border-2 border-emerald-100 space-y-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center text-white shrink-0">
                      <ShieldCheck size={20} />
                    </div>
                    <div>
                      <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest">NPCI Safe Pay</p>
                      <p className="text-[8px] font-bold text-emerald-600/80 uppercase mt-0.5">End-to-End Encrypted</p>
                    </div>
                  </div>
                  <p className="text-[9px] font-bold text-emerald-700/60 leading-relaxed uppercase">
                    Your money is protected by Rupiksha's Multi-Layer Security and RBI compliant Escrow architecture.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div key="success" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="relative flex flex-col items-center justify-center min-h-[70vh] py-10">
              <div className="absolute inset-0 pointer-events-none"
                style={{ background: 'radial-gradient(circle at 50% 30%, rgba(16,185,129,0.12) 0%, transparent 60%)' }} />
              
              <div className="relative mb-12">
                <motion.div initial={{ scale: 0.15, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-white shadow-2xl shadow-emerald-200 relative z-10">
                  <CheckCircle size={64} strokeWidth={2.5} />
                </motion.div>
                <div className="absolute inset-0 bg-emerald-400 blur-3xl opacity-20 scale-150 animate-pulse rounded-full" />
              </div>

              <div className="text-center space-y-2 mb-10 relative z-10">
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.4em]">Transfer Successful</p>
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">₹{Number(lastTx?.amount).toLocaleString('en-IN')} Sent</h2>
                <p className="text-sm text-slate-500 font-medium max-w-xs mx-auto">Sent to {lastTx?.bene} at {lastTx?.bank}</p>
              </div>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                className="w-full max-w-sm bg-white rounded-[2.5rem] border border-slate-100 shadow-2xl overflow-hidden mb-10">
                <div className="p-8 space-y-4">
                  <div className="flex justify-between items-center text-xs font-bold">
                    <span className="text-slate-400 uppercase tracking-widest text-[9px]">Trans ID</span>
                    <span className="text-slate-900 font-black">{lastTx?.txId}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold border-t border-slate-50 pt-4">
                    <span className="text-slate-400 uppercase tracking-widest text-[9px]">Date & Time</span>
                    <span className="text-slate-900 font-black">{lastTx?.date}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs font-bold border-t border-slate-50 pt-4">
                    <span className="text-slate-400 uppercase tracking-widest text-[9px]">Status</span>
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-600 text-[8px] font-black uppercase">Completed</span>
                  </div>
                </div>
                <div className="bg-slate-50 px-8 py-6 border-t border-slate-100">
                  <button onClick={resetFlow} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">New Transfer</button>
                  <button onClick={() => window.print()} className="w-full py-4 mt-2 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-blue-600 transition-all flex items-center justify-center gap-2">
                    <Receipt size={14} /> Print Receipt
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Add Beneficiary Modal */}
      <AnimatePresence>
        {showAddBene && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowAddBene(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-md" 
            />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-slate-100">
              <div className="bg-slate-900 text-white px-8 py-6 flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-black leading-none uppercase tracking-tighter">Add Beneficiary</h3>
                  <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">Recipient Account Details</p>
                </div>
                <button onClick={() => setShowAddBene(false)} className="text-slate-400 hover:text-white transition-colors">
                  <Plus size={24} className="rotate-45" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Account Holder Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" value={newBene.name} onChange={e => setNewBene({...newBene, name: e.target.value.toUpperCase()})}
                        placeholder="John Doe" className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Bank Account Number</label>
                    <div className="relative">
                      <CreditCard size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input type="text" value={newBene.accountNumber} onChange={e => setNewBene({...newBene, accountNumber: e.target.value})}
                        placeholder="Account Number" className="w-full pl-12 pr-4 py-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">IFSC Code</label>
                      <input type="text" value={newBene.ifsc} onChange={e => setNewBene({...newBene, ifsc: e.target.value.toUpperCase()})}
                        placeholder="SBIN000XXXX" className="w-full px-4 py-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block ml-1">Bank Name</label>
                      <input type="text" value={newBene.bankName} onChange={e => setNewBene({...newBene, bankName: e.target.value.toUpperCase()})}
                        placeholder="e.g. SBI" className="w-full px-4 py-4 rounded-xl border-2 border-slate-100 bg-slate-50 font-bold" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button onClick={() => setShowAddBene(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">Cancel</button>
                  <button onClick={handleAddBeneficiary} disabled={loading}
                    className="flex-[2] py-4 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-200">
                    {loading ? <RefreshCw className="animate-spin mx-auto" size={20} /> : 'ADD BENEFICIARY'}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default DMT;
