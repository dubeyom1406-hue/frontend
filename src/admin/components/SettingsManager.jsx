import React, { useState, useEffect } from 'react';
import { 
    FileText, Settings, Package, Landmark, Save, Trash2, 
    Plus, Search, CheckCircle2, AlertCircle, X, Clock,
    LayoutGrid, ChevronRight, Globe, Mail, Phone, MapPin,
    ArrowUpRight, ArrowDownRight, Edit3
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dataService } from '../../services/dataService';

const Badge = ({ children, color = 'blue' }) => {
    const colors = {
        blue: 'bg-blue-50 text-blue-600 border-blue-100',
        emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100',
        orange: 'bg-orange-50 text-orange-600 border-orange-100',
        rose: 'bg-rose-50 text-rose-600 border-rose-100',
        slate: 'bg-slate-50 text-slate-600 border-slate-100',
        amber: 'bg-amber-50 text-amber-600 border-amber-100'
    };
    return (
        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black border uppercase tracking-tighter ${colors[color]}`}>
            {children}
        </span>
    );
};

const SettingsManager = ({ type = 'logs' }) => {
    const [loading, setLoading] = useState(true);
    const [status, setStatus] = useState(null);
    
    // Data States
    const [logs, setLogs] = useState([]);
    const [platformSettings, setPlatformSettings] = useState({
        siteName: '',
        contactEmail: '',
        supportPhone: '',
        address: ''
    });
    const [packages, setPackages] = useState([]);
    const [commissions, setCommissions] = useState([]);
    
    // Form States
    const [showPkgModal, setShowPkgModal] = useState(false);
    const [editingPkg, setEditingPkg] = useState(null);
    const [pkgForm, setPkgForm] = useState({ name: '', price: '', features: '' });

    useEffect(() => {
        loadData();
    }, [type]);

    const loadData = async () => {
        setLoading(true);
        try {
            if (type === 'logs') setLogs(dataService.getAdminLogs());
            if (type === 'main') setPlatformSettings(dataService.getPlatformSettings());
            if (type === 'package') setPackages(dataService.getPackages());
            if (type === 'commission') setCommissions(dataService.getCommissions());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSettings = async (e) => {
        e.preventDefault();
        const res = dataService.updatePlatformSettings(platformSettings);
        if (res.success) {
            setStatus({ type: 'success', message: 'Settings updated successfully' });
            setTimeout(() => setStatus(null), 3000);
        }
    };

    const handleSavePackage = (e) => {
        e.preventDefault();
        const res = dataService.savePackage({ ...pkgForm, id: editingPkg?.id });
        if (res.success) {
            loadData();
            setShowPkgModal(false);
            setPkgForm({ name: '', price: '', features: '' });
            setEditingPkg(null);
        }
    };

    const handleUpdateComm = (comm) => {
        dataService.updateCommission(comm);
        loadData();
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-[400px]">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="space-y-8 pb-20">
            {/* Status Feedback */}
            <AnimatePresence>
                {status && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
                        className={`p-4 rounded-2xl border flex items-center gap-3 shadow-lg ${status.type === 'success' ? 'bg-emerald-50 border-emerald-100 text-emerald-800' : 'bg-rose-50 border-rose-100 text-rose-800'}`}>
                        {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertCircle size={20} />}
                        <span className="text-sm font-bold tracking-tight">{status.message}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- ADMIN LOGS --- */}
            {type === 'logs' && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-slate-50/50">
                        <div>
                            <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tight">Activity Logs</h2>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Audit trail for all administrative actions</p>
                        </div>
                        <FileText className="text-slate-400" size={24} />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Timestamp</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Action</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {logs.map(log => (
                                    <tr key={log.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-5 text-xs font-bold text-slate-500">
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-8 py-5">
                                            <span className="text-xs font-black text-slate-700 uppercase tracking-tight italic">{log.admin}</span>
                                        </td>
                                        <td className="px-8 py-5 text-sm font-bold text-slate-600">{log.action}</td>
                                        <td className="px-8 py-5">
                                            <Badge color={log.status === 'Success' ? 'emerald' : 'rose'}>{log.status}</Badge>
                                        </td>
                                    </tr>
                                ))}
                                {logs.length === 0 && (
                                    <tr>
                                        <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-bold">No activity logs found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- MAIN SETTINGS --- */}
            {type === 'main' && (
                <div className="max-w-4xl">
                    <form onSubmit={handleUpdateSettings} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-10">
                        <div className="flex items-center gap-4 mb-10 border-b border-slate-50 pb-8">
                             <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                 <Globe size={24} />
                             </div>
                             <div>
                                <h3 className="text-xl font-black text-slate-800 uppercase italic">Branding & Identity</h3>
                                <p className="text-slate-400 font-bold text-[10px] uppercase mt-1 tracking-widest">Configure your public platform presence</p>
                             </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8 mb-10">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Organization Name</label>
                                <div className="relative">
                                    <Settings className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input type="text" value={platformSettings.siteName} 
                                        onChange={e => setPlatformSettings({...platformSettings, siteName: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-12 py-4 text-sm font-bold focus:bg-white focus:border-blue-400 transition-all outline-none text-slate-700"
                                        placeholder="Company Name" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Support Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input type="email" value={platformSettings.contactEmail} 
                                        onChange={e => setPlatformSettings({...platformSettings, contactEmail: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-12 py-4 text-sm font-bold focus:bg-white focus:border-blue-400 transition-all outline-none text-slate-700"
                                        placeholder="support@example.com" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Hotline Number</label>
                                <div className="relative">
                                    <Phone className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input type="text" value={platformSettings.supportPhone} 
                                        onChange={e => setPlatformSettings({...platformSettings, supportPhone: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-12 py-4 text-sm font-bold focus:bg-white focus:border-blue-400 transition-all outline-none text-slate-700"
                                        placeholder="+91 ...." />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 tracking-widest">Headquarters Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input type="text" value={platformSettings.address} 
                                        onChange={e => setPlatformSettings({...platformSettings, address: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-12 py-4 text-sm font-bold focus:bg-white focus:border-blue-400 transition-all outline-none text-slate-700"
                                        placeholder="City, State, Country" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-6 border-t border-slate-50">
                            <button type="submit" className="flex items-center gap-3 bg-[#18181b] text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-slate-200">
                                <Save size={16} /> Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* --- PACKAGE MANAGER --- */}
            {type === 'package' && (
                <div className="space-y-6">
                    <div className="flex items-center justify-between mb-2">
                        <div>
                            <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tight">Access Tiers</h2>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Manage retailer membership packages</p>
                        </div>
                        <button onClick={() => { setEditingPkg(null); setPkgForm({name:'', price:'', features:''}); setShowPkgModal(true); }}
                            className="flex items-center gap-3 bg-indigo-600 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:scale-105 transition-all">
                            <Plus size={16} /> Create New Package
                        </button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6">
                        {packages.map(pkg => (
                            <motion.div layout key={pkg.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all relative overflow-hidden">
                                <div className="absolute top-0 left-0 w-2 h-full bg-indigo-600 opacity-0 group-hover:opacity-100 transition-all"></div>
                                <div className="flex justify-between items-start mb-6">
                                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                                        <Package size={24} />
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                        <button onClick={() => { setEditingPkg(pkg); setPkgForm(pkg); setShowPkgModal(true); }} className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center hover:bg-blue-100"><Edit3 size={14} /></button>
                                        <button onClick={() => dataService.deletePackage(pkg.id) && loadData()} className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center hover:bg-rose-100"><Trash2 size={14} /></button>
                                    </div>
                                </div>
                                <h3 className="text-lg font-black text-slate-800 uppercase italic">{pkg.name}</h3>
                                <div className="mt-2 flex items-baseline gap-1">
                                    <span className="text-2xl font-black text-indigo-600 tracking-tighter italic">₹{pkg.price}</span>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">/ Lifetime</span>
                                </div>
                                <div className="mt-6 space-y-3">
                                    {pkg.features.split(',').map((f, i) => (
                                        <div key={i} className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                            <div className="w-1 h-1 bg-emerald-400 rounded-full"></div>
                                            {f.trim()}
                                        </div>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* --- COMMISSION --- */}
            {type === 'commission' && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 border-b border-slate-50 flex items-center justify-between bg-amber-50/20">
                        <div>
                            <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tight">Earning Structures</h2>
                            <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mt-1">Set fine-grained commissions for each fintech module</p>
                        </div>
                        <Landmark className="text-amber-500" size={24} />
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50/50">
                                <tr>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fintech Service</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Mode</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Retailer</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Distributor</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Master</th>
                                    <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Update</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {commissions.map(comm => (
                                    <tr key={comm.serviceId} className="hover:bg-slate-50/30 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-3">
                                                 <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-xs font-black italic">
                                                     {comm.serviceName.substring(0,2)}
                                                 </div>
                                                 <span className="text-sm font-black text-slate-700 uppercase italic tracking-tight">{comm.serviceName}</span>
                                            </div>
                                        </td>
                                        <td className="px-8 py-5">
                                            <select 
                                                value={comm.commType}
                                                onChange={e => handleUpdateComm({...comm, commType: e.target.value})}
                                                className="bg-slate-50 border border-slate-100 rounded-xl px-2 py-1.5 text-[10px] font-black uppercase outline-none focus:border-indigo-400 transition-all">
                                                <option>Flat</option>
                                                <option>Percentage</option>
                                            </select>
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <input type="text" value={comm.retailerComm}
                                                onChange={e => handleUpdateComm({...comm, retailerComm: e.target.value})}
                                                className="w-16 bg-slate-50 border border-slate-100 rounded-xl px-2 py-1.5 text-xs font-black text-center text-emerald-600 outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <input type="text" value={comm.distributorComm}
                                                onChange={e => handleUpdateComm({...comm, distributorComm: e.target.value})}
                                                className="w-16 bg-slate-50 border border-slate-100 rounded-xl px-2 py-1.5 text-xs font-black text-center text-blue-600 outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                                        </td>
                                        <td className="px-8 py-5 text-center">
                                            <input type="text" value={comm.masterComm}
                                                onChange={e => handleUpdateComm({...comm, masterComm: e.target.value})}
                                                className="w-16 bg-slate-50 border border-slate-100 rounded-xl px-2 py-1.5 text-xs font-black text-center text-indigo-600 outline-none focus:bg-white focus:border-indigo-400 transition-all" />
                                        </td>
                                        <td className="px-8 py-5">
                                            <Badge color="emerald">Live</Badge>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- PACKAGE MODAL --- */}
            <AnimatePresence>
                {showPkgModal && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md"
                        onClick={() => setShowPkgModal(false)}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-white w-full max-w-lg rounded-[3rem] p-10 shadow-2xl"
                            onClick={e => e.stopPropagation()}>
                            <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-50">
                                <h3 className="text-2xl font-black text-slate-800 uppercase italic">{editingPkg ? 'Edit Package' : 'New Package'}</h3>
                                <button onClick={() => setShowPkgModal(false)} className="text-slate-400 hover:text-rose-600 transition-colors"><X size={24} /></button>
                            </div>
                            <form onSubmit={handleSavePackage} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Package Name</label>
                                    <input required type="text" value={pkgForm.name} onChange={e => setPkgForm({...pkgForm, name: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-400 transition-all" placeholder="e.g. VIP Retailer" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Price (₹)</label>
                                    <input required type="number" value={pkgForm.price} onChange={e => setPkgForm({...pkgForm, price: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-400 transition-all" placeholder="999" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Included Features (Comma separated)</label>
                                    <textarea rows={4} value={pkgForm.features} onChange={e => setPkgForm({...pkgForm, features: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:border-indigo-400 transition-all resize-none" placeholder="e.g. AEPS, Recharge, Support" />
                                </div>
                                <div className="pt-6">
                                    <button type="submit" className="w-full bg-[#18181b] text-white py-5 rounded-[2rem] text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-95 transition-all">
                                        Save Package Template
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default SettingsManager;
