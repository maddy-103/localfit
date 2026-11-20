import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '@/api/client';
import { useAsync } from '@/lib/useAsync';
import { ShopStates } from './ShopStates';

/** AUTH-04: the console is locked until the shop registration is approved. */
export function ShopApprovalGate({ children }: { children: ReactNode }) {
  const registration = useAsync(() => api.getShopRegistration(), 'shop-approval');

  if (registration.error) {
    return (
      <ShopStates
        loading={false}
        error={registration.error}
        onRetry={registration.reload}
      >
        {children}
      </ShopStates>
    );
  }
  if (registration.loading) {
    return <ShopStates loading error={null}>{children}</ShopStates>;
  }
  if (registration.data?.stage !== 'approved') {
    return <Navigate to="/register/shop/status" replace />;
  }
  return <>{children}</>;
}
