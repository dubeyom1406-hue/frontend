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
        


        window.addEventListener('dataUpdated', updateData);
        window.addEventListener('superadminDataUpdated', updateData);
        return () => {
            window.removeEventListener('dataUpdated', updateData);
            window.removeEventListener('superadminDataUpdated', updateData);
        };
    }, []);

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

        // Standard routes are handled by NavLink in Sidebar.jsx
        // We only close mobile sidebar here
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


                <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200 pb-16 lg:pb-0">
                    {/* News Bar Moved to Layout level for maximum visibility */}
                    {appData?.news && (
                        <div className="px-4 md:px-6 lg:px-10 pt-4">
                            <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-white border rounded-2xl md:rounded-[2rem] border-slate-100 py-2.5 md:py-3 flex items-center gap-3 md:gap-4 px-4 md:px-10 shadow-sm"
                            >
                                <div className="bg-blue-600 text-white text-[8px] md:text-[10px] font-black px-2.5 md:px-3 py-1 rounded-full uppercase tracking-widest whitespace-nowrap">
                                    Bulletin
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <motion.p 
                                        animate={{ x: [800, -800] }}
                                        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                                        className="text-[11px] md:text-sm font-bold text-slate-600 whitespace-nowrap"
                                    >
                                        {appData.news}
                                    </motion.p>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {/* Global Greeting Section - Restored to Layout level */}
                    {location.pathname === '/dashboard' && (
                        <div className="px-4 md:px-8 lg:px-10 pt-4 lg:pt-6">
                            <motion.div 
                                initial={{ opacity: 0, y: -20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 lg:gap-6 mb-2"
                            >
                                <div className="space-y-0.5">
                                    <h1 className="text-xl md:text-5xl font-black tracking-tighter text-slate-900 leading-tight">
                                        Hi {appData.currentUser?.fullName?.split(' ')[0] || appData.currentUser?.name?.split(' ')[0] || appData.currentUser?.businessName?.split(' ')[0] || 'Member'}, <span className="text-slate-400">Welcome Back!</span>
                                    </h1>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    <div className="h-full p-0" key={location.pathname}>
                        <Outlet />
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation — visible only on < lg screens */}
            <MobileBottomNav />
        </div>
    );
};

export default RetailerLayout;
