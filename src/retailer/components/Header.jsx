import React, { useState, useEffect } from 'react';
import {
    Fingerprint, Volume2, HelpCircle, Wallet, RefreshCw,
    Eye, Bell, MoreVertical, ChevronDown, Menu,
    User, CreditCard, FileText, Lock, Settings, Shield,
    Search, LifeBuoy, LogOut
} from 'lucide-react';
import { dataService } from '../../services/dataService';
import mainLogo from '../../assets/rupiksha_logo.png';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';

const Header = ({ onAddMoney, onProfileClick, onMenuClick }) => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [appData, setAppData] = useState(dataService.getData());
    const [showBalance, setShowBalance] = useState(true);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]); // Empty by default
    const { lockTimeLeft, logoutTimeLeft } = useAuth();
    
    const unreadCount = notifications.filter(n => !n.read).length;

    const formatTime = (ms) => {
        const totalSecs = Math.floor(ms / 1000);
        const mins = Math.floor(totalSecs / 60);
        const secs = totalSecs % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        const fetchAllNotifications = async () => {
            const data = dataService.getData();
            setAppData(data);
            
            // 1. System Alerts
            const systemNotifs = [];
            if (data.currentUser?.aeps_kyc_status !== 'DONE') {
                systemNotifs.push({
                    id: 'kyc_alert',
                    title: 'Verify Your Account',
                    message: 'Complete AEPS KYC to unlock full service access.',
                    type: 'alert',
                    read: false,
                    path: '/aeps-kyc'
                });
            }

            // 2. Database Notifications
            try {
                const dbNotifs = await dataService.getNotifications();
                const mappedDbNotifs = dbNotifs.map(n => ({
                    id: n.id,
                    title: n.title,
                    message: n.message,
                    read: n.isRead,
                    type: 'message',
                    created_at: n.createdAt
                }));
                setNotifications([...systemNotifs, ...mappedDbNotifs]);
            } catch (e) {
                setNotifications(systemNotifs);
            }
        };

        fetchAllNotifications();
        window.addEventListener('dataUpdated', fetchAllNotifications);
        const interval = setInterval(fetchAllNotifications, 30000); // 30s check in header

        return () => {
            window.removeEventListener('dataUpdated', fetchAllNotifications);
            clearInterval(interval);
        };
    }, []);

    const currentUser = appData.currentUser;
    const headerData = currentUser?.wallet || appData.wallet;

    // ... (rest of the helper functions)
    const getInitials = () => {
        if (currentUser?.businessName) {
            return currentUser.businessName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        }
        return currentUser?.mobile?.slice(-2) || 'RX';
    };

    return (
        <div className="flex flex-col w-full bg-transparent sticky top-0 z-40 font-['Inter',sans-serif]">
            {/* Main Header Row */}
            <div className="flex items-center justify-between px-6 lg:px-8 h-16 lg:h-20">

                {/* Left Section: Menu + Compact Search */}
                <div className="flex items-center gap-4 flex-1">
                    <button
                        onClick={onMenuClick}
                        className="p-2.5 hover:bg-slate-100 rounded-xl lg:hidden text-slate-500 transition-colors border border-slate-200"
                    >
                        <Menu size={20} />
                    </button>
                </div>

                {/* Right Section: Icons & Profile Pill */}
                <div className="flex items-center space-x-6">

                    {/* Notification & Profile Pill */}
                    <div className="flex items-center gap-4 relative">
                        
                        {/* Notifications Dropdown */}
                        <div className="relative">
                            <div 
                                className="relative cursor-pointer p-2 lg:p-3 rounded-full border border-slate-200 hover:bg-slate-100 transition-colors group"
                                onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
                            >
                                <Bell size={18} className="lg:size-[22px] text-slate-500 group-hover:text-slate-800 transition-colors" />
                                {unreadCount > 0 && (
                                    <div className="absolute -top-1 -right-1 w-4 lg:w-5 h-4 lg:h-5 bg-blue-600 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                                        <span className="text-[8px] lg:text-[11px] font-black text-white">{unreadCount}</span>
                                    </div>
                                )}
                            </div>

                            <AnimatePresence>
                                {showNotifications && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowNotifications(false)}></div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                            className="absolute right-0 mt-3 w-72 bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 z-50 overflow-hidden"
                                        >
                                            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Notifications</h3>
                                            </div>
                                            
                                            <div className="max-h-80 overflow-y-auto w-full">
                                                {notifications.length > 0 ? (
                                                    notifications.map((notif, idx) => (
                                                        <div 
                                                            key={idx} 
                                                            className="p-4 border-b border-slate-50 hover:bg-slate-50 transition-colors cursor-pointer"
                                                            onClick={() => {
                                                                if (notif.path) navigate(notif.path);
                                                                setShowNotifications(false);
                                                            }}
                                                        >
                                                            <p className="text-xs font-bold text-slate-800 mb-1 flex items-center gap-2">
                                                                {notif.type === 'alert' && <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />}
                                                                {notif.title}
                                                            </p>
                                                            <p className="text-[10px] text-slate-500">{notif.message}</p>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center py-10">
                                                        <span className="text-4xl mb-3">😟</span>
                                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">No Notifications Yet</p>
                                                        <p className="text-[9px] text-slate-300 text-center mt-1">Check back later for updates</p>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {notifications.length > 0 && (
                                                <div className="p-3 text-center border-t border-slate-100 bg-slate-50/50">
                                                    <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:text-blue-700 transition-colors">
                                                        Mark all as read
                                                    </button>
                                                </div>
                                            )}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        <div className="relative">
                            <motion.div
                                whileHover={{ scale: 1.02 }}
                                onClick={() => setShowProfileMenu(!showProfileMenu)}
                                className="flex items-center gap-1.5 lg:gap-4 cursor-pointer bg-slate-50 border border-slate-200 pl-1.5 lg:pl-2 pr-2 lg:pr-6 py-1.5 lg:py-2.5 rounded-full transition-all hover:bg-slate-100 hover:border-slate-300 shadow-sm"
                            >
                                <div className="w-8 lg:w-11 h-8 lg:h-11 rounded-full bg-gradient-to-br from-slate-200 to-slate-400 p-0.5">
                                    <div className="w-full h-full rounded-full bg-white overflow-hidden flex items-center justify-center">
                                        {currentUser?.profilePhoto ? (
                                            <img src={currentUser.profilePhoto} alt="User" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className="text-[8px] lg:text-[12px] font-black text-slate-800 uppercase">{getInitials()}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="hidden lg:flex flex-col items-start leading-none">
                                    <span className="text-lg font-black text-slate-800 tracking-tight">
                                        {currentUser?.name?.split(' ')[0] || 'Member'} {currentUser?.name?.split(' ')[1] || ''}
                                    </span>
                                    <span className="text-[12px] font-bold text-slate-400 uppercase tracking-tighter mt-1">
                                        {currentUser?.role === 'RETAILER' ? 'Pro Account' : 'Standard'}
                                    </span>
                                </div>
                                <ChevronDown size={14} className={`text-slate-400 lg:size-[18px] transition-transform duration-300 lg:ml-2 ${showProfileMenu ? 'rotate-180 text-blue-600' : ''}`} />
                            </motion.div>

                            <AnimatePresence>
                                {showProfileMenu && (
                                    <>
                                        <div className="fixed inset-0 z-40" onClick={() => setShowProfileMenu(false)}></div>
                                        <motion.div
                                            initial={{ opacity: 0, y: 15, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 15, scale: 0.95 }}
                                            className="absolute right-0 mt-3 w-64 bg-white rounded-[24px] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200 z-50 overflow-hidden"
                                        >
                                            <div className="p-2">
                                                {/* User Info Header */}
                                                <div className="px-5 py-5 bg-slate-50 rounded-t-[20px] mb-2 border-b border-slate-100">
                                                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Session Active</p>
                                                    <p className="text-sm font-black text-slate-800 truncate">{currentUser?.name || 'Merchant'}</p>
                                                    <p className="text-[11px] font-bold text-slate-500 mt-0.5">{currentUser?.username}</p>
                                                </div>

                                                <div className="space-y-0.5 px-1">
                                                    {[
                                                        { id: 'profile', icon: <User size={16} />, label: 'My Profile', color: 'text-blue-600 bg-blue-50' },
                                                        { id: 'visiting_card', icon: <CreditCard size={16} />, label: 'Visiting Card', color: 'text-indigo-600 bg-indigo-50' },
                                                        { id: 'settings', icon: <Settings size={16} />, label: 'Settings', color: 'text-slate-600 bg-slate-50' },
                                                        { id: 'support', icon: <LifeBuoy size={16} />, label: 'Help & Support', color: 'text-emerald-600 bg-emerald-50' },
                                                        { id: 'logout', icon: <LogOut size={16} />, label: 'Sign Out', color: 'text-rose-600 bg-rose-50' },
                                                    ].map((item) => (
                                                        <div 
                                                            key={item.id} 
                                                            onClick={() => {
                                                                onProfileClick(item.id);
                                                                setShowProfileMenu(false);
                                                            }}
                                                            className={`flex items-center gap-3 p-3 hover:bg-slate-50 cursor-pointer rounded-xl transition-all group ${item.id === 'logout' ? 'mt-4 border-t border-slate-100 pt-4' : ''}`}
                                                        >
                                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</div>
                                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-600 group-hover:text-slate-900 transition-colors">{item.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Header;
