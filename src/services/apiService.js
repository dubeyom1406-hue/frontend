const BASE_URL = import.meta.env.VITE_API_URL || "/api";
const TWO_FACTOR_API_KEY = import.meta.env.VITE_2FACTOR_API_KEY || "YOUR_API_KEY_HERE";

const getToken = () => localStorage.getItem("rupiksha_token");
const useLocalOnly = true;

// Common fetch with JWT
const apiFetch = async (endpoint, options = {}) => {
  if (useLocalOnly) {
    console.log(`MOCK API CALL: ${endpoint}`, options);
    const d = localStorage.getItem('rupiksha_data');
    const defaultUsers = [
      { id: 1, name: 'System Admin', username: 'admin', mobile: '9289309524', role: 'ADMIN', status: 'Approved', balance: '0.00', email: 'admin@rupiksha.in', password: 'Admin@123' },
      { id: 2, name: 'Test Retailer', username: '9931426338', mobile: '9931426338', role: 'RETAILER', status: 'Approved', balance: '0.00', email: 'retailer@rupiksha.in', password: 'Ret@123' },
      { id: 3, name: 'Test Distributor', username: '8210350444', mobile: '8210350444', role: 'DISTRIBUTOR', status: 'Approved', balance: '0.00', email: 'dist@rupiksha.in', password: 'Dist@123' },
      { id: 4, name: 'Test SuperDist', username: '8877665544', mobile: '8877665544', role: 'SUPER_DISTRIBUTOR', status: 'Approved', balance: '0.00', email: 'super@rupiksha.in', password: 'Sup@123' }
    ];

    let data = d ? JSON.parse(d) : { users: defaultUsers, loans: [], transactions: [] };
    
    // Ensure default users are always present in the users array
    if (d) {
      defaultUsers.forEach(defUser => {
        if (!data.users.find(u => u.username === defUser.username)) {
          data.users.push(defUser);
        }
      });
    }

    // Standard mock responses
    if (endpoint.includes("/auth/register")) {
      const newUser = options.body ? JSON.parse(options.body) : {};
      const userExists = data.users.find(u => 
        (u.username && u.username === newUser.mobile) || 
        (u.mobile && u.mobile === newUser.mobile)
      );

      if (userExists) {
        return { success: false, message: "User already exists with this mobile number." };
      }

      const userWithId = { 
        ...newUser, 
        id: Date.now(), 
        username: newUser.mobile,
        status: 'Pending', 
        balance: '0.00',
        createdAt: new Date().toISOString()
      };
      data.users.push(userWithId);
      localStorage.setItem('rupiksha_data', JSON.stringify(data));
      return { success: true, message: "Registration successful. Please wait for admin approval.", registrationId: userWithId.id };
    }

    if (endpoint.includes("/auth/login")) {
      const { username, password } = options.body ? JSON.parse(options.body) : {};
      const cleanUsername = (username || '').trim().toLowerCase();
      const cleanPassword = (password || '').trim();
      const user = data.users.find(u => (
        (u.username && u.username.toLowerCase() === cleanUsername) || 
        (u.mobile && u.mobile.toLowerCase() === cleanUsername)
      ));

      if (user) {
        if (user.status !== 'Approved') {
          return { success: false, message: `Your account status is ${user.status}. Please contact admin.` };
        }
        if ((user.password || '').trim() === cleanPassword) {
           return { success: true, token: "mock_token_" + Date.now(), user: { ...user } };
        }
        return { success: false, message: "Invalid credentials" };
      }
      return { success: false, message: "User not found" };
    }

    if (endpoint.includes("/verify-otp")) {
      const { identity, otp } = options.body ? JSON.parse(options.body) : {};
      const user = data.users.find(u => (
        (u.username && u.username === identity) || 
        (u.mobile && u.mobile === identity)
      ));

      if (user) {
        if (user.status !== 'Approved') {
          return { success: false, message: `Your account status is ${user.status}. Please contact admin.` };
        }
        // Mock OTP always passes for testing if it's 6 digits or specific ones
        return { success: true, token: "mock_token_" + Date.now(), user: { ...user } };
      }
      return { success: false, message: "User not found" };
    }

    if (endpoint.includes("/send-mobile-otp")) {
        const { mobile } = options.body ? JSON.parse(options.body) : {};
        const user = data.users.find(u => u.mobile === mobile);
        if (!user) return { success: false, message: "Mobile number not registered." };
        return { success: true, message: "OTP sent successfully." };
    }
    
    if (endpoint.includes("/user/profile")) {
      const currentUser = JSON.parse(localStorage.getItem('rupiksha_user') || '{}');
      return { success: true, user: currentUser };
    }

    if (endpoint.includes("/admin/users")) {
      if (options.method === 'POST') {
          const newUser = JSON.parse(options.body);
          const userWithId = { 
              ...newUser, 
              id: Date.now(), 
              status: 'Approved', 
              balance: '0.00',
              mobile: newUser.phone || newUser.mobile || newUser.username
          };
          data.users.push(userWithId);
          localStorage.setItem('rupiksha_data', JSON.stringify(data));
          return { success: true, user: userWithId };
      }
      if (options.method === 'DELETE') {
          const id = endpoint.split('/').pop();
          data.users = data.users.filter(u => String(u.id) !== String(id) && u.username !== id);
          localStorage.setItem('rupiksha_data', JSON.stringify(data));
          return { success: true };
      }
      return { success: true, users: data.users };
    }

    if (endpoint.includes("/dashboard/stats")) {
      const retailers = data.users.filter(u => u.role === 'RETAILER').length;
      const distributors = data.users.filter(u => u.role === 'DISTRIBUTOR').length;
      const superDists = data.users.filter(u => u.role === 'SUPER_DISTRIBUTOR').length;
      
      return { 
          success: true, 
          stats: { 
              totalMembers: data.users.length,
              retailers,
              distributors,
              superDists,
              pendingKyc: 0,
              totalBalance: data.users.reduce((acc, u) => acc + parseFloat(u.balance || 0), 0).toFixed(2)
          },
          totalBalance: "0.00"
      };
    }

    if (endpoint.includes("/transactions")) {
        return { success: true, transactions: data.transactions || [], balance: "0.00" };
    }
    return { success: true, message: "Mock response", status: "success" };
  }
  const token = getToken();
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  if (res.status === 401) {
    console.error("DEBUG: 401 Unauthorized detected in apiFetch", { endpoint });
    localStorage.removeItem("rupiksha_token");
    // Redirect to correct login based on who was logged in
    try {
      const savedUserStr = localStorage.getItem("rupiksha_user");
      const savedUser = JSON.parse(savedUserStr || "null");
      const role = String(savedUser?.role || "").toUpperCase();
      console.log("DEBUG: User role for redirect:", role);
      const adminRoles = ["ADMIN", "SUPERADMIN", "NATIONAL_HEADER", "STATE_HEADER", "REGIONAL_HEADER", "EMPLOYEE"];
      localStorage.removeItem("rupiksha_user");
      sessionStorage.removeItem("admin_auth");
      const target = adminRoles.includes(role) ? "/admin-login" : "/login";
      console.log("DEBUG: Redirecting to:", target);
      window.location.href = target;
    } catch (e) {
      console.error("DEBUG: Error in 401 handler", e);
      localStorage.removeItem("rupiksha_user");
      window.location.href = "/login";
    }
    return;
  }
  if (!res.ok) {
    let errorMsg = `API Error: ${res.status}`;
    try {
        const errJson = await res.json();
        errorMsg = errJson.message || errJson.error || errorMsg;
    } catch (e) { }
    throw new Error(errorMsg);
  }
  return res.json();
};

// ─── AUTH ────────────────────────────────────────────────────────────────────
export const authService = {
  login: (username, password) =>
    apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),
  register: (userData) =>
    apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify(userData),
    }),
  logout: () => {
    localStorage.removeItem("rupiksha_token");
    localStorage.removeItem("rupiksha_user");
    return Promise.resolve({ success: true });
  },
  otpRequest: (mobile) => otpService.sendMobileOtp(mobile),
  forgotPassword: (data) =>
    apiFetch("/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── DASHBOARD STATS (Live data) ──────────────────────────────────────────────
export const dashboardService = {
  // territory = "india" | "UP" | "Lucknow" etc.
  getStats: (territory = "india") =>
    apiFetch(`/dashboard/stats?territory=${territory}`),

  // Top bar data - charges, commission, wallet
  getTopBarData: () => apiFetch("/dashboard/topbar"),
};

// ─── EMPLOYEE / HEADER USER MANAGEMENT ────────────────────────────────────────
export const employeeService = {
  // Sab header users ki list
  getAll: () => apiFetch("/employees"),

  // Ek user ka detail
  getById: (id) => apiFetch(`/employees/${id}`),

  // Naya header user banao
  create: (userData) =>
    apiFetch("/employees/create", {
      method: "POST",
      body: JSON.stringify(userData),
    }),

  // User update karo
  update: (id, userData) =>
    apiFetch(`/employees/${id}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    }),

  // Activate / Deactivate
  toggleStatus: (id) =>
    apiFetch(`/employees/${id}/toggle-status`, { method: "PUT" }),

  // Delete
  delete: (id) =>
    apiFetch(`/employees/${id}`, { method: "DELETE" }),

  // Permissions
  getPermissions: (userId) => apiFetch(`/employees/${userId}/permissions`),
  updatePermissions: (userId, permissions) =>
    apiFetch(`/employees/${userId}/permissions`, {
      method: "PUT",
      body: JSON.stringify({ permissions }),
    }),
};

// ─── PERMISSIONS ──────────────────────────────────────────────────────────────
export const permissionService = {
  // Kisi user ki permissions lo
  getByUserId: (userId) => employeeService.getPermissions(userId),

  // Kisi user ki permissions update karo
  update: (userId, permissions) => employeeService.updatePermissions(userId, permissions),
};

// ─── LIVE LOCATION ────────────────────────────────────────────────────────────
export const locationService = {
  // Apni location bhejo
  updateMyLocation: (lat, lng) =>
    apiFetch("/location/update", {
      method: "PUT",
      body: JSON.stringify({ latitude: lat, longitude: lng, timestamp: new Date().toISOString() }),
    }),

  // Sab users ki location lo (admin ke liye map)
  getAllLocations: () => apiFetch("/location/all"),

  // Ek user ki location
  getUserLocation: (userId) => apiFetch(`/location/${userId}`),
};

// ─── ADMIN ───────────────────────────────────────────────────────────────────
export const adminService = {
  getUsers: () => apiFetch("/admin/users"),
  createUser: (userData) =>
    apiFetch("/admin/users", {
      method: "POST",
      body: JSON.stringify(userData),
    }),
  updateUser: (userId, userData) =>
    apiFetch(`/admin/users/${userId}`, {
      method: "PUT",
      body: JSON.stringify(userData),
    }),
  deleteUser: (userId) =>
    apiFetch(`/admin/users/${userId}`, {
      method: "DELETE",
    }),
};

// ─── MEMBERS ──────────────────────────────────────────────────────────────────
export const memberService = {
  getAll: (territory) => apiFetch(`/members?territory=${territory}`),
  getRequests: () => apiFetch("/members/requests"),
  getComplaints: () => apiFetch("/members/complaints"),
};

// ─── WALLET ───────────────────────────────────────────────────────────────────
export const walletService = {
  getFundRequests: () => apiFetch("/admin/wallet/fund-requests"),
  getUserWallets: () => apiFetch("/admin/wallet/user-wallets"),
  performAction: (action, data) =>
    apiFetch(`/admin/wallet/${action}`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  approveRequest: (requestId, remark) =>
    apiFetch("/admin/wallet/approve-request", {
      method: "POST",
      body: JSON.stringify({ requestId, remark }),
    }),
  rejectRequest: (requestId, remark) =>
    apiFetch("/admin/wallet/reject-request", {
      method: "POST",
      body: JSON.stringify({ requestId, remark }),
    }),
  getAll: () => apiFetch("/wallet"),
  creditFund: (userId, amount) =>
    apiFetch("/wallet/credit", {
      method: "POST",
      body: JSON.stringify({ userId, amount }),
    }),
  debitFund: (userId, amount) =>
    apiFetch("/wallet/debit", {
      method: "POST",
      body: JSON.stringify({ userId, amount }),
    }),
  getPendingRequests: () => apiFetch("/wallet/pending"),
  lockAmount: (userId, amount) =>
    apiFetch("/wallet/lock", {
      method: "POST",
      body: JSON.stringify({ userId, amount }),
    }),
};

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
export const transactionService = {
  getAll: (filters = {}) => {
    const params = new URLSearchParams(filters).toString();
    return apiFetch(`/transactions?${params}`);
  },
  getBalance: () => apiFetch("/transactions/balance"),
  logTransaction: (data) =>
    apiFetch("/transactions/log", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getAeps: (territory) => apiFetch(`/transactions/aeps?territory=${territory}`),
  getPayout: (territory) => apiFetch(`/transactions/payout?territory=${territory}`),
  getDmt: (territory) => apiFetch(`/transactions/dmt?territory=${territory}`),
  getBbps: (territory) => apiFetch(`/transactions/bbps?territory=${territory}`),
};

// ─── USER PROFILE ─────────────────────────────────────────────────────────────
export const userService = {
  getProfile: () => apiFetch("/user/profile"),
  updateProfile: (data) =>
    apiFetch("/user/update-profile", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  submitAepsKyc: (data) =>
    apiFetch("/user/submit-aeps-kyc", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  submitKyc: (data) =>
    apiFetch("/user/submit-kyc", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getKycStatus: (userId) => apiFetch(`/user/kyc-status${userId ? `?userId=${userId}` : ""}`),
  refreshUser: (userId) =>
    apiFetch("/user/refresh", {
      method: "POST",
      body: JSON.stringify({ userId }),
    }),
};

// ─── VERIFICATION (PAN, Aadhaar, UPI) ─────────────────────────────────────────
export const verificationService = {
  verifyPan: (pan) =>
    apiFetch("/verify-pan", {
      method: "POST",
      body: JSON.stringify({ pan }),
    }),
  verifyUpi: (vpa) =>
    apiFetch("/verify-upi", {
      method: "POST",
      body: JSON.stringify({ vpa }),
    }),
  verifyAadhaar: (aadhaar) =>
    apiFetch("/verify-aadhaar", {
      method: "POST",
      body: JSON.stringify({ aadhaar }),
    }),
  verifyAccount: (accountData) =>
    apiFetch("/verify-account", {
      method: "POST",
      body: JSON.stringify(accountData),
    }),
  applyPan: (data) =>
    apiFetch("/pan/apply", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── RECHARGE & BBPS (Venus API) ──────────────────────────────────────────────
export const rechargeService = {
  doRecharge: (data) =>
    apiFetch("/recharge", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getBalance: () => apiFetch("/recharge-balance"),
  checkStatus: (merchantRefNo) =>
    apiFetch("/recharge-status", {
      method: "POST",
      body: JSON.stringify({ merchantRefNo }),
    }),
  fetchBill: (data) =>
    apiFetch("/bill-fetch", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  payBill: (data) =>
    apiFetch("/bill-pay", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── OTP & EMAILS ─────────────────────────────────────────────────────────────
export const otpService = {
  sendEmailOtp: (email, otp) =>
    apiFetch("/send-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),
  sendMobileOtp: async (mobile) => {
    try {
      const res = await fetch(`https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/${mobile}/AUTOGEN/OTP1`);
      const data = await res.json();
      if (data.Status === "Success") {
        // Store sessionId in localStorage to be retrieved during verification
        localStorage.setItem('2factor_session_id', data.Details);
        return { success: true, message: "OTP sent successfully." };
      }
      return { success: false, message: data.Details || "Failed to send OTP" };
    } catch (e) {
      console.error("2Factor Error:", e);
      return { success: false, message: "Network error sending OTP" };
    }
  },
  verifyOtp: async (identity, otp) => {
    try {
      const sessionId = localStorage.getItem('2factor_session_id');
      if (!sessionId) return { success: false, message: "Session expired. Please resend OTP." };

      const res = await fetch(`https://2factor.in/API/V1/${TWO_FACTOR_API_KEY}/SMS/VERIFY/${sessionId}/${otp}`);
      const data = await res.json();
      
      if (data.Status === "Success") {
        // OTP is correct, now we need to get user data from our backend/mock
        // We'll call the original apiFetch verify-otp to get user object
        const mockRes = await apiFetch("/verify-otp", {
            method: "POST",
            body: JSON.stringify({ identity, otp: "PASS" }) // "PASS" tells mock to just return user
        });
        return mockRes;
      }
      return { success: false, message: data.Details || "Invalid OTP" };
    } catch (e) {
      console.error("2Factor Verification Error:", e);
      return { success: false, message: "Verification failed" };
    }
  },
  sendAdminOtp: (email) =>
    apiFetch("/send-admin-otp", {
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  verifyAdminOtp: (email, otp) =>
    apiFetch("/verify-admin-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),
  sendApproval: (data) =>
    apiFetch("/send-approval", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  sendCredentials: (data) =>
    apiFetch("/send-credentials", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// ─── PAYMENTS (Razorpay) ──────────────────────────────────────────────────────
export const paymentService = {
  createOrder: (data) =>
    apiFetch("/create-order", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  verifyPayment: (paymentData) =>
    apiFetch("/verify-payment", {
      method: "POST",
      body: JSON.stringify(paymentData),
    }),
};

// ─── AEPS (Fingpay/NPCI) ──────────────────────────────────────────────────────
export const aepsService = {
  transaction: (payload) =>
    apiFetch("/aeps/transaction", {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  getHistory: (userId) => apiFetch(`/aeps/history?userId=${userId}`),
  statusCheck: (data) =>
    apiFetch("/aeps/status-check", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  recon: (data) =>
    apiFetch("/aeps/recon", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  whitelistRequest: (data) =>
    apiFetch("/aeps/whitelist-request", {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

