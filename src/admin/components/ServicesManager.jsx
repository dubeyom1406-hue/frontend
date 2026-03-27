import React, { useState, useEffect } from 'react';
import { 
    LayoutGrid, Plus, Trash2, Edit3, Image as ImageIcon, 
    CheckCircle2, AlertTriangle, Search, Filter, 
    ArrowRight, Upload, X, Package, Shield, Zap, Send, Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { dataService } from '../../services/dataService';

const ServicesManager = ({ type = 'list' }) => {
    const [services, setServices] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterCategory, setFilterCategory] = useState('All');
    const [status, setStatus] = useState(null);

    // Form states for adding service
    const [formData, setFormData] = useState({
        label: '',
        category: 'Banking',
        details: '',
        description: '',
        image: null,
        icon: 'package'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        loadServices();
        // Set up listener for data updates
        window.addEventListener('dataUpdated', loadServices);
        return () => window.removeEventListener('dataUpdated', loadServices);
    }, []);

    const loadServices = () => {
        const data = dataService.getServices();
        setServices(data);
        setIsLoading(false);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setFormData(prev => ({ ...prev, image: reader.result }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            const res = await dataService.addService(formData);
            if (res.success) {
                setStatus({ type: 'success', message: 'Service added successfully!' });
                setFormData({ label: '', category: 'Banking', details: '', description: '', image: null, icon: 'package' });
            } else {
                setStatus({ type: 'error', message: res.message || 'Failed to add service' });
            }
        } catch (error) {
            setStatus({ type: 'error', message: 'Connection error' });
        } finally {
            setIsSubmitting(false);
            setTimeout(() => setStatus(null), 3000);
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure you want to delete this service?')) {
            await dataService.deleteService(id);
            setStatus({ type: 'success', message: 'Service deleted' });
            setTimeout(() => setStatus(null), 2000);
        }
    };

    const categories = ['All', ...new Set(services.map(s => s.category))];
    const filteredServices = services.filter(s => {
        const matchesSearch = s.label.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             s.category.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesFilter = filterCategory === 'All' || s.category === filterCategory;
        return matchesSearch && matchesFilter;
    });

    const getIcon = (iconName, size = 20) => {
        switch(iconName?.toLowerCase()) {
            case 'zap': return <Zap size={size} />;
            case 'send': return <Send size={size} />;
            case 'shield': return <Shield size={size} />;
            case 'flame': return <Flame size={size} />;
            case 'package': return <Package size={size} />;
            default: return <Package size={size} />;
        }
    };

    if (type === 'add') {
        return (
            <div className="max-w-4xl mx-auto space-y-6">
                <header className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-2xl font-black text-slate-800 uppercase italic tracking-tight">Add New Service</h1>
                        <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Configure and launch a new fintech service</p>
                    </div>
                </header>

                <AnimatePresence>
                    {status && (
                        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className={`p-4 rounded-2xl flex items-center gap-3 ${status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
                            {status.type === 'success' ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
                            <span className="text-sm font-bold">{status.message}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-8 md:p-12 space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {/* Left Side: Basic Info */}
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Service Name</label>
                                    <input required type="text" placeholder="e.g. AEPS Withdrawal"
                                        value={formData.label} onChange={e => setFormData({...formData, label: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-sm outline-none focus:border-indigo-400 focus:bg-white transition-all font-bold" />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Category</label>
                                    <input required type="text" placeholder="e.g. Banking"
                                        value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-sm outline-none focus:border-indigo-400 focus:bg-white transition-all font-bold" />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Service Details (Description)</label>
                                    <textarea rows={4} placeholder="Write something about this service..."
                                        value={formData.details} onChange={e => setFormData({...formData, details: e.target.value})}
                                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-5 py-3.5 text-sm outline-none focus:border-indigo-400 focus:bg-white transition-all font-bold resize-none" />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest">Select Default Icon (Optional)</label>
                                    <div className="grid grid-cols-5 gap-3">
                                        {['Zap', 'Send', 'Shield', 'Flame', 'Package'].map(icon => (
                                            <button key={icon} type="button" 
                                                onClick={() => setFormData({...formData, icon: icon.toLowerCase()})}
                                                className={`aspect-square rounded-xl flex items-center justify-center border-2 transition-all ${formData.icon === icon.toLowerCase() ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-slate-100 bg-slate-50 text-slate-400 hover:bg-white'}`}>
                                                {getIcon(icon, 18)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Media Upload */}
                            <div className="space-y-6">
                                <label className="block text-[10px] font-black text-slate-400 uppercase mb-2 tracking-widest text-center">Service Banner / Icon Image</label>
                                <div className="relative group">
                                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" id="service-image-upload" />
                                    <label htmlFor="service-image-upload" className="cursor-pointer">
                                        {formData.image ? (
                                            <div className="relative aspect-square rounded-[2rem] overflow-hidden border-4 border-white shadow-xl">
                                                <img src={formData.image} className="w-full h-full object-cover" alt="Preview" />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <Upload className="text-white" size={30} />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="aspect-square rounded-[2rem] border-4 border-dashed border-slate-100 bg-slate-50 flex flex-col items-center justify-center group-hover:border-indigo-200 group-hover:bg-indigo-50/50 transition-all">
                                                <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300 mb-4 group-hover:text-indigo-400">
                                                    <Upload size={24} />
                                                </div>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Click to upload photo</p>
                                            </div>
                                        )}
                                    </label>
                                    {formData.image && (
                                        <button onClick={() => setFormData({...formData, image: null})}
                                            className="absolute -top-2 -right-2 w-8 h-8 bg-rose-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-rose-600 transition-colors">
                                            <X size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 border-t border-slate-100 flex justify-end">
                            <button type="submit" disabled={isSubmitting}
                                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50">
                                {isSubmitting ? 'Processing...' : 'Add New Service'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-black text-slate-800 uppercase italic tracking-tight">Financial Services Inventory</h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Live listing of all active services and APIs</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                        <input type="text" placeholder="Search services..." 
                            value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                            className="bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-2.5 text-xs font-bold outline-none focus:border-indigo-400 w-full md:w-64 transition-all" />
                    </div>
                </div>
            </header>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {categories.map(cat => (
                    <button key={cat} onClick={() => setFilterCategory(cat)}
                        className={`px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${filterCategory === cat ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-slate-200 text-slate-400 hover:border-indigo-400'}`}>
                        {cat}
                    </button>
                ))}
            </div>

            {isLoading ? (
                <div className="flex items-center justify-center min-h-[40vh]">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
                </div>
            ) : filteredServices.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredServices.map((service, idx) => (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                             key={service.id} className="group bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all overflow-hidden p-6">
                            
                            <div className="relative mb-4">
                                {service.image ? (
                                    <div className="aspect-video rounded-2xl overflow-hidden bg-slate-100">
                                        <img src={service.image} className="w-full h-full object-cover" alt={service.label} />
                                    </div>
                                ) : (
                                    <div className="aspect-video rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center text-indigo-400">
                                        {getIcon(service.icon, 32)}
                                    </div>
                                )}
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <button onClick={() => handleDelete(service.id)} 
                                        className="w-8 h-8 rounded-lg bg-white shadow-md flex items-center justify-center text-rose-500 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-[9px] font-black text-slate-500 uppercase tracking-widest">{service.category}</span>
                                    <div className={`w-2 h-2 rounded-full ${service.active ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                                </div>
                                <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-tight">{service.label}</h3>
                                <div className="pt-3 border-t border-slate-50 flex items-center justify-between">
                                    <span className="text-[10px] font-bold text-slate-400">ID: #{service.id.toString().slice(-4)}</span>
                                    <button className="text-indigo-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-1 hover:gap-2 transition-all">
                                        Details <ArrowRight size={10} />
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center min-h-[40vh] bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-200 p-12 text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center text-slate-300 mb-4">
                        <Search size={24} />
                    </div>
                    <h3 className="text-lg font-black text-slate-800 uppercase italic">No services found</h3>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Try adjusting your filters or search keywords</p>
                </div>
            )}
        </div>
    );
};

export default ServicesManager;
