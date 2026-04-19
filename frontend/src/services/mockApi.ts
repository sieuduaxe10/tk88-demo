import type { User } from '../stores/useSessionStore';

const DELAY = 700;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const USERS_KEY = 'tk88-mock-users';

interface StoredUser extends User {
  password: string;
}

const loadUsers = (): StoredUser[] => {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
  } catch {
    return [];
  }
};
const saveUsers = (users: StoredUser[]) =>
  localStorage.setItem(USERS_KEY, JSON.stringify(users));

const makeToken = () =>
  `mock.${btoa(String(Date.now()))}.${Math.random().toString(36).slice(2)}`;

export const mockApi = {
  async login(username: string, password: string) {
    await sleep(DELAY);
    const users = loadUsers();
    const found = users.find(
      (u) => u.username === username && u.password === password,
    );
    if (!found) throw new Error('Tên đăng nhập hoặc mật khẩu không đúng.');
    const { password: _p, ...user } = found;
    return {
      user,
      token: makeToken(),
      refreshToken: makeToken(),
      balance: 1_000_000,
    };
  },

  async register(username: string, password: string, phone?: string) {
    await sleep(DELAY);
    const users = loadUsers();
    if (users.some((u) => u.username === username)) {
      throw new Error('Tên đăng nhập đã tồn tại.');
    }
    const newUser: StoredUser = {
      id: `u_${Date.now()}`,
      username,
      phone,
      vipLevel: 1,
      createdAt: new Date().toISOString(),
      password,
    };
    users.push(newUser);
    saveUsers(users);
    const { password: _p, ...user } = newUser;
    return {
      user,
      token: makeToken(),
      refreshToken: makeToken(),
      balance: 500_000,
    };
  },

  async forgotPassword(username: string) {
    await sleep(DELAY);
    const users = loadUsers();
    if (!users.some((u) => u.username === username)) {
      throw new Error('Tài khoản không tồn tại.');
    }
    return { message: 'Hướng dẫn đã gửi đến số điện thoại đăng ký.' };
  },

  async deposit(amount: number, method: string) {
    await sleep(DELAY + 500);
    if (amount < 50_000) throw new Error('Số tiền nạp tối thiểu 50,000 ₫');
    return {
      orderId: `DEP_${Date.now()}`,
      method,
      amount,
      status: 'success' as const,
      note: 'DEMO — không có giao dịch tiền thật',
    };
  },

  async withdraw(amount: number, method: string, currentBalance: number) {
    await sleep(DELAY + 500);
    if (amount < 100_000) throw new Error('Số tiền rút tối thiểu 100,000 ₫');
    if (amount > currentBalance) throw new Error('Số dư không đủ.');
    return {
      orderId: `WDR_${Date.now()}`,
      method,
      amount,
      status: 'pending' as const,
      note: 'DEMO — giao dịch ảo sẽ hoàn tất sau vài giây',
    };
  },
};
