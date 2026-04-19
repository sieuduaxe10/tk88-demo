import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { useSessionStore } from '../stores/useSessionStore';

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3002';

export const apiClient: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 10_000,
});

// Attach access token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { token } = useSessionStore.getState();
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Auto-refresh on 401
let refreshPromise: Promise<string | null> | null = null;
const doRefresh = async (): Promise<string | null> => {
  const { refreshToken, setTokens, logout } = useSessionStore.getState();
  if (!refreshToken) {
    logout();
    return null;
  }
  try {
    const res = await axios.post(`${BASE_URL}/tk88/auth/refresh`, { refreshToken });
    const newToken: string = res.data.token;
    setTokens(newToken, refreshToken);
    return newToken;
  } catch {
    logout();
    return null;
  }
};

apiClient.interceptors.response.use(
  (r) => r,
  async (error) => {
    const cfg = error.config;
    if (error.response?.status === 401 && cfg && !cfg._retried) {
      cfg._retried = true;
      refreshPromise = refreshPromise || doRefresh();
      const newToken = await refreshPromise;
      refreshPromise = null;
      if (newToken) {
        cfg.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(cfg);
      }
    }
    return Promise.reject(error);
  },
);

// ─── Error mapping ───────────────────────────────────────────────────────
const ERR_MAP: Record<string, string> = {
  username_taken: 'Tên đăng nhập đã tồn tại.',
  username_too_short: 'Tên đăng nhập phải có ít nhất 4 ký tự.',
  password_too_short: 'Mật khẩu phải có ít nhất 6 ký tự.',
  invalid_credentials: 'Tên đăng nhập hoặc mật khẩu không đúng.',
  min_50000: 'Số tiền nạp tối thiểu 50,000 ₫',
  min_100000: 'Số tiền rút tối thiểu 100,000 ₫',
  min_10000: 'Cược tối thiểu 10,000 ₫',
  max_5000000: 'Cược tối đa 5,000,000 ₫',
  insufficient_balance: 'Số dư không đủ.',
  unknown_game: 'Game không tồn tại.',
};
const mapError = (err: unknown, fallback: string): Error => {
  if (axios.isAxiosError(err)) {
    const code = err.response?.data?.error;
    if (code && ERR_MAP[code]) return new Error(ERR_MAP[code]);
    if (!err.response) return new Error('Không kết nối được máy chủ. Vui lòng thử lại.');
  }
  return new Error(fallback);
};

// ─── API ─────────────────────────────────────────────────────────────────
export const api = {
  async login(username: string, password: string) {
    try {
      const res = await apiClient.post('/tk88/auth/login', { username, password });
      return res.data as {
        user: import('../stores/useSessionStore').User;
        token: string;
        refreshToken: string;
        balance: number;
      };
    } catch (e) {
      throw mapError(e, 'Đăng nhập thất bại.');
    }
  },

  async register(username: string, password: string, phone?: string) {
    try {
      const res = await apiClient.post('/tk88/auth/register', { username, password, phone });
      return res.data as {
        user: import('../stores/useSessionStore').User;
        token: string;
        refreshToken: string;
        balance: number;
      };
    } catch (e) {
      throw mapError(e, 'Đăng ký thất bại.');
    }
  },

  async forgotPassword(_username: string) {
    // Not implemented server-side — keep demo UX
    await new Promise((r) => setTimeout(r, 500));
    return { message: 'Hướng dẫn đã gửi đến số điện thoại đăng ký.' };
  },

  async me() {
    const res = await apiClient.get('/tk88/auth/me');
    return res.data as { user: import('../stores/useSessionStore').User; balance: number };
  },

  async deposit(amount: number, method: string) {
    try {
      const res = await apiClient.post('/tk88/wallet/deposit', { amount, method });
      return {
        orderId: res.data.orderId as string,
        method,
        amount,
        status: (res.data.status as 'pending' | 'success') ?? 'pending',
        balance: res.data.balance as number,
        note: 'Chờ admin xác nhận sau khi bạn chuyển khoản.',
      };
    } catch (e) {
      throw mapError(e, 'Nạp tiền thất bại.');
    }
  },

  async orderStatus(orderId: string) {
    try {
      const res = await apiClient.get(`/tk88/wallet/order/${orderId}`);
      return res.data as {
        id: string;
        type: 'deposit' | 'withdraw' | 'bet';
        amount: number;
        method: string;
        status: 'pending' | 'success' | 'rejected' | 'cancelled';
        created_at: string;
        balance: number;
      };
    } catch (e) {
      throw mapError(e, 'Không kiểm tra được đơn.');
    }
  },

  async cancelOrder(orderId: string) {
    try {
      const res = await apiClient.post(`/tk88/wallet/order/${orderId}/cancel`);
      return res.data as { ok: true };
    } catch (e) {
      throw mapError(e, 'Không hủy được đơn.');
    }
  },

  async withdraw(amount: number, method: string) {
    try {
      const res = await apiClient.post('/tk88/wallet/withdraw', { amount, method });
      return {
        orderId: `WDR_${Date.now()}`,
        method,
        amount,
        status: 'pending' as const,
        balance: res.data.balance as number,
        note: 'DEMO — giao dịch ảo sẽ hoàn tất sau vài giây',
      };
    } catch (e) {
      throw mapError(e, 'Rút tiền thất bại.');
    }
  },

  async bet(gameId: string, prediction: string, amount: number) {
    try {
      const res = await apiClient.post('/tk88/wallet/bet', { gameId, prediction, amount });
      return res.data as {
        ok: true;
        balance: number;
        win: boolean;
        payout: number;
        delta: number;
        result: { label: string; detail: string };
        reveal: Record<string, any> | null;
      };
    } catch (e) {
      throw mapError(e, 'Đặt cược thất bại.');
    }
  },

  async betMulti(
    gameId: string,
    bets: { prediction: string; amount: number }[],
  ) {
    try {
      const res = await apiClient.post('/tk88/wallet/bet', { gameId, bets });
      return res.data as {
        ok: true;
        balance: number;
        win: boolean;
        payout: number;
        delta: number;
        result: { label: string; detail: string };
        reveal: Record<string, any> | null;
      };
    } catch (e) {
      throw mapError(e, 'Đặt cược thất bại.');
    }
  },

  async history() {
    try {
      const res = await apiClient.get('/tk88/wallet/history');
      return res.data.items as {
        id: string;
        type: 'deposit' | 'withdraw' | 'bet';
        amount: number;
        method: string;
        status: string;
        created_at: string;
      }[];
    } catch (e) {
      throw mapError(e, 'Không tải được lịch sử.');
    }
  },
};
