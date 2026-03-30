import React, { useState, useEffect } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { NavLink, useLocation } from 'react-router-dom';
import {
    LayoutGrid, Plane, Smartphone, HandCoins, FileText,
    Fingerprint, Calculator, Zap, Lightbulb, Landmark, Headset,
    FileChartColumn, CreditCard, ScanFace, ChevronRight, ChevronDown,
    Building2, Handshake, Home, Coins, Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import mainLogo from '../../assets/rupiksha_logo.png';
import { dataService } from '../../services/dataService';

/* ── MenuItem Component (Defined externally to fix lifecycle/navigation bugs) ── */
const MenuItem = ({ item, isActive, onClick, path, isHovered, isExpanded, toggleExpand }) => {
    if (item.hasSubmenu) {
        return (
            <div className="px-3">
                <NavLink
                    to={path || '#'}
                    onClick={(e) => {
                        // If clicking specifically on the arrow, we might just want to toggle
                        // But user wants "any tab click" to open page.
                        // So we navigate. toggleExpand will still happen.
                        toggleExpand(item.id);
                    }}
                    className={`flex items-center ${isHovered ? 'justify-between' : 'justify-center'} px-3 py-2.5 my-1.5 cursor-pointer group transition-all duration-300 rounded-xl relative
                    ${isActive ? 'text-blue-900 border border-white/50 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-white/10'}`}
                >
                    <div className="flex items-center space-x-3 relative z-10 w-full">
                        <div className={`transition-all duration-300 ${isActive ? 'text-blue-600 scale-110' : 'text-slate-400 group-hover:text-slate-900'}`}>
                            <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        {isHovered && (
                            <motion.span
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`font-bold text-[13.5px] tracking-tight ${isActive ? 'text-blue-900' : ''}`}
                            >
                                {item.label}
                            </motion.span>
                        )}
                    </div>
                    {isHovered && (
                        <div className="relative z-10 transition-transform duration-300" style={{ transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                            <ChevronDown size={14} className={`${isActive ? 'text-blue-900' : 'text-slate-300'}`} />
                        </div>
                    )}
                </NavLink>

                <AnimatePresence>
                    {isExpanded && isHovered && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="ml-3 border-l border-white/40 overflow-hidden"
                        >
                            {item.subItems.map((sub, idx) => (
                                <NavLink
                                    key={idx}
                                    to={sub.path || '#'}
                                    className={({ isActive: isSubActive }) => `
                                        block w-full text-left pl-4 py-2 text-[12.5px] font-bold cursor-pointer transition-all rounded-lg my-1 relative
                                        ${isSubActive ? 'text-blue-600 bg-white/60' : 'text-slate-400 hover:text-slate-700 hover:bg-white/50'}
                                    `}
                                >
                                    {sub.label}
                                </NavLink>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        );
    }

    return (
        <div className="px-3">
            <NavLink
                to={path || '#'}
                onClick={() => onClick && onClick(item.id)}
                className={`
                    flex items-center ${isHovered ? 'justify-between' : 'justify-center'} px-3 py-2.5 my-1.5 cursor-pointer group transition-all duration-300 rounded-xl relative
                    ${isActive ? 'text-blue-900 border border-white/50 bg-white shadow-sm' : 'text-slate-500 hover:text-slate-900 hover:bg-white/20'}
                `}
            >
                <>
                    <div className="flex items-center space-x-3 relative z-10 w-full">
                        <div className={`transition-all duration-300 ${isActive ? 'text-blue-600 scale-110' : 'text-slate-400 group-hover:text-slate-900'}`}>
                            <item.icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                        </div>
                        {isHovered && (
                            <motion.span
                                initial={{ opacity: 0, x: -5 }}
                                animate={{ opacity: 1, x: 0 }}
                                className={`font-bold text-[13.5px] tracking-tight ${isActive ? 'text-blue-900' : ''}`}
                            >
                                {item.label}
                            </motion.span>
                        )}
                    </div>
                    {isHovered && isActive && (
                        <motion.div 
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="w-1.5 h-1.5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)] relative z-10"
                        />
                    )}
                </>
            </NavLink>
        </div>
    );
};

const Sidebar = ({ activeTab, setActiveTab, showMobileSidebar }) => {
    const { t } = useLanguage();
    const [expandedItems, setExpandedItems] = useState({ banking: false, travel: false, reports: false });
    const [isHovered, setIsHovered] = useState(false);
    const [appData, setAppData] = useState(dataService.getData());
    const [isMobile, setIsMobile] = useState(typeof window !== 'undefined' ? window.innerWidth < 1024 : false);

    useEffect(() => {
        const handleResize = () => setIsMobile(window.innerWidth < 1024);
        window.addEventListener('resize', handleResize);
        const updateData = () => setAppData(dataService.getData());
        window.addEventListener('dataUpdated', updateData);
        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('dataUpdated', updateData);
        };
    }, []);

    const toggleExpand = (id) => {
        if (!isHovered) return;
        setExpandedItems(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const serviceItems = [
        {
            id: 'banking',
            label: 'Banking Hub',
            icon: Landmark,
            path: '/aeps',
            hasSubmenu: true,
            subItems: [
                { id: 'aeps_services', label: 'AEPS Services', path: '/aeps' },
                { id: 'dmt', label: 'DMT (Money Transfer)', path: '/dmt' },
                { id: 'cms', label: 'CMS – Loan EMI', path: '/cms' },
                { id: 'matm', label: 'MATM', path: '/matm' },
                { id: 'add_money', label: 'Add Money', path: '/add-money' },
                { id: 'quick_mr', label: 'Quick Mr', path: '/dmt' },
                { id: 'ybl_mr', label: 'YBL MR', path: '/dmt' },
                { id: 'pw_money_ekyc', label: 'PW Money QMR EKYC', path: '/kyc-verification' },
            ]
        },
        { id: 'travel', label: 'Travel Hub', icon: Plane, path: '/travel' },
        { id: 'utility', label: 'Utility Hub', icon: Zap, path: '/utility' },
        { id: 'bharat_connect', label: 'Bharat Connect', icon: Building2, path: '/utility' },
        { id: 'payout', label: 'Payout Hub', icon: HandCoins, path: '/payout' },
        {
            id: 'loans',
            label: 'Loan Hub',
            icon: Handshake,
            path: '/loans',
            hasSubmenu: true,
            subItems: [
                { id: 'personal_loan', label: 'Personal Loan', path: '/personal_loan' },
                { id: 'home_loan', label: 'Home Loan', path: '/home_loan' },
                { id: 'gold_loan', label: 'Gold Loan', path: '/gold_loan' },
                { id: 'instant_loan', label: 'Instant Loan', path: '/instant_loan' },
                { id: 'loan_status', label: 'Track Application', path: '/loan_status' },
            ]
        }
    ];

    const businessItems = [
        {
            id: 'reports',
            label: 'Reports & Ledger',
            icon: FileChartColumn,
            hasSubmenu: true,
            path: '/reports',
            subItems: [
                { id: 'sale_report', label: 'Sale Report', path: '/reports/sale-report' },
                { id: 'consolidated_ledger', label: 'Consolidated-ledger', path: '/reports/consolidated-ledger' },
                { id: 'daily_ledger', label: 'Daily ledger', path: '/reports/daily-ledger' },
                { id: 'gstin_invoice', label: 'GSTIN Invoice', path: '/reports/gst-invoice' },
                { id: 'cons_gstin_invoice', label: 'Consolidated GSTIN Invoice', path: '/reports/gst-invoice' },
                { id: 'cons_comm_receipt', label: 'Consolidated Commission Receipt', path: '/reports/audit-report' },
                { id: 'tds_report', label: 'TDS', path: '/reports/audit-report' },
                { id: 'payment_req_history', label: 'Payment Request History', path: '/reports/audit-report' },
                { id: 'emi_reports', label: 'EMI Reports', path: '/reports/audit-report' },
                { id: 'qr_txn_report', label: 'QR Transactions Report', path: '/reports/audit-report' },
            ]
        },
        { id: 'gst_einvoice_report', label: 'GST E-Invoice Report', icon: FileChartColumn, path: '/gst-invoice-report' },
        { id: 'plans', label: 'Commission Plans', icon: CreditCard, path: '/plans' },
        { id: 'gst_certification', label: 'GST Certification', icon: Shield, path: '/profile?tab=gst_certification' },
        { id: 'tds_certificate', label: 'TDS Certificate', icon: FileText, path: '/profile?tab=tds_certificate' },
    ];

    const ekycItems = [
        { id: 'retailer_ekyc', label: 'Retailer eKYC', icon: ScanFace, type: 'ekyc', path: '/kyc-verification' },
        { id: 'icici_ekyc', label: 'ICICI eKYC', icon: Fingerprint, type: 'ekyc', path: '/aeps-kyc' },
        { id: 'support', label: 'Help & Support', icon: Headset, type: 'support', path: '/support' },
    ];

    const currentUser = appData.currentUser;
    const getInitials = () => {
        if (currentUser?.businessName) {
            return currentUser.businessName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
        }
        return currentUser?.mobile?.slice(-2) || 'RX';
    };

    return (
        <motion.div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            initial={false}
            animate={{
                width: isHovered ? 260 : 88,
                x: isMobile ? (showMobileSidebar ? 0 : -260) : 0
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed lg:relative bg-gradient-to-br from-indigo-100 via-purple-100 to-blue-100 flex-shrink-0 border-r border-white/20 flex flex-col h-full font-['Inter',sans-serif] z-50 lg:z-20 overflow-hidden"
        >
            <div className="flex items-center justify-center h-24 mb-2">
                <div className="flex items-center justify-center">
                    <div className="h-16 w-16 flex-shrink-0 flex items-center justify-center overflow-visible">
                        <img src={mainLogo} alt="RUPIKSHA" className="h-full w-auto object-contain transition-none" />
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto py-2 scrollbar-none">
                <div className="mb-6">
                    <MenuItem
                        item={{ id: 'dashboard', label: 'Dashboard', icon: LayoutGrid }}
                        path="/dashboard"
                        isActive={activeTab === 'dashboard'}
                        isHovered={isHovered}
                        onClick={setActiveTab}
                    />
                    <MenuItem
                        item={{ id: 'all_services', label: 'All Services', icon: Smartphone }}
                        path="/all-services"
                        isActive={activeTab === 'all_services'}
                        isHovered={isHovered}
                        onClick={setActiveTab}
                    />
                </div>

                <div className="mb-6">
                    {serviceItems.map((item) => (
                        <MenuItem
                            key={item.id}
                            item={item}
                            isActive={activeTab === item.id || (item.subItems && item.subItems.some(sub => sub.id === activeTab))}
                            onClick={setActiveTab}
                            path={item.path || (item.id === 'banking' ? '/aeps' : item.id === 'travel' ? '/travel' : item.id === 'utility' ? '/utility' : item.id === 'bharat_connect' ? '/bharat-connect' : item.id === 'payout' ? '/payout' : '/loans')}
                            isHovered={isHovered}
                            isExpanded={expandedItems[item.id]}
                            toggleExpand={toggleExpand}
                        />
                    ))}
                </div>

                {isHovered && (
                    <div className="px-6 py-3">
                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Business Hub</span>
                    </div>
                )}
                <div className="mb-6">
                    {businessItems.map((item) => (
                        <MenuItem
                            key={item.id}
                            item={item}
                            isActive={activeTab === item.id || (item.subItems && item.subItems.some(sub => sub.id === activeTab))}
                            onClick={setActiveTab}
                            path={item.path}
                            isHovered={isHovered}
                            isExpanded={expandedItems[item.id]}
                            toggleExpand={toggleExpand}
                        />
                    ))}
                </div>
                
                <div className="mb-6">
                    {ekycItems.map((item) => (
                        <MenuItem
                            key={item.id}
                            item={item}
                            isActive={activeTab === item.id}
                            onClick={setActiveTab}
                            path={item.path}
                            isHovered={isHovered}
                        />
                    ))}
                </div>
                
                {isHovered && (
                    <div className="px-4 py-2 mt-auto">
                        <div className="bg-emerald-600 rounded-2xl p-4 text-white relative overflow-hidden group">
                           <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500" />
                           <div className="absolute -left-4 -top-4 w-16 h-16 bg-emerald-400/20 rounded-full blur-xl" />
                           <h4 className="font-bold text-sm mb-1.5 relative z-10">Maximize Profits</h4>
                           <p className="text-[10px] text-emerald-50 mb-4 leading-relaxed relative z-10">Get real-time commission alerts and payout signals directly.</p>
                           <button className="w-full bg-white text-emerald-600 font-bold text-[11px] py-2 rounded-xl shadow-lg shadow-emerald-900/10 hover:bg-emerald-50 transition-colors relative z-10">
                                Notify Me
                           </button>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-4 border-t border-white/20">
                <div className={`flex items-center ${isHovered ? 'justify-between px-2' : 'justify-center'} py-1.5`}>
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center border border-white shadow-sm overflow-hidden">
                            {currentUser?.profilePhoto ? (
                                <img src={currentUser.profilePhoto} alt="U" className="w-full h-full object-cover" />
                            ) : (
                                <span className="text-[10px] font-bold text-slate-400">{getInitials()}</span>
                            )}
                        </div>
                        {isHovered && (
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-slate-800 line-clamp-1">{currentUser?.businessName || 'Merchant'}</span>
                                <span className="text-[10px] text-slate-400 font-medium">Retailer Account</span>
                            </div>
                        )}
                    </div>
                    {isHovered && <ChevronRight size={14} className="text-slate-300" />}
                </div>
            </div>
        </motion.div>
    );
};

export default Sidebar;
