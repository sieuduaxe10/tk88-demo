import React from 'react';
import { useSessionStore } from '../../stores/useSessionStore';
import { CTAButton } from '../ui/CTAButton';

export const AuthButtons: React.FC<{ compact?: boolean }> = ({ compact }) => {
  const openAuthModal = useSessionStore((s) => s.openAuthModal);

  return (
    <div className="flex items-center gap-2">
      <CTAButton
        variant="secondary"
        size={compact ? 'sm' : 'md'}
        onClick={() => openAuthModal('login')}
      >
        Đăng Nhập
      </CTAButton>
      <CTAButton
        variant="primary"
        size={compact ? 'sm' : 'md'}
        onClick={() => openAuthModal('register')}
      >
        Đăng Ký
      </CTAButton>
    </div>
  );
};

export default AuthButtons;
