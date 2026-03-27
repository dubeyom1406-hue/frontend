import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ADMIN_ROLES = ['ADMIN', 'SUPERADMIN', 'NATIONAL_HEADER', 'STATE_HEADER', 'REGIONAL_HEADER', 'EMPLOYEE'];

const ProtectedRoute = ({ children, role }) => {
    const { user: ctxUser, loading } = useAuth();
    const location = useLocation();

    // --- Race-condition fix ---
    // If context user is null (state update hasn't propagated yet after login),
    // fall back to reading localStorage directly so we don't flash-redirect to login.
    let user = ctxUser;
    if (!user && !loading) {
        try {
            const token = localStorage.getItem('rupiksha_token');
            const savedUser = localStorage.getItem('rupiksha_user');
            if (token && savedUser) {
                const parsed = JSON.parse(savedUser);
                if (parsed && parsed.role) {
                    parsed.role = String(parsed.role).toUpperCase();
                    user = parsed;
                }
            }
        } catch (e) { /* ignore parse errors */ }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#f7f9fc]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Verifying Session...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        // Redirect to appropriate login based on required role
        const targetLogin = (role === 'ADMIN' || role === 'ADMIN_OR_EMPLOYEE') ? '/admin-login' : '/login';
        return <Navigate to={targetLogin} state={{ from: location }} replace />;
    }

    if (role) {
        const userRoles = (user.roles || [user.role]).map(r => String(r).toUpperCase());
        const isEmployee = ADMIN_ROLES.some(r => userRoles.includes(r));

        // ADMIN & SUPERADMIN have root access to all portals
        if (userRoles.includes('ADMIN') || userRoles.includes('SUPERADMIN')) {
            return children;
        }

        // Handle pseudoroles
        if (role === 'ADMIN_OR_EMPLOYEE') {
            if (isEmployee) return children;
        }

        if (role === 'DISTRIBUTOR') {
            if (userRoles.includes('DISTRIBUTOR') || userRoles.includes('SUPER_DISTRIBUTOR')) return children;
        }

        // Handle role mapping for Super Administrator / Distributor
        let hasAccess = userRoles.includes(role);
        if (!hasAccess && role === 'SUPERADMIN' && userRoles.includes('SUPER_DISTRIBUTOR')) {
            hasAccess = true;
        }

        if (!hasAccess) {
            // If user doesn't have the required role, redirect to their main dashboard
            const primaryRole = userRoles[0];
            if (primaryRole === 'RETAILER') return <Navigate to="/dashboard" replace />;
            if (primaryRole === 'DISTRIBUTOR') return <Navigate to="/distributor" replace />;
            if (primaryRole === 'SUPER_DISTRIBUTOR') return <Navigate to="/distributor" replace />;
            if (primaryRole === 'SUPERADMIN') return <Navigate to="/superadmin" replace />;
            if (ADMIN_ROLES.includes(primaryRole)) {
                return <Navigate to="/admin" replace />;
            }
            return <Navigate to="/login" replace />;
        }
    }

    return children;
};

export default ProtectedRoute;
