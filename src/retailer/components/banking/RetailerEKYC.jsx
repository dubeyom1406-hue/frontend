import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, CheckCircle2, Smartphone, Store, ChevronRight, Camera, User, MapPin, FileUp, ArrowLeft, Fingerprint, Lock, Shield } from 'lucide-react';
import { dataService } from '../../../services/dataService';

const RetailerEKYC = ({ user, onComplete }) => {
    // Current Step: 1: Personal, 2: Shop/Address, 3: Documents, 4: Success
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);

    // Verification States
    const [verifyingAadhaar, setVerifyingAadhaar] = useState(false); // UI state for verification flow
    const [verificationStep, setVerificationStep] = useState('input'); // input | scanning | otp | verified
    const [otpValue, setOtpValue] = useState('');
    const [aadhaarData, setAadhaarData] = useState(null);
    const [pidData, setPidData] = useState(null);

    const [details, setDetails] = useState({
        firstName: '',
        lastName: '',
        emailId: user?.email || '',
        merchantPhoneNumber: user?.mobile || '',
        aadhaarNumber: user?.aadhaar || '',
        userPan: '',
        gstinNumber: '',
        companyBankName: '',
        bankAccountName: '',
        companyBankAccountNumber: '',
        bankIfscCode: '',
        merchantState: '',
        merchantCityName: '',
        merchantAddress1: '',
        companyLegalName: '',
        merchantPinCode: '',
    });

    const [verifiedNames, setVerifiedNames] = useState({ pan: '', aadhaar: '' });

    // --- Aadhaar Biometric Flow ---
    const startAadhaarVerification = () => {
        if (details.aadhaarNumber.length !== 12) {
            alert("Enter valid 12-digit Aadhaar");
            return;
        }
        setSubmitting(true);
        setTimeout(() => {
            const dummyData = {
                firstName: "DUMMY",
                lastName: "USER",
                merchantAddress1: "Sector 62, Noida, Uttar Pradesh - 201301",
                merchantCityName: "Noida",
                merchantState: "Uttar Pradesh",
                merchantPinCode: "201301"
            };
            setAadhaarData(dummyData);
            setDetails(prev => ({
                ...prev,
                firstName: dummyData.firstName,
                lastName: dummyData.lastName,
                merchantAddress1: dummyData.merchantAddress1,
                merchantCityName: dummyData.merchantCityName,
                merchantState: dummyData.merchantState,
                merchantPinCode: dummyData.merchantPinCode
            }));
            setVerifiedNames(prev => ({ ...prev, aadhaar: `${dummyData.firstName} ${dummyData.lastName}` }));
            setVerificationStep('verified');
            setSubmitting(false);
        }, 1500);
    };

    const handleOtpVerify = async () => {
        if (otpValue.length !== 6) return;
        setSubmitting(true);
        try {
            const res = await dataService.verifyAadhaarBiometricOtp(details.aadhaarNumber, otpValue);
            if (res.success) {
                const data = res.data;
                setAadhaarData(data);
                const nameParts = (data.name || '').split(' ');
                setDetails(prev => ({
                    ...prev,
                    firstName: nameParts[0] || '',
                    lastName: nameParts.slice(1).join(' ') || '',
                    merchantAddress1: data.address || prev.merchantAddress1,
                    merchantCityName: data.city || prev.merchantCityName,
                    merchantState: data.state || prev.merchantState,
                    merchantPinCode: data.pincode || prev.merchantPinCode
                }));
                setVerifiedNames(prev => ({ ...prev, aadhaar: data.name }));
                setVerificationStep('verified');
            } else {
                alert(res.message || "Invalid OTP");
            }
        } finally {
            setSubmitting(false);
        }
    };

    const verifyPan = async (pan) => {
        if (pan.length === 10) {
            try {
                const res = await dataService.verifyPAN(pan);
                if (res.success) {
                    setVerifiedNames(prev => ({ ...prev, pan: res.name }));
                    const nameParts = (res.name || '').split(' ');
                    setDetails(prev => ({ 
                        ...prev, 
                        firstName: nameParts[0] || prev.firstName,
                        lastName: nameParts.slice(1).join(' ') || prev.lastName
                    }));
                } else {
                    setVerifiedNames(prev => ({ ...prev, pan: '' }));
                }
            } catch (err) {
                console.error("PAN Verification failed", err);
            }
        }
    };

    const validateStep1 = () => {
        if (verificationStep !== 'verified') {
            alert("Please verify your Aadhaar first");
            return false;
        }
        if (!details.firstName || !details.lastName || !details.merchantPhoneNumber || !details.emailId || !details.userPan) {
            alert("Fill all Personal & ID details");
            return false;
        }
        return true;
    };

    const validateStep2 = () => {
        if (!details.companyBankName || !details.bankAccountName || !details.companyBankAccountNumber || !details.bankIfscCode) {
            alert("Fill all Bank details");
            return false;
        }
        return true;
    };

    const validateStep3 = () => {
        if (!details.companyLegalName || !details.merchantAddress1 || !details.merchantCityName || !details.merchantState || !details.merchantPinCode) {
            alert("Fill all Shop & Address details");
            return false;
        }
        return true;
    };

    const handleSubmitKyc = async () => {
        setSubmitting(true);
        try {
            const res = await dataService.submitAepsKyc(user.id, { 
                ...details, 
                username: user.username,
                merchantPhoneNumber: details.merchantPhoneNumber,
                // Duplicate fields for the specific fingpay mapping in dataService
                shopAddress: details.merchantAddress1,
                shopCity: details.merchantCityName,
                shopState: details.merchantState,
                shopPincode: details.merchantPinCode
            });
            if (res.status || res.success) {
                setStep(5);
                setTimeout(() => { if (onComplete) onComplete(); }, 3000);
            } else {
                alert(res.message || "KYC submission failed");
            }
        } catch (err) {
            alert("Failed to submit KYC. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    const Stepper = () => {
        const steps = ["Personal", "Bank", "Store", "Done"];
        return (
            <div className="flex justify-between items-center mb-10 px-4">
                {steps.map((s, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 relative">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${i < step ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                            {i + 1 < step ? <CheckCircle2 size={14} /> : i + 1}
                        </div>
                        <span className={`text-[8px] font-black uppercase tracking-tighter ${i < step ? 'text-slate-800' : 'text-slate-300'}`}>{s}</span>
                        {i < steps.length - 1 && (
                            <div className={`absolute left-9 top-4 w-12 md:w-20 h-0.5 ${i + 1 < step ? 'bg-slate-900' : 'bg-slate-100'}`} />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    const states = [
        "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Goa", "Gujarat", "Haryana", 
        "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", 
        "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", 
        "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal"
    ];

    return (
        <div className="fixed inset-0 z-[2000] bg-slate-900/60 backdrop-blur-xl flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0.9, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white rounded-[2.5rem] shadow-2xl p-8 w-full max-w-3xl border border-slate-200 overflow-y-auto max-h-[95vh]">
                {/* NOTICE SECTION */}
                <div className="mb-8 p-4 bg-amber-50 rounded-3xl border-2 border-amber-100 flex gap-4 items-start">
                    <Shield className="text-amber-600 mt-1" size={24} />
                    <div className="space-y-1">
                        <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Notice</h4>
                        <p className="text-[11px] text-amber-700 font-bold leading-relaxed">
                            Please complete your KYC (Know Your Customer) verification at your shop or company office. 
                            Transactions may be blocked if your registered address does not match your current location. 
                            Thank you for your cooperation.
                        </p>
                    </div>
                </div>

                {step < 4 && <Stepper />}

                <AnimatePresence mode="wait">
                    {/* STEP 1: PERSONAL & ID */}
                    {step === 1 && (
                        <motion.div key="step1" className="space-y-6">
                            <div className="text-center space-y-1">
                                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Personal & ID Details</h2>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1 md:col-span-2 bg-slate-50 p-6 rounded-[2rem] border-2 border-slate-100 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 px-4 py-1 bg-indigo-600 text-white text-[8px] font-black uppercase tracking-widest rounded-bl-xl">Secure Verification</div>
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Aadhar Number</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            maxLength={12}
                                            readOnly={verificationStep === 'verified'}
                                            value={details.aadhaarNumber}
                                            onChange={e => setDetails({ ...details, aadhaarNumber: e.target.value.replace(/\D/g, '') })}
                                            className="flex-1 px-4 py-4 bg-white border-2 border-slate-100 rounded-2xl font-black text-xl tracking-[0.2em] outline-none text-slate-900 focus:border-slate-900 transition-all"
                                            placeholder="0000 0000 0000"
                                        />
                                        {verificationStep === 'input' && (
                                            <button onClick={startAadhaarVerification} className="px-6 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200">
                                                <Fingerprint size={14} /> Verify
                                            </button>
                                        )}
                                        {verificationStep === 'verified' && (
                                            <div className="px-4 py-4 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center gap-2"><CheckCircle2 size={18} /><span className="text-[10px] font-black uppercase">Verified</span></div>
                                        )}
                                    </div>

                                    {verificationStep === 'otp' && (
                                        <div className="mt-4 space-y-3 p-5 bg-indigo-50/50 rounded-[2rem] border-2 border-indigo-100 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <Smartphone className="text-indigo-600" size={16} />
                                                    <p className="text-[10px] font-black text-indigo-700 uppercase tracking-widest text-left">OTP Verification</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    maxLength={6}
                                                    value={otpValue}
                                                    onChange={e => setOtpValue(e.target.value.replace(/\D/g, ''))}
                                                    className="flex-1 px-4 py-4 bg-white border-2 border-indigo-200 rounded-2xl font-black text-2xl text-center tracking-[0.5em] outline-none text-slate-900 focus:border-indigo-600 transition-all shadow-inner"
                                                    placeholder="000000"
                                                />
                                                <button onClick={handleOtpVerify} disabled={submitting || otpValue.length !== 6} className="px-8 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 disabled:opacity-50 active:scale-95">{submitting ? 'Authenticating...' : 'Verify'}</button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">First Name</label>
                                    <input type="text" value={details.firstName} onChange={e => setDetails({ ...details, firstName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm text-slate-900 focus:border-slate-900 outline-none transition-all" placeholder="First Name" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Last Name</label>
                                    <input type="text" value={details.lastName} onChange={e => setDetails({ ...details, lastName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm text-slate-900 focus:border-slate-900 outline-none transition-all" placeholder="Last Name" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Email</label>
                                    <input type="email" value={details.emailId} onChange={e => setDetails({ ...details, emailId: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm text-slate-900 focus:border-slate-900 outline-none transition-all" placeholder="user@gmail.com" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Mobile Number</label>
                                    <input type="text" maxLength={10} value={details.merchantPhoneNumber} onChange={e => setDetails({ ...details, merchantPhoneNumber: e.target.value.replace(/\D/g, '') })} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm text-slate-900 focus:border-slate-900 outline-none transition-all" placeholder="Mobile Number" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">PAN Number</label>
                                    <input type="text" maxLength={10} value={details.userPan} onChange={e => { const v = e.target.value.toUpperCase(); setDetails({ ...details, userPan: v }); verifyPan(v); }} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black tracking-widest text-sm text-slate-900 focus:border-slate-900 outline-none transition-all" placeholder="PAN Number" />
                                    {verifiedNames.pan && <p className="text-[8px] font-black text-emerald-600 uppercase ml-2 flex items-center gap-1 mt-1"><CheckCircle2 size={10} /> {verifiedNames.pan}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">GST Number</label>
                                    <input type="text" maxLength={15} value={details.gstinNumber} onChange={e => setDetails({ ...details, gstinNumber: e.target.value.toUpperCase() })} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black tracking-widest text-sm text-slate-900 focus:border-slate-900 outline-none transition-all" placeholder="GST Number" />
                                </div>
                            </div>
                            <button onClick={() => validateStep1() && setStep(2)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2">Next: Bank Details <ChevronRight size={16} /></button>
                        </motion.div>
                    )}

                    {/* STEP 2: BANK DETAILS */}
                    {step === 2 && (
                        <motion.div key="step2" className="space-y-6">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setStep(1)} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"><ArrowLeft size={16} /></button>
                                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Company Bank Info</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Company Bank Name</label>
                                    <input type="text" value={details.companyBankName} onChange={e => setDetails({ ...details, companyBankName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm" placeholder="Company Bank Name" />
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Bank A/c Holder Name</label>
                                    <input type="text" value={details.bankAccountName} onChange={e => setDetails({ ...details, bankAccountName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm" placeholder="Bank A/c Holder Name" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Bank A/C Number</label>
                                    <input type="text" value={details.companyBankAccountNumber} onChange={e => setDetails({ ...details, companyBankAccountNumber: e.target.value.replace(/\D/g, '') })} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm" placeholder="Bank A/C Number" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Bank IFSC Code</label>
                                    <input type="text" maxLength={11} value={details.bankIfscCode} onChange={e => setDetails({ ...details, bankIfscCode: e.target.value.toUpperCase() })} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-black text-sm" placeholder="Bank IFSC Code" />
                                </div>
                            </div>
                            <button onClick={() => validateStep2() && setStep(3)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2">Next: Address & Shop <ChevronRight size={16} /></button>
                        </motion.div>
                    )}

                    {/* STEP 3: ADDRESS & SHOP */}
                    {step === 3 && (
                        <motion.div key="step3" className="space-y-6">
                            <div className="flex items-center gap-3">
                                <button onClick={() => setStep(2)} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200 transition-all"><ArrowLeft size={16} /></button>
                                <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Address & Shop Info</h2>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">State</label>
                                    <select 
                                        value={details.merchantState} 
                                        onChange={e => setDetails({ ...details, merchantState: e.target.value })}
                                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-slate-900"
                                    >
                                        <option value="">Select State</option>
                                        {states.map(s => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">City</label>
                                    <input type="text" value={details.merchantCityName} onChange={e => setDetails({ ...details, merchantCityName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm" placeholder="Select your City" />
                                </div>
                                <div className="md:col-span-2 space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Resident Address</label>
                                    <input type="text" value={details.merchantAddress1} onChange={e => setDetails({ ...details, merchantAddress1: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm" placeholder="Resident Address" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Shop Name</label>
                                    <input type="text" value={details.companyLegalName} onChange={e => setDetails({ ...details, companyLegalName: e.target.value })} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm" placeholder="Shop Name" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black text-slate-400 uppercase ml-2">Pincode</label>
                                    <input type="text" maxLength={6} value={details.merchantPinCode} onChange={e => setDetails({ ...details, merchantPinCode: e.target.value.replace(/\D/g, '') })} className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm" placeholder="Pincode" />
                                </div>
                            </div>
                            <button onClick={handleSubmitKyc} disabled={submitting} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-700 transition-all">{submitting ? 'Submitting...' : 'Submit KYC'}</button>
                        </motion.div>
                    )}

                    {/* STEP 4: SUCCESS */}
                    {step === 5 && (
                        <motion.div key="step5" className="text-center space-y-6 py-10">
                            <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600"><CheckCircle2 size={48} /></div>
                            <h2 className="text-4xl font-black text-slate-800 uppercase">Success!</h2>
                            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">KYC Application Submitted</p>
                            <p className="text-xs text-slate-500 font-bold max-w-sm mx-auto uppercase text-center leading-relaxed">Your profile will be approved within 24 hours after manual verification of documents. Thank you for your cooperation.</p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default RetailerEKYC;
export { RetailerEKYC };
