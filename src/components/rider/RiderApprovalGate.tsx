import type { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { api } from '@/api/client';
import { useAsync } from '@/lib/useAsync';
import { RiderStates } from './RiderStates';

/** AUTH-05: the console is locked until rider documents are approved. */
export function RiderApprovalGate({ children }: { children: ReactNode }) {
  const registration = useAsync(() => api.getRiderRegistration(), 'rider-approval');

  if (registration.error) {
    return (
      <RiderStates loading={false} error={registration.error} onRetry={registration.reload}>
        {children}
      </RiderStates>
    );
  }
  if (registration.loading) return <RiderStates loading error={null}>{children}</RiderStates>;
  if (registration.data?.status !== 'approved') {
    return <Navigate to="/register/rider/status" replace />;
  }
  return <>{children}</>;
}
