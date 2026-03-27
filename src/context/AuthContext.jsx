import { createContext, useContext, useState, useEffect } from "react";
import { dataService } from "../services/dataService";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase";

const AuthContext = createContext({
  user: null,
  setUser: () => {},
  permissions: [],
  loading: true,
  login: async () => ({ success: false }),
  logout: () => {},
  verifyPin: () => false,
  isLocked: false,
  setIsLocked: () => {},
  hasPermission: () => false,
  getToken: () => null,
});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isLocked, setIsLocked] = useState(false);
  
  // Real-time Firebase Listener for User Balance & Data
  useEffect(() => {
    if (!user || !user.username) return;

    const unsub = onSnapshot(doc(db, "users", user.username), (docSnapshot) => {
      if (docSnapshot.exists()) {
        const fireData = docSnapshot.data();
        setUser(prev => ({
          ...prev,
          ...fireData,
          balance: fireData.balance || 0,
          role: fireData.role ? String(fireData.role).toUpperCase() : prev?.role
        }));
      }
    });

    return () => unsub();
  }, [user?.username]);

  useEffect(() => {
    const token = localStorage.getItem("rupiksha_token");
    const savedUser = localStorage.getItem("rupiksha_user");

    if (token && savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        setPermissions(parsedUser.permissions || []);
      } catch (e) {
        logout();
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const res = await dataService.loginUser(username, password);
      if (res.success) {
        setUser(res.user);
        setPermissions(res.user.permissions || []);
        localStorage.setItem("last_activity", Date.now().toString());
        return { success: true };
      } else {
        return { success: false, message: res.message };
      }
    } catch (err) {
      return { success: false, message: err.message || "Login failed" };
    }
  };

  const logout = () => {
    const currentUser = JSON.parse(localStorage.getItem('rupiksha_user') || 'null');
    const role = String(currentUser?.role || '').toUpperCase();
    const isAdmin = ['ADMIN', 'SUPERADMIN', 'NATIONAL_HEADER', 'STATE_HEADER', 'REGIONAL_HEADER', 'EMPLOYEE'].includes(role);
    localStorage.clear();
    sessionStorage.clear();
    setUser(null);
    setPermissions([]);
    setIsLocked(false);
    window.location.href = isAdmin ? '/admin-login' : '/login';
  };

  const verifyPin = (pin) => {
    if (user && user.pin === pin) {
      setIsLocked(false);
      localStorage.setItem("last_activity", Date.now().toString());
      return true;
    }
    return false;
  };

  const hasPermission = (module, action) => {
    if (user?.role === "ADMIN" || user?.role === "SUPERADMIN") return true;
    return permissions.some(
      (p) => p.module === module && p.action === action && p.allowed
    );
  };

  const getToken = () => localStorage.getItem("rupiksha_token");

  return (
    <AuthContext.Provider value={{ user, setUser, permissions, loading, login, logout, verifyPin, isLocked, setIsLocked, hasPermission, getToken }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
