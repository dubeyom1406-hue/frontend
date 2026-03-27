import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dataService } from '../../services/dataService';
import { 
    LifeBuoy, MessageSquare, Phone, Mail, 
    ChevronRight, Plus, X, Search, 
    Clock, CheckCircle2, AlertCircle, Send
} from 'lucide-react';

const Badge = ({ children, status }) => {
    const config = {
        OPEN: 'bg-blue-50 text-blue-600 border-blue-100',
        IN_PROGRESS: 'bg-amber-50 text-amber-600 border-amber-100',
        RESOLVED: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        CLOSED: 'bg-slate-50 text-slate-500 border-slate-100'
    };
    return (
        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${config[status] || config.OPEN}`}>
            {children}
        </span>
    );
};

const Support = () => {
    const [tickets, setTickets] = useState([]);
    const [isRaising, setIsRaising] = useState(false);
    const [loading, setLoading] = useState(true);
    const [newTicket, setNewTicket] = useState({
        subject: '',
        category: 'TRANSACTION',
        message: ''
    });

    const currentUser = JSON.parse(localStorage.getItem('rupiksha_user'));

    const fetchTickets = async () => {
        try {
            const data = await dataService.getMyTickets(currentUser.id);
            setTickets(data);
        } catch (e) {
            console.error("Failed to fetch tickets", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
        const interval = setInterval(fetchTickets, 60000);
        return () => clearInterval(interval);
    }, []);

    const handleRaiseTicket = async (e) => {
        e.preventDefault();
        try {
            const res = await dataService.raiseTicket({
                ...newTicket,
                userId: currentUser.id
            });
            if (res.success) {
                setIsRaising(false);
                setNewTicket({ subject: '', category: 'TRANSACTION', message: '' });
                fetchTickets();
            }
        } catch (e) {
            alert("Failed to raise ticket. Please try again.");
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 lg:p-12 pb-24">
            <div className="max-w-6xl mx-auto space-y-10">
                
                {/* Header Area */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 mb-1">
                            <div className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em]">Help & Support Center</span>
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900 leading-tight">
                            How can we <span className="text-blue-600">help you?</span>
                        </h1>
                        <p className="text-slate-400 font-medium text-sm md:text-base">Quick resolutions for your business queries</p>
                    </div>
                    
                    <motion.button 
                        whileHover={{ scale: 1.02, y: -2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsRaising(true)}
                        className="px-8 py-4 bg-slate-900 text-white rounded-[24px] shadow-2xl shadow-slate-900/20 flex items-center gap-3 group transition-all"
                    >
                        <Plus size={20} className="group-hover:rotate-90 transition-transform" />
                        <span className="text-xs font-black uppercase tracking-widest">Raise New Ticket</span>
                    </motion.button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    
                    {/* LEFT: Ticket List */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="bg-white border border-slate-100 rounded-[40px] shadow-sm overflow-hidden">
                            <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/30">
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Your Support History</h3>
                                <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400">
                                    <Search size={14} />
                                    <span>Search tickets...</span>
                                </div>
                            </div>
                            
                            <div className="divide-y divide-slate-50">
                                {loading ? (
                                    <div className="p-20 flex flex-col items-center justify-center opacity-20">
                                        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Fetching your tickets...</p>
                                    </div>
                                ) : tickets.length > 0 ? (
                                    tickets.map((ticket) => (
                                        <motion.div 
                                            key={ticket.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="p-8 hover:bg-slate-50/50 transition-colors group cursor-pointer"
                                        >
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-[10px] font-black text-blue-600 uppercase">#{ticket.ticketId || ticket.id}</span>
                                                        <Badge status={ticket.status}>{ticket.status}</Badge>
                                                    </div>
                                                    <h4 className="text-lg font-black text-slate-800 tracking-tight group-hover:text-blue-600 transition-colors">{ticket.subject}</h4>
                                                </div>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase">{new Date(ticket.createdAt).toLocaleDateString()}</span>
                                            </div>
                                            <p className="text-sm text-slate-500 font-medium line-clamp-2 mb-4 leading-relaxed">{ticket.message}</p>
                                            <div className="flex items-center justify-between pt-4 border-t border-slate-50/50">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                        <LifeBuoy size={12} />
                                                        {ticket.category}
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                                        <MessageSquare size={12} />
                                                        {ticket.replies?.length || 0} Replies
                                                    </div>
                                                </div>
                                                <ChevronRight size={16} className="text-slate-300 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="p-24 flex flex-col items-center justify-center text-center">
                                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center text-slate-200 mb-6">
                                            <LifeBuoy size={40} />
                                        </div>
                                        <h4 className="text-lg font-black text-slate-800 tracking-tight">All systems clear!</h4>
                                        <p className="text-slate-400 font-medium text-sm mt-1 max-w-[240px]">You haven't raised any support tickets yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Quick Contact */}
                    <div className="lg:col-span-4 space-y-8">
                        
                        {/* Contact Cards */}
                        <div className="bg-white border border-slate-100 rounded-[40px] p-8 space-y-8 shadow-sm">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Direct Contact</h3>
                            
                            <div className="space-y-6">
                                <a href="tel:+918920150242" className="flex items-center gap-5 p-5 bg-blue-50/50 border border-blue-100 rounded-[28px] group hover:bg-blue-600 hover:border-blue-600 transition-all duration-300">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-blue-600 shadow-sm group-hover:scale-110 transition-transform">
                                        <Phone size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest group-hover:text-blue-200">Phone Support</p>
                                        <p className="text-sm font-black text-slate-800 group-hover:text-white">+91 8920150242</p>
                                    </div>
                                </a>

                                <a href="mailto:support@rupiksha.in" className="flex items-center gap-5 p-5 bg-emerald-50/50 border border-emerald-100 rounded-[28px] group hover:bg-emerald-600 hover:border-emerald-600 transition-all duration-300">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm group-hover:scale-110 transition-transform">
                                        <Mail size={20} />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest group-hover:text-emerald-200">Email Query</p>
                                        <p className="text-sm font-black text-slate-800 group-hover:text-white">support@rupiksha.in</p>
                                    </div>
                                </a>
                            </div>

                            <div className="pt-6 border-t border-slate-50">
                                <p className="text-[10px] font-bold text-slate-400 leading-relaxed">
                                    Our support team is active from <span className="text-slate-900 font-black">9:00 AM to 7:00 PM</span> (Mon-Sat).
                                </p>
                            </div>
                        </div>

                        {/* FAQ Shortlinks */}
                        <div className="bg-slate-900 rounded-[40px] p-8 text-white relative overflow-hidden group">
                            <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-blue-600 rounded-full blur-[60px] opacity-40 group-hover:scale-150 transition-transform duration-700" />
                            <div className="relative z-10 space-y-6">
                                <h3 className="text-sm font-black uppercase tracking-widest opacity-60">Common Help</h3>
                                <div className="space-y-4">
                                    {['How to add money?', 'DMT limit increase', 'AEPS Settlement rules', 'Privacy Policy'].map((q, i) => (
                                        <div key={i} className="flex justify-between items-center group/item cursor-pointer">
                                            <span className="text-xs font-bold text-white/80 group-hover/item:text-white transition-colors">{q}</span>
                                            <ChevronRight size={14} className="opacity-40 group-hover/item:opacity-100" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Raise Ticket Overlay */}
            <AnimatePresence>
                {isRaising && (
                    <>
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsRaising(false)}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100]"
                        />
                        <motion.div 
                            initial={{ opacity: 0, y: 50, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 50, scale: 0.95 }}
                            className="fixed inset-0 m-auto w-full max-w-lg h-fit bg-white rounded-[48px] shadow-2xl z-[101] overflow-hidden p-10"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter uppercase">New Support Ticket</h2>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Typical response time: 2-4 Hours</p>
                                </div>
                                <button onClick={() => setIsRaising(false)} className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 hover:text-rose-500 transition-all">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleRaiseTicket} className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Issue Category</label>
                                    <select 
                                        value={newTicket.category}
                                        onChange={(e) => setNewTicket({...newTicket, category: e.target.value})}
                                        className="w-full h-16 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold text-slate-800 focus:ring-2 focus:ring-blue-600/20 outline-none"
                                    >
                                        <option value="TRANSACTION">Transaction Issue</option>
                                        <option value="KYC">KYC/Onboarding</option>
                                        <option value="WALLET">Wallet/Fund Request</option>
                                        <option value="TECHNICAL">Technical Error</option>
                                        <option value="OTHER">Other Query</option>
                                    </select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                                    <input 
                                        type="text" 
                                        required
                                        placeholder="Briefly describe the issue"
                                        value={newTicket.subject}
                                        onChange={(e) => setNewTicket({...newTicket, subject: e.target.value})}
                                        className="w-full h-16 bg-slate-50 border-none rounded-2xl px-6 text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-blue-600/20 outline-none"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detailed Message</label>
                                    <textarea 
                                        required
                                        rows={4}
                                        placeholder="Explain the problem in detail..."
                                        value={newTicket.message}
                                        onChange={(e) => setNewTicket({...newTicket, message: e.target.value})}
                                        className="w-full bg-slate-50 border-none rounded-2xl p-6 text-sm font-bold text-slate-800 placeholder:text-slate-300 focus:ring-2 focus:ring-blue-600/20 outline-none resize-none"
                                    />
                                </div>

                                <motion.button 
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    className="w-full py-5 bg-blue-600 text-white rounded-[24px] text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3"
                                >
                                    <Send size={18} />
                                    Submit Ticket
                                </motion.button>
                            </form>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
};

export default Support;
