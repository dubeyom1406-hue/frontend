import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShieldCheck, User, Building2, Landmark, 
    MapPin, CheckCircle2, ArrowLeft, ChevronRight, 
    Smartphone, Fingerprint, Shield, Phone, Mail, CreditCard
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { dataService } from '../../services/dataService';

const AEPSKycForm = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [submitting, setSubmitting] = useState(false);
    
    // Verification States
    const [verificationStep, setVerificationStep] = useState('input'); // input | verified
    const [otpValue, setOtpValue] = useState('');
    const [verifiedNames, setVerifiedNames] = useState({ pan: '', aadhaar: '' });

    const [details, setDetails] = useState({
        firstName: user?.fullName?.split(' ')[0] || '',
        lastName: user?.fullName?.split(' ').slice(1).join(' ') || '',
        emailId: user?.email || '',
        merchantPhoneNumber: user?.mobile || '',
        aadhaarNumber: user?.aadhaarNumber || '',
        userPan: user?.panNumber || '',
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

    const states = [
        { name: "Andhra Pradesh", id: 2 },
        { name: "Arunachal Pradesh", id: 29 },
        { name: "Assam", id: 3 },
        { name: "Bihar", id: 4 },
        { name: "Chhattisgarh", id: 5 },
        { name: "Goa", id: 6 },
        { name: "Gujarat", id: 7 },
        { name: "Haryana", id: 8 },
        { name: "Himachal Pradesh", id: 9 },
        { name: "Jammu and Kashmir", id: 10 },
        { name: "Jharkhand", id: 11 },
        { name: "Karnataka", id: 12 },
        { name: "Kerala", id: 13 },
        { name: "Madhya Pradesh", id: 14 },
        { name: "Maharashtra", id: 15 },
        { name: "Manipur", id: 16 },
        { name: "Meghalaya", id: 17 },
        { name: "Mizoram", id: 18 },
        { name: "Nagaland", id: 19 },
        { name: "Odisha", id: 20 },
        { name: "Punjab", id: 21 },
        { name: "Rajasthan", id: 22 },
        { name: "Sikkim", id: 23 },
        { name: "Tamil Nadu", id: 24 },
        { name: "Telangana", id: 1 },
        { name: "Tripura", id: 25 },
        { name: "Uttarakhand", id: 26 },
        { name: "Uttar Pradesh", id: 27 },
        { name: "West Bengal", id: 28 },
        { name: "Delhi", id: 30 },
        { name: "Puducherry", id: 32 },
        { name: "Chandigarh", id: 33 },
        { name: "Dadra and Nagar Haveli", id: 34 },
        { name: "Daman and Diu", id: 35 },
        { name: "Lakshadweep", id: 36 },
        { name: "Andaman and Nicobar Islands", id: 38 }
    ].sort((a,b) => a.name.localeCompare(b.name));

    const startAadhaarVerification = () => {
        if (details.aadhaarNumber.length !== 12) {
            alert("Enter valid 12-digit Aadhaar");
            return;
        }
        setSubmitting(true);
        // Simulation of verification logic
        setTimeout(() => {
            setVerifiedNames(prev => ({ ...prev, aadhaar: details.firstName + " " + details.lastName }));
            setVerificationStep('verified');
            setSubmitting(false);
        }, 1500);
    };

    const verifyPan = async (pan) => {
        if (pan.length === 10) {
            try {
                const res = await dataService.verifyPAN(pan);
                if (res.success) {
                    setVerifiedNames(prev => ({ ...prev, pan: res.name }));
                }
            } catch (err) {}
        }
    };

    const handleSubmitKyc = async () => {
        setSubmitting(true);
        try {
            const stateObj = states.find(s => s.id === parseInt(details.merchantState));
            const res = await dataService.submitAepsKyc(user.id, { 
                ...details, 
                username: user.username,
                merchantStateName: stateObj?.name || '',
                shopAddress: details.merchantAddress1,
                shopCity: details.merchantCityName,
                shopState: details.merchantState,
                shopPincode: details.merchantPinCode
            });
            if (res.status || res.success) {
                setStep(4);
            } else {
                alert(res.message || "KYC failure");
            }
        } catch (err) {
            alert("Submission error");
        } finally {
            setSubmitting(false);
        }
    };

    const Stepper = () => {
        const steps = ["Personal", "Bank", "Store"];
        return (
            <div className="flex justify-between items-center mb-12 px-4 max-w-md mx-auto">
                {steps.map((s, i) => (
                    <div key={i} className="flex flex-col items-center gap-2 relative">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black transition-all ${i + 1 <= step ? 'bg-slate-900 text-white shadow-xl rotate-3' : 'bg-slate-100 text-slate-400'}`}>
                            {i + 1 < step ? <CheckCircle2 size={16} /> : i + 1}
                        </div>
                        <span className={`text-[9px] font-black uppercase tracking-widest ${i + 1 <= step ? 'text-slate-800' : 'text-slate-300'}`}>{s}</span>
                        {i < steps.length - 1 && (
                            <div className={`absolute left-12 top-5 w-16 h-0.5 ${i + 1 < step ? 'bg-slate-900' : 'bg-slate-100'}`} />
                        )}
                    </div>
                ))}
            </div>
        );
    };

    if (step === 4) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-[3rem] shadow-2xl p-16 text-center max-w-lg w-full">
                    <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600 mb-8"><CheckCircle2 size={48} /></div>
                    <h1 className="text-4xl font-black text-slate-900 uppercase tracking-tighter mb-4">Success!</h1>
                    <p className="text-sm text-slate-500 font-bold uppercase leading-relaxed mb-10">Your AEPS KYC Application has been submitted for review. It will be activated within 24 hours.</p>
                    <button onClick={() => navigate('/dashboard')} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Back to Dashboard</button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] p-6 lg:p-12 font-['Inter',sans-serif]">
            <div className="max-w-4xl mx-auto">
                <div className="flex items-center gap-6 mb-12">
                    <button onClick={() => navigate('/dashboard')} className="w-12 h-12 bg-white rounded-2xl shadow-sm border border-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all"><ArrowLeft size={24} /></button>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">AEPS Registration</h1>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mt-1">Verify your identity to enable banking services</p>
                    </div>
                </div>

                <div className="mb-8 p-6 bg-amber-50 rounded-[2rem] border-2 border-amber-100 flex gap-5 items-start">
                    <div className="p-3 bg-amber-100 rounded-2xl text-amber-600"><Shield size={24} /></div>
                    <div className="space-y-1">
                        <h4 className="text-[10px] font-black text-amber-800 uppercase tracking-widest">Mandatory Notice</h4>
                        <p className="text-[11px] text-amber-700 font-bold leading-relaxed">
                            Please complete your KYC (Know Your Customer) verification at your shop or company office. 
                            Transactions may be blocked if your registered address does not match your current location. 
                            Thank you for your cooperation.
                        </p>
                    </div>
                </div>

                <Stepper />

                <div className="bg-white rounded-[3rem] shadow-2xl shadow-slate-200/50 p-8 md:p-12 border border-slate-100">
                    <AnimatePresence mode="wait">
                        {step === 1 && (
                            <motion.div key="st1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                <section className="space-y-6">
                                    <div className="p-8 bg-slate-50 rounded-[2.5rem] border-2 border-slate-100">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-2 mb-2 block">Aadhaar Number Verification</label>
                                        <div className="flex gap-3">
                                            <input type="text" maxLength={12} value={details.aadhaarNumber} onChange={e => setDetails({...details, aadhaarNumber: e.target.value.replace(/\D/g, '')})} className="flex-1 px-6 py-4 bg-white border-2 border-slate-200 rounded-2xl font-black text-xl tracking-[0.3em] outline-none focus:border-slate-900 transition-all" placeholder="0000 0000 0000" />
                                            <button onClick={startAadhaarVerification} disabled={submitting} className="px-8 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:scale-105 transition-all">
                                                {verificationStep === 'verified' ? <CheckCircle2 size={16} /> : <Fingerprint size={16} />}
                                                {verificationStep === 'verified' ? 'Verified' : 'Verify'}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <Field label="First Name" value={details.firstName} onChange={v => setDetails({...details, firstName: v})} />
                                        <Field label="Last Name" value={details.lastName} onChange={v => setDetails({...details, lastName: v})} />
                                        <Field label="Email ID" type="email" value={details.emailId} onChange={v => setDetails({...details, emailId: v})} />
                                        <Field label="Mobile Number" value={details.merchantPhoneNumber} onChange={v => setDetails({...details, merchantPhoneNumber: v.replace(/\D/g, '')})} maxLength={10} />
                                        <div className="space-y-2">
                                            <Field label="PAN Number" value={details.userPan} onChange={v => { const val = v.toUpperCase(); setDetails({...details, userPan: val}); verifyPan(val); }} maxLength={10} />
                                            {verifiedNames.pan && <p className="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-1 ml-4"><CheckCircle2 size={10} /> {verifiedNames.pan}</p>}
                                        </div>
                                        <Field label="GST Number (Optional)" value={details.gstinNumber} onChange={v => setDetails({...details, gstinNumber: v.toUpperCase()})} maxLength={15} />
                                    </div>
                                </section>
                                <button onClick={() => setStep(2)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">Next: Bank Details <ChevronRight size={16} /></button>
                            </motion.div>
                        )}

                        {step === 2 && (
                            <motion.div key="st2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <Field label="Company Bank Name" value={details.companyBankName} onChange={v => setDetails({...details, companyBankName: v})} className="md:col-span-2" />
                                    <Field label="Account Holder Name" value={details.bankAccountName} onChange={v => setDetails({...details, bankAccountName: v})} className="md:col-span-2" />
                                    <Field label="Account Number" value={details.companyBankAccountNumber} onChange={v => setDetails({...details, companyBankAccountNumber: v.replace(/\D/g, '')})} />
                                    <Field label="IFSC Code" value={details.bankIfscCode} onChange={v => setDetails({...details, bankIfscCode: v.toUpperCase()})} maxLength={11} />
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setStep(1)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">Back</button>
                                    <button onClick={() => setStep(3)} className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center justify-center gap-2">Next: Store Info <ChevronRight size={16} /></button>
                                </div>
                            </motion.div>
                        )}

                        {step === 3 && (
                            <motion.div key="st3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">State</label>
                                        <select value={details.merchantState} onChange={e => setDetails({...details, merchantState: e.target.value})} className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm outline-none focus:border-slate-900">
                                             <option value="">Select State</option>
                                             {states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                         </select>
                                    </div>
                                    <Field label="City" value={details.merchantCityName} onChange={v => setDetails({...details, merchantCityName: v})} />
                                    <Field label="Resident Address" value={details.merchantAddress1} onChange={v => setDetails({...details, merchantAddress1: v})} className="md:col-span-2" />
                                    <Field label="Shop Name" value={details.companyLegalName} onChange={v => setDetails({...details, companyLegalName: v})} />
                                    <Field label="Pincode" value={details.merchantPinCode} onChange={v => setDetails({...details, merchantPinCode: v.replace(/\D/g, '')})} maxLength={6} />
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setStep(2)} className="flex-1 py-5 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">Back</button>
                                    <button onClick={handleSubmitKyc} disabled={submitting} className="flex-[2] py-5 bg-emerald-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">
                                        {submitting ? 'Submitting...' : 'Complete Registration'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

const Field = ({ label, value, onChange, type = "text", className = "", ...props }) => (
    <div className={`space-y-2 ${className}`}>
        <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-4">{label}</label>
        <input 
            type={type} 
            value={value} 
            onChange={e => onChange(e.target.value)} 
            className="w-full px-6 py-4 bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-sm text-slate-900 outline-none focus:border-slate-900 transition-all" 
            placeholder={label}
            {...props} 
        />
    </div>
);

export default AEPSKycForm;
