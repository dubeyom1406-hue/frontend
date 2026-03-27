import { sendOTPEmail, sendCredentialsEmail } from './emailService';
import { BACKEND_URL } from './config';
import {
    authService, userService, verificationService,
    rechargeService, otpService, transactionService
} from './apiService';
import mainLogo from '../assets/rupiksha_logo.png';
export { BACKEND_URL };

// ── Safe JSON parser: prevents "Unexpected end of JSON input" crashes ──────
// Always read as text first, then parse. Returns fallback on empty/invalid body.
async function safeJson(res, fallback = {}) {
    try {
        const text = await res.text();
        if (!text || text.trim() === '') return fallback;
        return JSON.parse(text);
    } catch {
        return fallback;
    }
}

// Environment-based toggle: Use real backend on localhost, localstorage in production
const isLocalhost = typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.'));
const useLocalOnly = true; // Always use local storage mock mode


export const dataService = {
    // --- AUTH & LOGIN ---
    requestRegistration: async function (data) {
        try {
            return await authService.register(data);
        } catch (e) {
            return { success: false, message: "Server connection failed: " + e.message };
        }
    },
    registerUser: async function (data, parentId = null) {
        const username = data.mobile || data.email;
        const newUser = {
            ...data,
            username: username,
            role: data.role || 'RETAILER',
            parent_id: parentId,
            status: 'Pending'
        };

        if (useLocalOnly) {
            const localData = this.getData();
            if (!localData.users.find(u => u.username === username)) {
                localData.users.push(newUser);
                this.saveData(localData);
            }
            return { success: true, message: "User registered successfully." };
        }

        const url = `${BACKEND_URL}/auth/register`;
        console.log("Attempting Direct Register at:", url);
        try {
            const res = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUser)
            });
            if (!res.ok) {
                return { success: false, message: `Server error (${res.status})` };
            }
            return await safeJson(res, { success: false, message: "Server connection failed: Invalid response" });
        } catch (e) {
            console.error("Direct Register Failed:", e);
            return { success: false, message: "Server connection failed: " + e.message };
        }
    },

    adminAddUser: async function (userData) {
        if (useLocalOnly) {
            const data = this.getData();
            const newUser = {
                id: Date.now(),
                username: userData.mobile,
                name: userData.name,
                role: userData.role,
                status: 'Approved',
                balance: '0.00'
            };
            data.users.push(newUser);
            this.saveData(data);
            return { success: true, message: "User added successfully." };
        }
        try {
            const token = localStorage.getItem('rupiksha_token');
            const res = await fetch(`${BACKEND_URL}/admin/add-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    username: userData.mobile,
                    password: userData.password,
                    fullName: userData.name,
                    phone: userData.mobile,
                    email: userData.email,
                    role: userData.role,
                    shopName: userData.businessName,
                    territory: userData.state,
                    pin: userData.pin,
                    partyCode: userData.partyCode
                })
            });
            return await res.json();
        } catch (e) {
            return { success: false, message: "Server connection failed" };
        }
    },

    loginUser: async function (username, password, location = null) {
        if (useLocalOnly) {
            const data = this.getData();
            const cleanUsername = (username || '').trim().toLowerCase();
            const cleanPassword = (password || '').trim();
            const user = data.users.find(u => (
                (u.username && u.username.toLowerCase() === cleanUsername) || 
                (u.mobile && u.mobile.toLowerCase() === cleanUsername)
            ));

            if (user) {
                // Check password for realism as requested
                if (user.password && (user.password || '').trim() !== cleanPassword) {
                    return { success: false, message: "Invalid password for local login." };
                }
                const loggedInUser = { ...user };
                if (loggedInUser.role) loggedInUser.role = String(loggedInUser.role).toUpperCase();
                localStorage.setItem('rupiksha_user', JSON.stringify(loggedInUser));
                localStorage.setItem('rupiksha_token', 'mock_token_' + Date.now());
                return { success: true, user: loggedInUser };
            }
            return { success: false, message: "User not found in local database." };
        }
        try {
            const data = await authService.login(username, password);
            if (data.success) {
                if (data.user && data.user.role) {
                    data.user.role = data.user.role.toUpperCase();
                }
                localStorage.setItem('rupiksha_user', JSON.stringify(data.user));
                localStorage.setItem('rupiksha_token', data.token);
                return { success: true, user: data.user };
            }
            return { success: false, message: data.error || data.message || "Login failed" };
        } catch (e) {
            return { success: false, message: "Server connection failed. Please ensure the backend is running." };
        }
    },

    getCurrentUser: function () {
        const saved = localStorage.getItem('rupiksha_user');
        return saved ? JSON.parse(saved) : null;
    },

    logoutUser: function () {
        localStorage.removeItem('rupiksha_user');
        localStorage.removeItem('rupiksha_token');
        window.location.href = '/';
    },

    refreshData: async function () {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return;
        try {
            const data = await userService.refreshUser(currentUser.id);
            if (data.success) {
                localStorage.setItem('rupiksha_user', JSON.stringify(data.user));
                window.dispatchEvent(new Event('dataUpdated'));
                return data.user;
            }
        } catch (e) {
            console.error("Failed to refresh data", e);
        }
    },

    updateUserProfile: async function (profileData) {
        try {
            const currentUser = this.getCurrentUser();
            const data = await userService.updateProfile({ userId: currentUser.id, ...profileData });
            if (data.success) {
                const updatedUser = { ...currentUser, ...data.user };
                localStorage.setItem('rupiksha_user', JSON.stringify(updatedUser));
                window.dispatchEvent(new Event('dataUpdated'));
                return true;
            }
            return false;
        } catch (e) {
            console.error("Update profile failed:", e);
            return false;
        }
    },

    adminUpdateUser: async function (userId, profileData) {
        if (useLocalOnly) {
            const data = this.getData();
            const idx = data.users.findIndex(u => u.id === userId || u.username === userId);
            if (idx !== -1) {
                data.users[idx] = { ...data.users[idx], ...profileData };
                this.saveData(data);
                return { success: true };
            }
            return { success: false, message: "User not found" };
        }
        try {
            const res = await fetch(`${BACKEND_URL}/update-profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, ...profileData })
            });
            return await res.json();
        } catch (e) { return { success: false, message: e.message }; }
    },

    fetchSales: async function (userId, date) {
        try {
            const token = localStorage.getItem('rupiksha_token');
            const res = await fetch(`${BACKEND_URL}/fetch-sales`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, date })
            });
            return await safeJson(res, { success: false, sales: [] });
        } catch (e) {
            return { success: false, message: e.message };
        }
    },

    getTopMerchants: async function (period, state) {
        try {
            const token = localStorage.getItem('rupiksha_token');
            const res = await fetch(`${BACKEND_URL}/top-merchants`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ period, state })
            });
            return await safeJson(res, { success: false, merchants: [] });
        } catch (e) {
            return { success: false, message: e.message };
        }
    },

    // --- WALLET & TRANSACTIONS ---
    getWalletBalance: async function (userId) {
        if (useLocalOnly) {
            const user = this.getCurrentUser();
            return user ? (user.balance || "0.00") : "0.00";
        }
        try {
            const data = await transactionService.getBalance();
            return data.success ? String(data.balance) : "0.00";
        } catch (e) {
            const user = this.getCurrentUser();
            return user ? (user.balance || "0.00") : "0.00";
        }
    },

    submitAepsKyc: async function (userId, formData) {
        try {
            const token = localStorage.getItem('rupiksha_token');
            // Send userId as actual value in the URL query param, not as a literal
            const res = await fetch(`${BACKEND_URL}/aeps/onboard?userId=${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, ...formData })
            });
            const data = await safeJson(res, { status: false, message: 'No response from server' });
            return data;
        } catch (e) {
            console.error('AEPS KYC Submit Error:', e);
            return { status: false, message: e.message };
        }
    },

    getSystemStats: async function () {
        try {
            const token = localStorage.getItem('rupiksha_token');
            const res = await fetch(`${BACKEND_URL}/admin/stats`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            return data.success ? data.stats : null;
        } catch (e) {
            return null;
        }
    },

    getWalletBalances: async function (userId) {
        try {
            const token = localStorage.getItem('rupiksha_token');
            const user = this.getCurrentUser();
            const isAdmin = true; // Global bypass: Show Venus balance for everyone

            if (useLocalOnly) {
                return { main: user?.balance || "0.00", aeps: user?.aepsBalance || "0.00", incentive: user?.incentiveBalance || "0.00" };
            }
            const res = await fetch(`${BACKEND_URL}/get-balance`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await safeJson(res, { success: false });

            let mainBalance = String(data.balance || "0.00");

            // If Admin, also try to fetch real Venus balance to keep synced
            if (isAdmin && !useLocalOnly) {
                try {
                    const vRes = await fetch(`${BACKEND_URL}/recharge-balance`, {
                        method: 'GET',
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    const vData = await safeJson(vRes, {});
                    if (vData.success && vData.balance != null) {
                        mainBalance = String(vData.balance);
                    }
                } catch (e) { }
            }

            if (data.success || isAdmin) {
                const resBalances = {
                    main: mainBalance,
                    aeps: String(data.aepsBalance || "0.00"),
                    incentive: String(data.incentiveBalance || "0.00")
                };

                if (user) {
                    const updatedUser = {
                        ...user,
                        balance: resBalances.main,
                        aepsBalance: resBalances.aeps,
                        incentiveBalance: resBalances.incentive
                    };
                    localStorage.setItem('rupiksha_user', JSON.stringify(updatedUser));
                }
                return resBalances;
            }
            return { main: "0.00", aeps: "0.00", incentive: "0.00" };
        } catch (e) {
            const user = this.getCurrentUser();
            return {
                main: user ? (user.balance || "0.00") : "0.00",
                aeps: user ? (user.aepsBalance || "0.00") : "0.00",
                incentive: user ? (user.incentiveBalance || "0.00") : "0.00"
            };
        }
    },

    logTransaction: async function (userId, service, amount, operator, number, status) {
        try {
            const token = localStorage.getItem('rupiksha_token');
            const res = await fetch(`${BACKEND_URL}/log-txn`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ userId, service, amount, operator, number, status })
            });
            const data = await safeJson(res, { success: false });

            if (data.success && data.newBalance !== undefined) {
                const user = this.getCurrentUser();
                const updatedUser = { ...user, balance: String(data.newBalance) };
                localStorage.setItem('rupiksha_user', JSON.stringify(updatedUser));
                window.dispatchEvent(new Event('dataUpdated'));
            }
            return data.success;
        } catch (e) { return false; }
    },

    getUserTransactions: async function (userId) {
        try {
            const token = localStorage.getItem('rupiksha_token');
            const res = await fetch(`${BACKEND_URL}/transactions?userId=${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await safeJson(res, { success: false });
            return data.success ? data.transactions : [];
        } catch (e) { return []; }
    },

    // --- KYC ---
    uploadKyc: async function (kycData) {
        try {
            const token = localStorage.getItem('rupiksha_token');
            const res = await fetch(`${BACKEND_URL}/upload-kyc`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(kycData)
            });
            return await safeJson(res, { success: false });
        } catch (e) { return { success: false, message: "KYC Upload Failed" }; }
    },

    getKycStatus: async function (userId) {
        try {
            const token = localStorage.getItem('rupiksha_token');
            const res = await fetch(`${BACKEND_URL}/kyc-status?userId=${userId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await safeJson(res, { success: false });
            return data.success ? data.documents : [];
        } catch (e) { return []; }
    },

    submitKyc: async function (username, type, kycData = {}) {
        if (useLocalOnly) {
            const data = this.getData();
            const userIdx = data.users.findIndex(u => u.username === username || u.mobile === username);
            if (userIdx !== -1) {
                if (type === 'MAIN') data.users[userIdx].profile_kyc_status = 'PENDING';

                this.saveData(data);
            }
            return { success: true, message: "KYC application submitted for review." };
        }
        try {
            const endpoint = '/submit-profile-kyc';
            const payload = { ...kycData };
            if (type === 'MAIN') {
                payload.fullName = kycData.fullName;
                payload.shopSelfie = kycData.shopPhoto || kycData.shopSelfie;
                payload.userId = username;
            } else {
                payload.userId = username;
            }

            const res = await fetch(`${BACKEND_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('rupiksha_token')}`
                },
                body: JSON.stringify(payload)
            });
            const resData = await res.json();

            if (resData.success) {
                const data = this.getData();
                const userIdx = data.users.findIndex(u => u.username === username || u.mobile === username);
                if (userIdx !== -1) {
                    if (type === 'MAIN') {
                        data.users[userIdx].profile_kyc_status = 'PENDING';
                    }
                    this.saveData(data);
                }
                return { success: true, ...resData };
            }
            return resData;
        } catch (e) {
            console.error("KYC Submission error:", e);
            return { success: false, message: e.message };
        }
    },

    submitAepsKyc: async function (userId, kycData) {
        if (useLocalOnly) {
            const data = this.getData();
            const userIdx = data.users.findIndex(u => u.id === userId || u.username === userId);
            if (userIdx !== -1) {
                data.users[userIdx].aeps_kyc_status = 'PENDING';
                data.users[userIdx].aeps_kyc_details = kycData;
                this.saveData(data);
            }
            return { status: true, message: "AEPS KYC submitted successfully." };
        }
        try {
            // Include action check for OTP verification
            if (kycData.action === 'verifyOtp') {
                return await this.verifyAepsOtp({
                    ...kycData,
                    userId: userId
                });
            }

            // Frontend -> Main Backend logic matching EXACT expected Fingpay schema
            const getBase64 = (val, fallback) => val ? (val.includes(',') ? val.split(',')[1] : val) : fallback;

            const exactPayload = {
                username: kycData.username || "rupikshad",
                password: kycData.password || "796c3ee556ac31f3754a38cfd15b8044",
                ipAddress: kycData.ipAddress || "223.235.103.251",
                latitude: parseFloat(kycData.latitude || 25.6),
                longitude: parseFloat(kycData.longitude || 85.1),
                superMerchantId: parseInt(kycData.superMerchantId || 1407),
                merchant: {
                    merchantLoginId: kycData.merchantLoginId || "Rup" + kycData.merchantPhoneNumber,
                    merchantLoginPin: kycData.merchantLoginPin,
                    firstName: kycData.firstName,
                    lastName: kycData.lastName,
                    middleName: kycData.middleName || "",
                    merchantPhoneNumber: kycData.merchantPhoneNumber,
                    merchantAddress: {
                        merchantAddress1: kycData.merchantAddress1 || "",
                        merchantAddress2: kycData.merchantAddress2 || "",
                        merchantState: parseInt(kycData.merchantState) || 9,
                        merchantCityName: kycData.merchantCityName || "",
                        merchantDistrictName: kycData.merchantDistrictName || "",
                        merchantPinCode: String(kycData.merchantPinCode || "")
                    },
                    companyLegalName: kycData.companyLegalName || "",
                    companyType: parseInt(kycData.companyType) || 4215,
                    emailId: kycData.emailId || "",
                    certificateOfIncorporationImage: getBase64(kycData.certificateOfIncorporationImage, "True"),
                    kyc: {
                        userPan: kycData.userPan,
                        aadhaarNumber: kycData.aadhaarNumber,
                        gstinNumber: kycData.gstinNumber || "10AAOCR7628E1ZE",
                        companyOrShopPan: kycData.companyOrShopPan,
                        merchantPanImage: getBase64(kycData.merchantPanImage, "BASE64"),
                        maskedAadharImage: getBase64(kycData.maskedAadharImage, "BASE64"),
                        shopAndPanImage: getBase64(kycData.shopAndPanImage, "True")
                    },
                    settlementV1: {
                        companyBankAccountNumber: kycData.companyBankAccountNumber,
                        bankIfscCode: kycData.bankIfscCode,
                        companyBankName: (kycData.companyBankName || "State Bank of India").toUpperCase(),
                        bankAccountName: kycData.bankAccountName || kycData.firstName
                    },
                    tradeBusinessProof: getBase64(kycData.tradeBusinessProof, "True"),
                    termsConditionCheck: "True",
                    cancelledChequeImages: getBase64(kycData.cancelledChequeImages, "True"),
                    physicalVerification: getBase64(kycData.physicalVerification, "True"),
                    videoKycWithLatLongData: getBase64(kycData.videoKycWithLatLongData, "True"),
                    merchantKycAddressData: {
                        shopAddress: kycData.shopAddress || "",
                        shopCity: kycData.shopCity || "",
                        shopDistrict: kycData.shopDistrict || "",
                        shopState: parseInt(kycData.shopState) || 9,
                        shopPincode: String(kycData.shopPincode || ""),
                        shopLatitude: parseFloat(kycData.latitude || 25.6),
                        shopLongitude: parseFloat(kycData.longitude || 85.1),
                        backgroundImageOfShop: getBase64(kycData.backgroundImageOfShop, "BASE64")
                    }
                }
            };

            const res = await fetch(`${BACKEND_URL}/aeps/kyc-submit`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('rupiksha_token')}`
                },
                body: JSON.stringify(exactPayload)
            });

            // Check for unhandled 500 errors or non-json proxy responses
            if (!res.ok) {
                try {
                    const textData = await res.text();
                    return { success: false, message: `Server error ${res.status}: ${textData.substring(0, 100)}` };
                } catch (e) {
                    return { success: false, message: `Server error: ${res.status}` };
                }
            }
            return await res.json();
        } catch (e) {
            return { success: false, message: "Backend connection failed. Ensure the server is reachable." };
        }
    },

    verifyAepsOtp: async function (verificationData) {
        try {
            const res = await fetch(`${BACKEND_URL}/aeps/verify-otp`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('rupiksha_token')}`
                },
                body: JSON.stringify(verificationData)
            });
            return await res.json();
        } catch (e) {
            return { success: false, message: "OTP Verification Connection Failed." };
        }
    },

    async getPendingKycs(type) {
        try {
            const endpoint = `/admin/pending-kyc?type=${type}`;
            const res = await fetch(`${BACKEND_URL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('rupiksha_token')}`
                }
            });
            return await safeJson(res, { success: false, message: "Failed to fetch" });
        } catch (e) {
            return { success: false, message: e.message };
        }
    },

    approveKyc: async function (username, type, merchantId = null) {
        try {
            const res = await fetch(`${BACKEND_URL}/admin/approve-kyc`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('rupiksha_token')}`
                },
                body: JSON.stringify({ username, type, merchantId })
            });
            return await safeJson(res, { success: false });
        } catch (e) {
            return { success: false, message: e.message };
        }
    },

    rejectKyc: async function (username, type, reason = '') {
        try {
            const res = await fetch(`${BACKEND_URL}/admin/reject-kyc`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('rupiksha_token')}`
                },
                body: JSON.stringify({ username, type, reason })
            });
            return await safeJson(res, { success: false });
        } catch (e) {
            return { success: false, message: e.message };
        }
    },

    sendAadhaarOTP: async function (username) {
        // Simulation: In production this would hit an UIDAI AUA/KSA provider
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const user = this.getUserByUsername(username);

        // Use existing email service to simulated phone OTP for dev
        if (user && user.email) {
            await sendOTPEmail(user.email, otp, user.name || "Retailer");
            return { success: true, otp: otp }; // Returning actual OTP for mock testing
        }
        return { success: false, message: "User contact not found" };
    },

    verifyPAN: async function (pan) {
        if (useLocalOnly) return { success: true, name: "DEMO USER", status: "VALID" };
        try {
            return await verificationService.verifyPan(pan);
        } catch (error) {
            console.error("PAN Verification Error:", error);
            return { success: false, message: "Server connection failed" };
        }
    },

    verifyAadhaarName: async function (aadhaar) {
        if (useLocalOnly) return { success: true, name: "DEMO USER" };
        try {
            const response = await fetch(`${BACKEND_URL}/verify-aadhaar`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ aadhaar })
            });
            return await response.json();
        } catch (error) {
            console.error("Aadhaar Verification Error:", error);
            return { success: false, message: "Server connection failed" };
        }
    },

    verifyAadhaar: async function (aadhaar) {
        return this.verifyAadhaarName(aadhaar);
    },

    verifyAadhaarBiometric: async function (aadhaar, pidData, mobile) {
        if (useLocalOnly) return { success: true, message: "Fingerprint matched successfully." };
        try {
            const response = await fetch(`${BACKEND_URL}/verify-aadhaar-biometric`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ aadhaar, pidData, mobile })
            });
            return await response.json();
        } catch (error) {
            console.error("Biometric Verification Error:", error);
            return { success: false, message: "Server connection failed" };
        }
    },

    createDigiLockerSession: async function (aadhaar) {
        if (useLocalOnly) return { success: true, session_id: "RUP-SESS-9921" };
        try {
            const response = await fetch(`${BACKEND_URL}/verify-aadhaar-digilocker`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ aadhaar })
            });
            return await response.json();
        } catch (error) {
            console.error("DigiLocker Session Error:", error);
            return { success: false, message: "Server connection failed" };
        }
    },

    verifyAadhaarBiometricOtp: async function (aadhaar, otp) {
        if (useLocalOnly) return { success: true, message: "OTP verified updated successfully." };
        try {
            const response = await fetch(`${BACKEND_URL}/verify-aadhaar-biometric-otp`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ aadhaar, otp })
            });
            return await response.json();
        } catch (error) {
            console.error("Biometric OTP Error:", error);
            return { success: false, message: "Server connection failed" };
        }
    },


    // --- SUPPORT ---
    raiseTicket: async function (ticketData) {
        try {
            const res = await fetch(`${BACKEND_URL}/raise-ticket`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(ticketData)
            });
            return await res.json();
        } catch (e) { return { success: false, message: "Failed to raise ticket" }; }
    },

    getMyTickets: async function (userId) {
        try {
            const res = await fetch(`${BACKEND_URL}/my-tickets?userId=${userId}`);
            const data = await res.json();
            return data.success ? data.tickets : [];
        } catch (e) { return []; }
    },

    // --- PORTAL CONFIG ---
    getPortalConfig: async function () {
        try {
            const res = await fetch(`${BACKEND_URL}/portal-config`);
            const data = await res.json();
            return data.success ? data.config : null;
        } catch (e) { return null; }
    },

    getCommissions: async function () {
        try {
            const res = await fetch(`${BACKEND_URL}/commissions`);
            const data = await res.json();
            return data.success ? data.commissions : [];
        } catch (e) { return []; }
    },

    // --- HELPERS ---
    verifyLocation: async function () {
        return new Promise((resolve) => {
            if (!navigator || !navigator.geolocation) {
                resolve({ lat: 25.6, long: 85.1 });
                return;
            }
            navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ lat: pos.coords.latitude, long: pos.coords.longitude }),
                (err) => resolve({ lat: 25.6, long: 85.1 }),
                { timeout: 5000 }
            );
            // Default after 5 seconds if no response
            setTimeout(() => resolve({ lat: 25.6, long: 85.1 }), 5500);
        });
    },

    getNotifications: async function () {
        if (useLocalOnly) {
            const data = this.getData();
            return data.notifications || [];
        }
        try {
            const token = localStorage.getItem('rupiksha_token');
            const res = await fetch(`${BACKEND_URL}/notifications`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            return data.success ? data.notifications : [];
        } catch (e) {
            console.error("Error fetching notifications:", e);
            return [];
        }
    },

    getUnreadCount: async function () {
        if (useLocalOnly) {
            const data = this.getData();
            return (data.notifications || []).filter(n => !n.read).length;
        }
        try {
            const token = localStorage.getItem('rupiksha_token');
            const res = await fetch(`${BACKEND_URL}/notifications/unread-count`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            return data.success ? data.unreadCount : 0;
        } catch (e) {
            console.error("Error fetching unread notification count:", e);
            return 0;
        }
    },

    markAsRead: async function (notificationId) {
        if (useLocalOnly) {
            const data = this.getData();
            const notification = data.notifications.find(n => n.id === notificationId);
            if (notification) {
                notification.read = true;
                this.saveData(data);
                return { success: true };
            }
            return { success: false, message: "Notification not found locally" };
        }
        try {
            const token = localStorage.getItem('rupiksha_token');
            const res = await fetch(`${BACKEND_URL}/notifications/${notificationId}/read`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return await res.json();
        } catch (e) {
            console.error("Error marking notification as read:", e);
            return { success: false, message: e.message };
        }
    },

    deleteNotification: async function (notificationId) {
        if (useLocalOnly) {
            const data = this.getData();
            data.notifications = data.notifications.filter(n => n.id !== notificationId);
            this.saveData(data);
            return { success: true };
        }
        try {
            const token = localStorage.getItem('rupiksha_token');
            const res = await fetch(`${BACKEND_URL}/notifications/${notificationId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return await res.json();
        } catch (e) {
            console.error("Error deleting notification:", e);
            return { success: false, message: e.message };
        }
    },

    getPublicIp: async function () {
        try {
            const res = await fetch('https://api.ipify.org?format=json');
            const data = await res.json();
            return data.ip;
        } catch (e) {
            return "223.235.103.251"; // Default
        }
    },

    generateOTP: function () {
        return Math.floor(100000 + Math.random() * 900000).toString();
    },

    sendEmployeeVerificationOTP: async function (email, name) {
        const otp = this.generateOTP();
        const res = await sendOTPEmail(email, otp, name);
        if (res.success) {
            return { success: true, otp };
        }
        return res;
    },

    sendEmployeeLoginOTP: async function (email, name) {
        const otp = this.generateOTP();
        const res = await sendOTPEmail(email, otp, name);
        if (res.success) {
            return { success: true, otp };
        }
        return res;
    },

    sendEmployeeCredentials: async function (email, name, loginId, password, addedBy, role) {
        return await sendCredentialsEmail({
            to: email,
            name: name,
            loginId: loginId,
            password: password,
            addedBy: addedBy,
            portalType: role
        });
    },

    // --- ADMIN OVERSIGHT ---
    getAllUsers: async function () {
        try {
            const token = localStorage.getItem('rupiksha_token');
            const res = await fetch(`${BACKEND_URL}/admin/users`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.success) return data.users;
        } catch (e) { }
        return this.getData().users || [];
    },


    getAllTransactions: async function () {
        if (useLocalOnly) return this.getData().transactions || [];
        try {
            const res = await fetch(`${BACKEND_URL}/all-transactions`);
            const data = await res.json();
            return data.success ? data.transactions : [];
        } catch (e) { return []; }
    },

    getTrashUsers: async function () {
        if (useLocalOnly) return [];
        try {
            const res = await fetch(`${BACKEND_URL}/trash-users`);
            const data = await res.json();
            return data.success ? data.users : [];
        } catch (e) { return []; }
    },

    getLoans: async function () {
        if (useLocalOnly) {
            return this.getData().loans || [];
        }
        try {
            const token = localStorage.getItem('rupiksha_token');
            const res = await fetch(`${BACKEND_URL}/loan/all`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            const data = await res.json();
            return Array.isArray(data) ? data : (data.success ? data.loans : []);
        } catch (e) {
            console.error("Fetch Loans failed, using local", e);
            return this.getData().loans || [];
        }
    },

    updateLoanStatus: async function (trackingId, status) {
        if (useLocalOnly) {
            const data = this.getData();
            const idx = data.loans.findIndex(l => l.tracking_id === trackingId);
            if (idx !== -1) {
                data.loans[idx].status = status;
                if (status === 'approved') {
                    data.loans[idx].offer_amount = 250000;
                    data.loans[idx].lender_name = 'HDFC BANK';
                }
                this.saveData(data);
                return { success: true, message: `Status updated to ${status} successfully.` };
            }
            return { success: false, message: 'Application not found in local db' };
        }
        try {
            const token = localStorage.getItem('rupiksha_token');
            const res = await fetch(`${BACKEND_URL}/loan/simulate-status`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ tracking_id: trackingId, status: status })
            });
            return await res.json();
        } catch (e) { return { success: false, message: 'Network error ' + e.message }; }
    },

    simulateLoanStatus: async function (trackingId, status) {
        return this.updateLoanStatus(trackingId, status);
    },

    registerLoanLead: async function (leadData) {
        if (useLocalOnly) {
            const data = this.getData();
            const trackingId = 'TRK_' + Math.floor(1000 + Math.random() * 9000);
            const newLead = {
                app_id: 'L' + Math.floor(100 + Math.random() * 900),
                name: leadData.name,
                phone: leadData.phone,
                tracking_id: trackingId,
                status: 'initiated',
                loan_type: leadData.loanType === 'PL' ? 'Personal Loan' : (leadData.loanType === 'GL' ? 'Gold Loan' : 'Loan Lead'),
                requested_amount: leadData.amount,
                dob: leadData.dob,
                pincode: leadData.pincode,
                pan: leadData.pan,
                income: leadData.income,
                employment_type: leadData.employment_type,
                updated_at: new Date().toISOString()
            };
            data.loans.push(newLead);
            this.saveData(data);
            return {
                success: true,
                message: "Loan lead registered successfully.",
                tracking_id: trackingId,
                redirectionUrl: "/loan-simulation",
                is_demo: true,
                phone: leadData.phone,
                name: leadData.name,
                amount: leadData.amount
            };
        }
        try {
            const res = await fetch(`${BACKEND_URL}/loan/register-lead`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(leadData)
            });
            return await res.json();
        } catch (e) {
            return { success: false, message: e.message };
        }
    },

    checkLoanStatus: async function (phone) {
        if (useLocalOnly) {
            const data = this.getData();
            const loan = data.loans.find(l => l.phone === phone);
            if (loan) {
                return {
                    success: true,
                    name: loan.name,
                    phone: loan.phone,
                    status: (loan.status || 'unknown').toUpperCase(),
                    reference_id: loan.tracking_id,
                    offer_amount: loan.offer_amount,
                    lender_name: loan.lender_name,
                    interest_rate: loan.interest_rate || '10.5%',
                    updated_at_date: new Date(loan.updated_at).toLocaleDateString(),
                    updated_at_time: new Date(loan.updated_at).toLocaleTimeString()
                };
            }
            return { success: false, message: "Application not found locally" };
        }
        try {
            const res = await fetch(`${BACKEND_URL}/loan/check-status?phone=${phone}`);
            return await res.json();
        } catch (e) {
            return { success: false, message: e.message };
        }
    },

    getLoanStats: async function () {
        if (useLocalOnly) {
            const data = this.getData();
            const loans = data.loans || [];
            return {
                success: true,
                total: loans.length,
                approved: loans.filter(l => l.status === 'approved').length,
                pending: loans.filter(l => l.status === 'initiated' || l.status === 'pending').length,
                rejected: loans.filter(l => l.status === 'rejected').length
            };
        }
        try {
            const res = await fetch(`${BACKEND_URL}/loan/stats`);
            return await res.json();
        } catch (e) {
            return { success: false };
        }
    },

    simulateLoanWebhook: async function (trackingId, status) {
        if (useLocalOnly) {
            return this.updateLoanStatus(trackingId, status);
        }
        try {
            const res = await fetch(`${BACKEND_URL}/loan/simulate-webhook`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ tracking_id: trackingId, status: status })
            });
            return await res.json();
        } catch (e) {
            return { success: false };
        }
    },



    restoreUser: async function (username) {
        if (useLocalOnly) return { success: true };
        try {
            const res = await fetch(`${BACKEND_URL}/restore-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username })
            });
            return await res.json();
        } catch (e) { return { success: false }; }
    },

    resendCredentials: async function (user) {
        if (useLocalOnly) return { success: true, message: "Credentials rest successfully." };
        try {
            const res = await fetch(`${BACKEND_URL}/send-credentials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    to: user.email,
                    name: user.name,
                    login_id: user.username || user.mobile,
                    password: user.password,
                    pin: user.pin || '1122',
                    added_by: 'Administrator',
                    portal_type: user.role
                })
            });
            return await res.json();
        } catch (e) { return { success: false }; }
    },

    getData: function () {
        const d = localStorage.getItem('rupiksha_data');
        const defaultUsers = [
           { id: 1, name: 'System Admin', username: 'admin', mobile: '9289309524', role: 'ADMIN', status: 'Approved', balance: '0.00', email: 'admin@rupiksha.in', password: 'Admin@123' },
           { id: 2, name: 'Test Retailer', username: '9931426338', mobile: '9931426338', role: 'RETAILER', status: 'Approved', balance: '0.00', email: 'retailer@rupiksha.in', password: 'Ret@123' },
           { id: 3, name: 'Test Distributor', username: '8210350444', mobile: '8210350444', role: 'DISTRIBUTOR', status: 'Approved', balance: '0.00', email: 'dist@rupiksha.in', password: 'Dist@123' },
           { id: 4, name: 'Test SuperDist', username: '8877665544', mobile: '8877665544', role: 'SUPER_DISTRIBUTOR', status: 'Approved', balance: '0.00', email: 'super@rupiksha.in', password: 'Sup@123' }
        ];

        let data = d ? JSON.parse(d) : null;

        if (!data) {
            data = {
                users: defaultUsers,
                loans: [],
                transactions: [],
                promotions: {
                    banners: []
                },
                news: "Welcome to Rupiksha",
                chartTitle: "Volume Activity",
                chartData: [
                    { name: 'Mon', value: 0 },
                    { name: 'Tue', value: 0 },
                    { name: 'Wed', value: 0 },
                    { name: 'Thu', value: 0 },
                    { name: 'Fri', value: 0 },
                    { name: 'Sat', value: 0 },
                    { name: 'Sun', value: 0 }
                ],
                quickActions: [
                    { title: "Wallet Topup", subTitle: "Add funds to wallet", icon: "Wallet" },
                    { title: "Manage Store", subTitle: "Edit store profile", icon: "Building2" }
                ],
                stats: {
                    todayActive: "12",
                    weeklyActive: "45",
                    monthlyActive: "189",
                    debitSale: "₹ 0",
                    labels: {
                        today: { title: "TODAY ACTIVE" },
                        weekly: { title: "WEEKLY ACTIVE" },
                        monthly: { title: "MONTHLY ACTIVE" },
                        debit: { title: "TOTAL DEBIT" }
                    }
                },
                wallet: { balance: "0.00", retailerName: "Super Admin" },
                promotions: {
                    banners: [
                        { id: 1, image: mainLogo, title: "Modern Banking Suite", subtitle: "Secure | Fast | Reliable" },
                        { id: 2, image: mainLogo, title: "Financial Inclusion", subtitle: "Digital India | Last Mile Reach" }
                    ]
                },
                services: [
                    { id: 1, label: 'AEPS Hub', category: 'Banking', icon: 'zap', active: true, image: null, details: 'Cash Withdrawal, Balance Inquiry, and Mini Statement using Aadhar enabled Payment System.' },
                    { id: 2, label: 'Money Transfer', category: 'Banking', icon: 'send', active: true, image: null, details: 'Direct Money Transfer (DMT) to any bank account in India instantly.' },
                    { id: 3, label: 'Micro ATM', category: 'Banking', icon: 'shield', active: true, image: null, details: 'Convert your shop into an ATM and withdraw cash using Debit Cards.' },
                    { id: 4, label: 'Payout Service', category: 'Banking', icon: 'zap', active: true, image: null, details: 'Bulk payout and settlement service for businesses.' },
                    { id: 5, label: 'Mobile Recharge', category: 'Utility', icon: 'zap', active: true, image: null, details: 'Instant mobile recharge for all major Indian operators.' },
                    { id: 6, label: 'DTH Recharge', category: 'Utility', icon: 'zap', active: true, image: null, details: 'Direct-to-home television recharge for Tata Play, Airtel DTH, etc.' },
                    { id: 7, label: 'Bill Pay (BBPS)', category: 'BBPS', icon: 'flame', active: true, image: null, details: 'Electricity, Water, Gas, and Broadband bill payments via BBPS.' },
                    { id: 8, label: 'CMS Hub', category: 'Utility', icon: 'package', active: true, image: null, details: 'Cash Management Service for various companies and NBFCs.' },
                    { id: 9, label: 'Travel Hub', category: 'Travel', icon: 'send', active: true, image: null, details: 'Book Flight, Bus, and Hotel tickets at competitive prices.' },
                    { id: 10, label: 'Loan Segment', category: 'Banking', icon: 'shield', active: true, image: null, details: 'Apply for small business loans and personal credit lines.' },
                    { id: 11, label: 'Insurance Pay', category: 'BBPS', icon: 'shield', active: true, image: null, details: 'Renew insurance policies for Life, Health, and Motor.' },
                    { id: 12, label: 'KYC Center', category: 'System', icon: 'shield', active: true, image: null, details: 'Manage and update e-KYC for your retail point.' }
                ],
                settings: {
                    siteName: "Rupiksha Fintech",
                    contactEmail: "admin@rupiksha.com",
                    supportPhone: "+91 99999 88888",
                    logo: null,
                    address: "Digital Street, Fintech Hub, Hyderabad"
                },
                adminLogs: [
                    { id: 1, timestamp: new Date().toISOString(), admin: 'Om Dubey', action: 'System Setup', status: 'Success' }
                ],
                packages: [
                    { id: 1, name: 'Standard Retailer', price: '999', features: 'All Basic Services, T+1 Settlement' },
                    { id: 2, name: 'Prime Retailer', price: '2999', features: 'Priority Support, Higher Commissions, Instant Settlement' }
                ],
                commissions: [
                    { serviceId: 1, serviceName: 'AEPS Hub', commType: 'Flat', retailerComm: '12', distributorComm: '2', masterComm: '1' },
                    { serviceId: 2, serviceName: 'Money Transfer', commType: 'Percentage', retailerComm: '0.45', distributorComm: '0.05', masterComm: '0.02' }
                ]
            };
        }

        // Ensure sub-properties exist to prevent crashes
        if (!data.stats) data.stats = { todayActive: "0", weeklyActive: "0", monthlyActive: "0", debitSale: "₹ 0", labels: { today: { title: "TODAY ACTIVE" }, weekly: { title: "WEEKLY ACTIVE" }, monthly: { title: "MONTHLY ACTIVE" }, debit: { title: "TOTAL DEBIT" } } };
        if (!data.users) data.users = [];
        
        // Ensure default users are always present
        if (d) {
            defaultUsers.forEach(defUser => {
                if (!data.users.find(u => u.username === defUser.username)) {
                    data.users.push(defUser);
                }
            });
        }
        if (!data.loans) data.loans = [];
        if (!data.services) data.services = [
            { id: 1, label: 'AEPS Hub', category: 'Banking', icon: 'zap', active: true, image: null },
            { id: 2, label: 'Money Transfer', category: 'Banking', icon: 'send', active: true, image: null },
            { id: 3, label: 'Micro ATM', category: 'Banking', icon: 'shield', active: true, image: null },
            { id: 4, label: 'Payout Service', category: 'Banking', icon: 'zap', active: true, image: null },
            { id: 5, label: 'Mobile Recharge', category: 'Utility', icon: 'zap', active: true, image: null },
            { id: 6, label: 'DTH Recharge', category: 'Utility', icon: 'zap', active: true, image: null },
            { id: 7, label: 'Bill Pay (BBPS)', category: 'BBPS', icon: 'flame', active: true, image: null },
            { id: 8, label: 'CMS Hub', category: 'Utility', icon: 'package', active: true, image: null },
            { id: 9, label: 'Travel Hub', category: 'Travel', icon: 'send', active: true, image: null },
            { id: 10, label: 'Loan Segment', category: 'Banking', icon: 'shield', active: true, image: null },
            { id: 11, label: 'Insurance Pay', category: 'BBPS', icon: 'shield', active: true, image: null },
            { id: 12, label: 'KYC Center', category: 'System', icon: 'shield', active: true, image: null }
        ];
        if (!data.wallet) data.wallet = { balance: "0.00", retailerName: "Retailer" };
        if (!data.settings) data.settings = { siteName: "Rupiksha Fintech", contactEmail: "admin@rupiksha.com", supportPhone: "+91 99999 88888", logo: null };
        if (!data.adminLogs) data.adminLogs = [];
        if (!data.packages) data.packages = [];
        if (!data.commissions) data.commissions = [];

        const user = localStorage.getItem('rupiksha_user');
        if (user) data.currentUser = JSON.parse(user);
        return data;
    },

    saveData: function (data) {
        if (data && data.currentUser) {
            localStorage.setItem('rupiksha_user', JSON.stringify(data.currentUser));
        }
        localStorage.setItem('rupiksha_data', JSON.stringify(data));
        window.dispatchEvent(new Event('dataUpdated'));
    },

    getUserByUsername: function (username) {
        const data = this.getData();
        return data.users.find(u => u.username === username || u.mobile === username);
    },

    approveUser: async function (username, password, partyCode, parentId = null, pin = '1122') {
        if (useLocalOnly) {
            const data = this.getData();
            const userIdx = data.users.findIndex(u => u.username === username);
            if (userIdx !== -1) {
                data.users[userIdx].status = 'Approved';
                data.users[userIdx].password = password;
                data.users[userIdx].partyCode = partyCode;
                data.users[userIdx].pin = pin;
                if (parentId) data.users[userIdx].ownerId = parentId;
                this.saveData(data);
            }
            return { success: true };
        }
        try {
            const res = await fetch(`${BACKEND_URL}/admin/approve-user`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('rupiksha_token')}`
                },
                body: JSON.stringify({ username, password, status: 'Approved', partyCode, parent_id: parentId, pin })
            });
            const data = await res.json();
            return data;
        } catch (e) {
            console.error("DB Update failed", e);
            return { success: false, message: e.message };
        }
    },

    updateUserRole: async function (username, newRole) {
        if (useLocalOnly) {
            const data = this.getData();
            const idx = data.users.findIndex(u => u.username === username);
            if (idx !== -1) {
                data.users[idx].role = newRole;
                this.saveData(data);
            }
            return { success: true };
        }
        try {
            const res = await fetch(`${BACKEND_URL}/update-user-role`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, newRole })
            });
            const resData = await res.json();
            if (resData.success) {
                const data = this.getData();
                const userIdx = data.users.findIndex(u => u.username === username);
                if (userIdx !== -1) {
                    data.users[userIdx].role = newRole;
                    this.saveData(data);
                }
                return { success: true };
            }
            return resData;
        } catch (e) {
            return { success: false, message: e.message };
        }
    },

    rejectUser: async function (username) {
        if (useLocalOnly) {
            const data = this.getData();
            const idx = data.users.findIndex(u => u.username === username);
            if (idx !== -1) {
                data.users[idx].status = 'Rejected';
                this.saveData(data);
            }
            return { success: true };
        }
        try {
            await fetch(`${BACKEND_URL}/approve-user`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, status: 'Rejected' })
            });
            return { success: true };
        } catch (e) { return { success: false }; }
    },

    resetData: function () {
        localStorage.removeItem('rupiksha_data');
        window.dispatchEvent(new Event('dataUpdated'));
    },

    updateUserCertificates: async function (userId, data) {
        try {
            const res = await fetch(`${BACKEND_URL}/admin/update-user-certificates`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, ...data })
            });
            return await res.json();
        } catch (e) { return { success: false, message: e.message }; }
    },

    updateUserGeofencing: async function (userId, data) {
        try {
            const res = await fetch(`${BACKEND_URL}/admin/update-user-geofencing`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId, ...data })
            });
            return await res.json();
        } catch (e) { return { success: false, message: e.message }; }
    },

    verifyDocument: async function (username, docName, status) {
        try {
            const res = await fetch(`${BACKEND_URL}/admin/verify-document`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, docName, status })
            });
            return await res.json();
        } catch (e) { return { success: false, message: e.message }; }
    },

    deleteUser: async function (username) {
        if (useLocalOnly) {
            const data = this.getData();
            data.users = data.users.filter(u => u.username !== username);
            this.saveData(data);
            return { success: true };
        }
        try {
            const token = localStorage.getItem('rupiksha_token');
            const res = await fetch(`${BACKEND_URL}/admin/delete-user/${username}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return await res.json();
        } catch (e) {
            return { success: false, message: e.message };
        }
    },

    // --- SERVICES ---
    getServices: function () {
        const data = this.getData();
        return data.services || [];
    },

    addService: async function (serviceData) {
        if (useLocalOnly) {
            const data = this.getData();
            const newService = {
                ...serviceData,
                id: Date.now(),
                active: true
            };
            if (!data.services) data.services = [];
            data.services.push(newService);
            this.saveData(data);
            return { success: true, service: newService };
        }
        // Backend implementation if available, otherwise fallback to local
        try {
            const res = await fetch(`${BACKEND_URL}/admin/add-service`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('rupiksha_token')}`
                },
                body: JSON.stringify(serviceData)
            });
            if (!res.ok) throw new Error('Endpoint not found');
            return await res.json();
        } catch (e) {
            // Local fallback
            const data = this.getData();
            const newService = {
                ...serviceData,
                id: Date.now(),
                active: true,
                image: serviceData.image || null // Ensure image is preserved
            };
            if (!data.services) data.services = [];
            data.services.push(newService);
            this.saveData(data);
            return { success: true, service: newService };
        }
    },

    deleteService: async function (serviceId) {
        const data = this.getData();
        data.services = (data.services || []).filter(s => s.id !== serviceId);
        this.saveData(data);
        this.addAdminLog('Deleted Service');
        return { success: true };
    },

    // --- Settings Methods ---
    getAdminLogs: function () { return this.getData().adminLogs || []; },
    addAdminLog: function (action, status = 'Success') {
        const data = this.getData();
        const newLog = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            admin: data.currentUser?.name || 'Admin',
            action,
            status
        };
        if (!data.adminLogs) data.adminLogs = [];
        data.adminLogs.unshift(newLog);
        this.saveData(data);
    },
    getPlatformSettings: function () { return this.getData().settings; },
    updatePlatformSettings: function (newSettings) {
        const data = this.getData();
        data.settings = { ...data.settings, ...newSettings };
        this.saveData(data);
        this.addAdminLog('Updated Platform Settings');
        return { success: true };
    },
    getPackages: function () { return this.getData().packages || []; },
    savePackage: function (pkg) {
        const data = this.getData();
        if (!data.packages) data.packages = [];
        if (pkg.id) {
            const idx = data.packages.findIndex(p => p.id === pkg.id);
            if (idx !== -1) data.packages[idx] = pkg;
        } else {
            pkg.id = Date.now();
            data.packages.push(pkg);
        }
        this.saveData(data);
        this.addAdminLog(`Saved Package: ${pkg.name}`);
        return { success: true };
    },
    deletePackage: function (id) {
        const data = this.getData();
        data.packages = (data.packages || []).filter(p => p.id !== id);
        this.saveData(data);
        this.addAdminLog('Deleted Package');
        return { success: true };
    },
    getCommissions: function () {
        const data = this.getData();
        const services = data.services || [];
        const existingComms = data.commissions || [];

        // Return existing comms or default ones for all services
        return services.map(s => {
            const existing = existingComms.find(c => c.serviceId === s.id);
            return existing || {
                serviceId: s.id,
                serviceName: s.label,
                commType: 'Flat',
                retailerComm: '0',
                distributorComm: '0',
                masterComm: '0'
            };
        });
    },
    updateCommission: function (comm) {
        const data = this.getData();
        if (!data.commissions) data.commissions = [];
        const idx = data.commissions.findIndex(c => c.serviceId === comm.serviceId);
        if (idx !== -1) data.commissions[idx] = comm;
        else data.commissions.push(comm);
        this.saveData(data);
        this.addAdminLog(`Updated Commission for ${comm.serviceName}`);
        return { success: true };
    }
};

export default dataService;
