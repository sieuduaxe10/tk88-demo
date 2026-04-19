import React, { lazy, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Lobby from './pages/Lobby';
import GamePlayAnimated from './pages/GamePlayAnimated';
import AdminDashboard from './pages/AdminDashboard';
import { Layout } from './components/layout/Layout';
import { useSessionStore } from './stores/useSessionStore';
import { api } from './services/apiClient';

const Promotions = lazy(() => import('./pages/Promotions'));
const VIP = lazy(() => import('./pages/VIP'));
const Profile = lazy(() => import('./pages/Profile'));
const History = lazy(() => import('./pages/History'));
const MiniGame = lazy(() => import('./pages/MiniGame'));

export default function App() {
  const token = useSessionStore((s) => s.token);
  const setUser = useSessionStore((s) => s.setUser);
  const setBalance = useSessionStore((s) => s.setBalance);
  const logout = useSessionStore((s) => s.logout);

  useEffect(() => {
    if (!token) return;
    api
      .me()
      .then((res) => {
        setUser(res.user);
        setBalance(res.balance);
      })
      .catch(() => logout());
  }, [token, setUser, setBalance, logout]);

  return (
    <Router
      future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
    >
      <Routes>
        {/* Layout-wrapped (has header/footer) */}
        <Route element={<Layout />}>
          <Route path="/" element={<Lobby />} />
          <Route path="/promotions" element={<Promotions />} />
          <Route path="/vip" element={<VIP />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/history" element={<History />} />
          <Route path="/play/:gameId" element={<MiniGame />} />
        </Route>

        {/* Full-bleed (no layout) */}
        <Route path="/player" element={<GamePlayAnimated />} />
        <Route path="/admin" element={<AdminDashboard />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
