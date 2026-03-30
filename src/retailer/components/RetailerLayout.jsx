import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileBottomNav from './MobileBottomNav';
import { dataService } from '../../services/dataService';
import { AnimatePresence, motion } from 'framer-motion';
import { Clock, LogOut, Wallet, Zap, ChevronRight } from 'lucide-react';
import RetailerEKYC from './banking/RetailerEKYC';

const RetailerLayout = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [showMobileSidebar, setShowMobileSidebar] = useState(false);
    const [appData, setAppData] = useState(dataService.getData());
    const [balances, setBalances] = useState({ main: "0.00", aeps: "0.00" });
    const [activeWallet, setActiveWallet] = useState(null);
    const currentUser = appData.currentUser;

    // Map path to active tab for Sidebar
    const getActiveTab = () => {
        const path = location.pathname;
        const searchParams = new URLSearchParams(location.search);
        const reportType = searchParams.get('report');

        if (path === '/dashboard') return 'dashboard';
        if (path.startsWith('/aeps')) return 'aeps_services';
        if (path.startsWith('/dmt')) return 'dmt';
        if (path.startsWith('/cms')) return 'cms';
        if (path.startsWith('/travel')) return 'travel';
        if (path.startsWith('/utility')) return 'utility';
        if (path.startsWith('/all-services')) return 'all_services';
        if (path.startsWith('/reports')) {
            return reportType || 'reports';
        }
        if (path.startsWith('/plans')) return 'plans';
        if (path.startsWith('/matm')) return 'matm';
        if (path === '/add-money') return 'add_money';
        if (path === '/personal_loan') return 'personal_loan';
        if (path === '/home_loan') return 'home_loan';
        if (path === '/gold_loan') return 'gold_loan';
        if (path === '/instant_loan') return 'instant_loan';
        if (path === '/loan_status') return 'loan_status';
        if (path === '/reports/sale-report') return 'sale_report';
        if (path === '/reports/consolidated-ledger') return 'consolidated_ledger';
        if (path === '/reports/daily-ledger') return 'daily_ledger';
        if (path === '/reports/gst-invoice') return 'gst_einvoice';
        if (path === '/reports/audit-report') return 'all';
        if (path === '/support') return 'support';
        if (path === '/gst-invoice-report') return ['gst_einvoice', 'gst_einvoice_report'].includes(reportType) ? reportType : 'gst_einvoice_report';
        return 'dashboard';
    };

    const activeTab = getActiveTab();

    useEffect(() => {
        if (!currentUser) {
            navigate('/');
            return;
        }

        // If not admin/employee, verify they have RETAILER role
        const isStaff = ['ADMIN', 'SUPERADMIN', 'NATIONAL_HEADER', 'STATE_HEADER', 'REGIONAL_HEADER', 'EMPLOYEE'].includes(currentUser.role);
        if (!isStaff && currentUser.role !== 'RETAILER') {
            navigate('/');
        }
    }, [currentUser, navigate]);

    useEffect(() => {
        const updateData = () => {
            setAppData(dataService.getData());
        };
        
        const fetchBalances = async () => {
            if (currentUser) {
                const bals = await dataService.getWalletBalances(currentUser.id);
                setBalances(bals);
            }
        };

        fetchBalances();
        const interval = setInterval(fetchBalances, 10000);

        window.addEventListener('dataUpdated', updateData);
        window.addEventListener('superadminDataUpdated', updateData);
        return () => {
            clearInterval(interval);
            window.removeEventListener('dataUpdated', updateData);
            window.removeEventListener('superadminDataUpdated', updateData);
        };
    }, [currentUser]);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setShowMobileSidebar(false);
    }, [location.pathname]);

    const handleTabChange = (tab) => {
        const reportTabs = [
            'sale_report', 'consolidated_ledger', 'daily_ledger', 
            'gstin_invoice', 'cons_gstin_invoice', 
            'cons_comm_receipt', 'tds_report', 'payment_req_history', 
            'emi_reports', 'qr_txn_report'
        ];

        const reportRoutes = {
            'sale_report': '/reports/sale-report',
            'consolidated_ledger': '/reports/consolidated-ledger',
            'daily_ledger': '/reports/daily-ledger',
            'gst_einvoice': '/reports/gst-invoice',
            'all': '/reports/audit-report',
            'gstin_invoice': '/reports/gst-invoice',
            'cons_gstin_invoice': '/reports/gst-invoice',
            'cons_comm_receipt': '/reports/audit-report',
            'tds_report': '/reports/audit-report',
            'payment_req_history': '/reports/audit-report',
            'emi_reports': '/reports/audit-report',
            'qr_txn_report': '/reports/audit-report'
        };

        if (tab === 'gst_einvoice_report') {
            navigate('/gst-invoice-report');
            setShowMobileSidebar(false);
            return;
        }

        if (reportRoutes[tab]) {
            navigate(reportRoutes[tab]);
            setShowMobileSidebar(false);
            return;
        }

        if (tab === 'support') {
            navigate('/support');
            setShowMobileSidebar(false);
            return;
        }

        if (reportTabs.includes(tab)) {
            navigate(`/reports?report=${tab}`);
            setShowMobileSidebar(false);
            return;
        }

        const routes = {
            'dashboard': '/dashboard',
            'aeps_services': '/aeps',
            'dmt': '/dmt',
            'cms': '/cms',
            'travel': '/travel',
            'utility': '/utility',
            'all_services': '/all-services',
            'reports': '/reports',
            'plans': '/plans',
            'matm': '/matm',
            'add_money': '/add-money',
            'personal_loan': '/personal_loan',
            'home_loan': '/home_loan',
            'gold_loan': '/gold_loan',
            'instant_loan': '/instant_loan',
            'loan_status': '/loan_status',
            'gst_certification': '/profile?tab=gst_certification',
            'tds_certificate': '/profile?tab=tds_certificate'
        };
        navigate(routes[tab] || '/dashboard');
        setShowMobileSidebar(false);
    };

    const isStaff = ['ADMIN', 'SUPERADMIN', 'NATIONAL_HEADER', 'STATE_HEADER', 'REGIONAL_HEADER', 'EMPLOYEE'].includes(currentUser?.role);

    // KYC checks removed as per request to bypass KYC blocking

    return (
        <div className="flex h-screen bg-[#f8fafc] font-['Inter',sans-serif] overflow-hidden relative">
            <AnimatePresence>
                {showMobileSidebar && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowMobileSidebar(false)}
                        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40 lg:hidden"
                    />
                )}
            </AnimatePresence>

            <Sidebar
                activeTab={activeTab}
                setActiveTab={handleTabChange}
                showMobileSidebar={showMobileSidebar}
            />

            <div className="flex-1 flex flex-col overflow-hidden relative">
                <Header
                    onAddMoney={() => navigate('/add-money')}
                    onProfileClick={(type) => {
                        if (type === 'logout') {
                            dataService.logoutUser();
                            navigate('/');
                        } else if (type === 'support') {
                            navigate('/support');
                        } else {
                            navigate(`/profile?tab=${type}`);
                        }
                    }}
                    onMenuClick={() => setShowMobileSidebar(!showMobileSidebar)}
                />
                {/* Global Greeting & Wallet Section - ONLY ON DASHBOARD */}
                {location.pathname === '/dashboard' && (
                    <div className="px-4 md:px-8 lg:px-10 pt-4 lg:pt-6">
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6 mb-2"
                        >
                            {/* LEFT GREETING */}
                        <div className="flex items-center gap-4 lg:gap-8">
                             <div className="space-y-0.5">
                                <div className="flex items-center gap-3 mb-1">
                                    <div className="w-1.5 lg:w-2.5 h-1.5 lg:h-2.5 rounded-full bg-blue-600 animate-pulse" />
                                    <span className="text-[10px] lg:text-[12px] font-black text-blue-600 uppercase tracking-[0.3em] lg:tracking-[0.4em]">Personal Dashboard</span>
                                </div>
                                <h1 className="text-xl md:text-5xl font-black tracking-tighter text-slate-900 leading-tight">
                                    Hi {currentUser?.fullName?.split(' ')[0] || currentUser?.name?.split(' ')[0] || currentUser?.businessName?.split(' ')[0] || 'Member'}, <span className="text-slate-400">Welcome Back!</span>
                                </h1>
                            </div>
                        </div>

                        {/* RIGHT WALLET CLUSTER */}
                        <div className="relative w-full lg:w-auto">
                            <div className="flex items-center bg-white border border-slate-100 p-1 rounded-[24px] shadow-sm">
                                {[
                                    { id: 'main', label: 'Main', balance: balances.main, color: 'blue', icon: <Wallet size={12} />, actions: ['Add Funds', 'Usage', 'History'] },
                                    { id: 'aeps', label: 'AEPS', balance: balances.aeps, color: 'emerald', icon: <Zap size={12} />, actions: ['Move to Main', 'AEPS Hub'] },
                                ].map((w, i) => (
                                    <div key={i} className="relative group/wallet">
                                        <div 
                                            onClick={() => setActiveWallet(activeWallet === w.id ? null : w.id)}
                                            className={`flex items-center gap-3 lg:gap-5 px-3 lg:px-6 py-2 lg:py-2.5 cursor-pointer hover:bg-slate-50 transition-colors rounded-xl lg:rounded-2xl ${i !== 1 ? 'border-r border-slate-50' : ''}`}
                                        >
                                            <div className={`w-7 lg:w-9 h-7 lg:h-9 flex items-center justify-center bg-${w.color}-50 rounded-lg lg:rounded-xl text-${w.color}-600 shadow-sm group-hover/wallet:scale-110 transition-transform`}>
                                                {React.cloneElement(w.icon, { size: 12 })}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[8px] lg:text-[9px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1 lg:mb-1.5">{w.label}</span>
                                                <span className="text-xs lg:text-sm font-black tracking-tighter text-slate-800 leading-none">₹{Number(w.balance).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                            </div>
                                        </div>

                                        {/* Mini Modal / Popover */}
                                        <AnimatePresence>
                                            {activeWallet === w.id && (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                                    className="absolute top-full right-0 mt-3 w-44 bg-white border border-slate-100 rounded-[20px] shadow-2xl p-1.5 z-[60] overflow-hidden"
                                                >
                                                    <div className="p-2.5 border-b border-slate-50 bg-slate-50/50 rounded-t-[15px] mb-1">
                                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">{w.label} Actions</p>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        {w.actions.map((act, idx) => (
                                                            <button 
                                                                key={idx}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    if (act === 'Add Funds') navigate('/add-money');
                                                                    if (act === 'History') navigate('/reports');
                                                                    if (act === 'AEPS Hub') navigate('/aeps');
                                                                    if (act === 'Usage') navigate('/reports');
                                                                    setActiveWallet(null);
                                                                }}
                                                                className="w-full text-left px-3 py-2 text-[9px] font-bold text-slate-600 hover:bg-slate-50 hover:text-blue-600 rounded-lg transition-colors uppercase tracking-tight"
                                                            >
                                                                {act}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
                )}

                <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 pb-16 lg:pb-0">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={location.pathname}
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.98 }}
                            transition={{ duration: 0.2 }}
                            className="h-full"
                        >
                            <Outlet />
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* Mobile Bottom Navigation — visible only on < lg screens */}
            <MobileBottomNav />
        </div>
    );
};

export default RetailerLayout;
