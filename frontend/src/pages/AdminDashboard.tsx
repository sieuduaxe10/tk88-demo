import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { AnimatedBadge } from '../animations/AnimatedComponents';
import { containerVariants, itemVariants, pageVariants } from '../animations/variants';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  telegram: string;
  registeredAt: string;
  deposits: number;
  totalBets: number;
  totalWins: number;
  totalLosses: number;
  balance: number;
  affiliateCode: string;
  status: 'active' | 'suspended' | 'pending';
}

const mockUsers: User[] = [
  {
    id: '1',
    name: 'Nguyễn Văn A',
    email: 'nguyenvana@gmail.com',
    phone: '0901234567',
    telegram: '@nguyenvana',
    registeredAt: '2026-04-10',
    deposits: 5000,
    totalBets: 12500,
    totalWins: 8250,
    totalLosses: 4250,
    balance: 3000,
    affiliateCode: 'REF001NK1A',
    status: 'active',
  },
  {
    id: '2',
    name: 'Trần Thị B',
    email: 'tranthib@gmail.com',
    phone: '0912345678',
    telegram: '@tranthib',
    registeredAt: '2026-04-11',
    deposits: 10000,
    totalBets: 25000,
    totalWins: 15000,
    totalLosses: 10000,
    balance: 5000,
    affiliateCode: 'REF002TT2B',
    status: 'active',
  },
  {
    id: '3',
    name: 'Lê Văn C',
    email: 'levanc@gmail.com',
    phone: '0923456789',
    telegram: '@levanc',
    registeredAt: '2026-04-12',
    deposits: 2000,
    totalBets: 5000,
    totalWins: 2500,
    totalLosses: 2500,
    balance: 500,
    affiliateCode: 'REF003LV3C',
    status: 'active',
  },
  {
    id: '4',
    name: 'Phạm Thị D',
    email: 'phamthid@gmail.com',
    phone: '0934567890',
    telegram: '@phamthid',
    registeredAt: '2026-04-13',
    deposits: 7500,
    totalBets: 18000,
    totalWins: 11000,
    totalLosses: 7000,
    balance: 4500,
    affiliateCode: 'REF004PT4D',
    status: 'suspended',
  },
  {
    id: '5',
    name: 'Hoàng Văn E',
    email: 'hoangvane@gmail.com',
    phone: '0945678901',
    telegram: '@hoangvane',
    registeredAt: '2026-04-14',
    deposits: 3500,
    totalBets: 8500,
    totalWins: 4200,
    totalLosses: 4300,
    balance: 1900,
    affiliateCode: 'REF005HV5E',
    status: 'pending',
  },
];

type Tab = 'overview' | 'users' | 'analytics' | 'affiliate';

export const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const stats = {
    totalUsers: mockUsers.length,
    totalDeposits: mockUsers.reduce((sum, u) => sum + u.deposits, 0),
    totalBets: mockUsers.reduce((sum, u) => sum + u.totalBets, 0),
    totalPayouts: mockUsers.reduce((sum, u) => sum + u.totalWins, 0),
    platformRevenue: mockUsers.reduce((sum, u) => sum + (u.totalBets - u.totalWins), 0),
  };

  return (
    <motion.div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white"
      variants={pageVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.header
        className="bg-gradient-to-r from-blue-900/80 to-slate-900/80 backdrop-blur border-b border-blue-500/30 sticky top-0 z-50"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-5 flex justify-between items-center">
          <motion.div whileHover={{ scale: 1.05 }} className="cursor-pointer">
            <h1 className="text-3xl font-black bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              🛡️ Admin Panel
            </h1>
            <p className="text-xs text-blue-300">TK88 Gaming Platform Management</p>
          </motion.div>

          <motion.div className="flex gap-3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold transition-colors"
            >
              👤 Admin User
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-lg font-semibold transition-colors"
            >
              🚪 Logout
            </motion.button>
          </motion.div>
        </div>
      </motion.header>

      {/* Tab Navigation */}
      <motion.div
        className="bg-slate-800/50 backdrop-blur border-b border-blue-500/20 sticky top-[65px] z-40"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="max-w-7xl mx-auto px-6 py-0">
          <div className="flex gap-1 overflow-x-auto">
            {(['overview', 'users', 'analytics', 'affiliate'] as const).map((tab) => (
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-semibold text-sm uppercase tracking-widest transition-all border-b-2 ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-400'
                    : 'border-transparent text-gray-400 hover:text-gray-300'
                }`}
                whileHover={{ y: -2 }}
              >
                {tab === 'overview' && '📊 Overview'}
                {tab === 'users' && '👥 Users'}
                {tab === 'analytics' && '📈 Analytics'}
                {tab === 'affiliate' && '🤝 Affiliate'}
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h2 className="text-2xl font-bold mb-6">📊 Platform Overview</h2>

            <motion.div
              className="grid grid-cols-5 gap-4 mb-8"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {[
                { label: 'Total Users', value: stats.totalUsers, icon: '👥', color: 'from-blue-600 to-blue-700' },
                { label: 'Total Deposits', value: `$${stats.totalDeposits.toLocaleString()}`, icon: '💰', color: 'from-green-600 to-green-700' },
                { label: 'Total Bets', value: `$${stats.totalBets.toLocaleString()}`, icon: '🎲', color: 'from-purple-600 to-purple-700' },
                { label: 'Total Payouts', value: `$${stats.totalPayouts.toLocaleString()}`, icon: '🏆', color: 'from-yellow-600 to-yellow-700' },
                { label: 'Platform Revenue', value: `$${stats.platformRevenue.toLocaleString()}`, icon: '💎', color: 'from-red-600 to-red-700' },
              ].map((stat, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className={`bg-gradient-to-br ${stat.color} rounded-xl p-6 backdrop-blur border border-white/10`}
                >
                  <div className="text-3xl mb-2">{stat.icon}</div>
                  <div className="text-sm text-white/80 mb-2">{stat.label}</div>
                  <div className="text-2xl font-bold">{stat.value}</div>
                </motion.div>
              ))}
            </motion.div>

            <motion.div
              className="grid grid-cols-2 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {/* Recent Activity */}
              <motion.div
                variants={itemVariants}
                className="bg-slate-800/50 backdrop-blur border border-blue-500/20 rounded-xl p-6"
              >
                <h3 className="text-lg font-bold mb-4">📌 Recent Registrations</h3>
                <div className="space-y-3">
                  {mockUsers.slice(0, 3).map((user) => (
                    <motion.div key={user.id} className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
                      <div>
                        <div className="font-semibold">{user.name}</div>
                        <div className="text-xs text-gray-400">{user.registeredAt}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-green-400">+${user.deposits}</div>
                        <div className="text-xs text-gray-400">Deposit</div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Quick Stats */}
              <motion.div
                variants={itemVariants}
                className="bg-slate-800/50 backdrop-blur border border-blue-500/20 rounded-xl p-6"
              >
                <h3 className="text-lg font-bold mb-4">⚡ Quick Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between p-3 bg-slate-700/30 rounded-lg">
                    <span>Active Users</span>
                    <span className="font-bold text-green-400">{mockUsers.filter(u => u.status === 'active').length}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-700/30 rounded-lg">
                    <span>Suspended Users</span>
                    <span className="font-bold text-red-400">{mockUsers.filter(u => u.status === 'suspended').length}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-700/30 rounded-lg">
                    <span>Pending Verification</span>
                    <span className="font-bold text-yellow-400">{mockUsers.filter(u => u.status === 'pending').length}</span>
                  </div>
                  <div className="flex justify-between p-3 bg-slate-700/30 rounded-lg">
                    <span>Avg Deposit</span>
                    <span className="font-bold text-blue-400">${(stats.totalDeposits / stats.totalUsers).toFixed(2)}</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">👥 User Management</h2>
              <input
                type="text"
                placeholder="🔍 Search users..."
                className="px-4 py-2 bg-slate-700/50 border border-blue-500/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <motion.div
              className="bg-slate-800/50 backdrop-blur border border-blue-500/20 rounded-xl overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <table className="w-full">
                <thead className="bg-slate-700/50 border-b border-blue-500/20">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-blue-300">Name</th>
                    <th className="px-6 py-4 text-left font-semibold text-blue-300">Email</th>
                    <th className="px-6 py-4 text-left font-semibold text-blue-300">Phone</th>
                    <th className="px-6 py-4 text-left font-semibold text-blue-300">Telegram</th>
                    <th className="px-6 py-4 text-left font-semibold text-blue-300">Deposits</th>
                    <th className="px-6 py-4 text-left font-semibold text-blue-300">Bets</th>
                    <th className="px-6 py-4 text-left font-semibold text-blue-300">W/L</th>
                    <th className="px-6 py-4 text-left font-semibold text-blue-300">Status</th>
                    <th className="px-6 py-4 text-left font-semibold text-blue-300">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.map((user, idx) => (
                    <motion.tr
                      key={user.id}
                      variants={itemVariants}
                      custom={idx}
                      className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold">{user.name}</td>
                      <td className="px-6 py-4 text-sm text-gray-400">{user.email}</td>
                      <td className="px-6 py-4 text-sm">{user.phone}</td>
                      <td className="px-6 py-4 text-sm text-blue-400">{user.telegram}</td>
                      <td className="px-6 py-4 font-semibold text-green-400">${user.deposits}</td>
                      <td className="px-6 py-4 font-semibold">${user.totalBets}</td>
                      <td className="px-6 py-4">
                        <span className={user.totalWins >= user.totalLosses ? 'text-green-400' : 'text-red-400'}>
                          ${user.totalWins} / ${user.totalLosses}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <AnimatedBadge
                          variant={
                            user.status === 'active'
                              ? 'success'
                              : user.status === 'suspended'
                              ? 'danger'
                              : 'warning'
                          }
                        >
                          {user.status.charAt(0).toUpperCase() + user.status.slice(1)}
                        </AnimatedBadge>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={() => setSelectedUser(user)}
                          className="text-blue-400 hover:text-blue-300 font-semibold text-sm"
                        >
                          View Details
                        </button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>

            {/* User Detail Modal */}
            {selectedUser && (
              <motion.div
                className="fixed inset-0 bg-black/50 backdrop-blur flex items-center justify-center z-50"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setSelectedUser(null)}
              >
                <motion.div
                  className="bg-slate-800 border border-blue-500/30 rounded-xl p-8 max-w-2xl w-full mx-4"
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-2xl font-bold">User Details</h3>
                    <button
                      onClick={() => setSelectedUser(null)}
                      className="text-2xl text-gray-400 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-semibold text-blue-300 mb-2">Name</label>
                      <div className="bg-slate-700/50 p-3 rounded-lg">{selectedUser.name}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-blue-300 mb-2">Email</label>
                      <div className="bg-slate-700/50 p-3 rounded-lg text-sm">{selectedUser.email}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-blue-300 mb-2">Phone</label>
                      <div className="bg-slate-700/50 p-3 rounded-lg">{selectedUser.phone}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-blue-300 mb-2">Telegram</label>
                      <div className="bg-slate-700/50 p-3 rounded-lg">{selectedUser.telegram}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-blue-300 mb-2">Registered</label>
                      <div className="bg-slate-700/50 p-3 rounded-lg text-sm">{selectedUser.registeredAt}</div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-blue-300 mb-2">Balance</label>
                      <div className="bg-slate-700/50 p-3 rounded-lg font-bold text-green-400">${selectedUser.balance}</div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-blue-300 mb-2">Affiliate Code</label>
                      <div className="bg-slate-700/50 p-3 rounded-lg font-mono text-sm flex justify-between items-center">
                        <span>{selectedUser.affiliateCode}</span>
                        <button className="text-blue-400 hover:text-blue-300 font-semibold">Copy</button>
                      </div>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-semibold text-blue-300 mb-2">Statistics</label>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                          <div className="text-xs text-gray-400 mb-1">Deposits</div>
                          <div className="font-bold text-green-400">${selectedUser.deposits}</div>
                        </div>
                        <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                          <div className="text-xs text-gray-400 mb-1">Total Bets</div>
                          <div className="font-bold">${selectedUser.totalBets}</div>
                        </div>
                        <div className="bg-slate-700/50 p-3 rounded-lg text-center">
                          <div className="text-xs text-gray-400 mb-1">Win Rate</div>
                          <div className="font-bold text-blue-400">{((selectedUser.totalWins / (selectedUser.totalWins + selectedUser.totalLosses)) * 100).toFixed(1)}%</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-8">
                    <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg font-semibold">
                      Approve User
                    </button>
                    <button className="flex-1 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg font-semibold">
                      Suspend User
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* ANALYTICS TAB */}
        {activeTab === 'analytics' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h2 className="text-2xl font-bold mb-6">📈 Financial Analytics</h2>

            <motion.div
              className="grid grid-cols-2 gap-6"
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <motion.div
                variants={itemVariants}
                className="bg-slate-800/50 backdrop-blur border border-blue-500/20 rounded-xl p-6"
              >
                <h3 className="text-lg font-bold mb-4">💹 Deposit Tracking</h3>
                <div className="space-y-3">
                  {mockUsers.map((user) => (
                    <div key={user.id} className="flex justify-between items-center">
                      <span className="text-sm">{user.name}</span>
                      <div className="flex-1 mx-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-green-500 to-green-400"
                          style={{ width: `${(user.deposits / 10000) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-green-400">${user.deposits}</span>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="bg-slate-800/50 backdrop-blur border border-blue-500/20 rounded-xl p-6"
              >
                <h3 className="text-lg font-bold mb-4">🎲 Betting Activity</h3>
                <div className="space-y-3">
                  {mockUsers.map((user) => (
                    <div key={user.id} className="flex justify-between items-center">
                      <span className="text-sm">{user.name}</span>
                      <div className="flex-1 mx-3 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-purple-400"
                          style={{ width: `${(user.totalBets / 25000) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-bold text-purple-400">${user.totalBets}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </motion.div>
        )}

        {/* AFFILIATE TAB */}
        {activeTab === 'affiliate' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
            <h2 className="text-2xl font-bold mb-6">🤝 Affiliate Management</h2>

            <motion.div
              className="bg-slate-800/50 backdrop-blur border border-blue-500/20 rounded-xl overflow-hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <table className="w-full">
                <thead className="bg-slate-700/50 border-b border-blue-500/20">
                  <tr>
                    <th className="px-6 py-4 text-left font-semibold text-blue-300">User Name</th>
                    <th className="px-6 py-4 text-left font-semibold text-blue-300">Affiliate Code</th>
                    <th className="px-6 py-4 text-left font-semibold text-blue-300">Affiliate Link</th>
                    <th className="px-6 py-4 text-left font-semibold text-blue-300">Referred Users</th>
                    <th className="px-6 py-4 text-left font-semibold text-blue-300">Commission</th>
                    <th className="px-6 py-4 text-left font-semibold text-blue-300">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {mockUsers.map((user, idx) => (
                    <motion.tr
                      key={user.id}
                      variants={itemVariants}
                      custom={idx}
                      className="border-b border-slate-700/50 hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-4 font-semibold">{user.name}</td>
                      <td className="px-6 py-4 font-mono text-sm text-blue-400">{user.affiliateCode}</td>
                      <td className="px-6 py-4 text-sm">
                        <div className="flex gap-2 items-center">
                          <input
                            type="text"
                            readOnly
                            value={`tk88.com/?ref=${user.affiliateCode}`}
                            className="bg-slate-700/50 px-2 py-1 rounded text-xs w-40"
                          />
                          <button className="text-blue-400 hover:text-blue-300 font-semibold text-sm">
                            Copy
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-semibold">{Math.floor(Math.random() * 20)}</td>
                      <td className="px-6 py-4 font-semibold text-green-400">
                        ${Math.floor(user.totalBets * 0.02).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <AnimatedBadge variant="success">Active</AnimatedBadge>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default AdminDashboard;
