import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { SiteHeader } from './SiteHeader';
import { SiteFooter } from './SiteFooter';
import { MobileDrawer } from './MobileDrawer';
import { SearchCommand } from './SearchCommand';
import { AuthModal } from '../auth/AuthModal';
import { PaymentModal } from '../payment/PaymentModal';

export const Layout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-casino-bg text-white">
      <SiteHeader />
      <MobileDrawer />
      <SearchCommand />
      <AuthModal />
      <PaymentModal />

      <main className="flex-1">
        <Suspense
          fallback={
            <div className="flex items-center justify-center py-20">
              <div className="animate-pulse text-casino-gold">Đang tải…</div>
            </div>
          }
        >
          <Outlet />
        </Suspense>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Layout;
