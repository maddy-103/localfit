import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { RoleGuard } from './RoleGuard';
import { useAppStore, type SessionUser } from '@/store/appStore';

const buyer: SessionUser = {
  id: 'test-buyer',
  name: 'Ananya Iyer',
  phone: '+91 98860 22110',
  role: 'buyer',
};

const shop: SessionUser = {
  id: 'test-shop',
  name: 'Kiran Silks',
  phone: '+91 98450 11221',
  role: 'shop',
};

const supportAdmin: SessionUser = {
  id: 'test-support',
  name: 'Neha Kulkarni',
  phone: '+91 98800 11001',
  role: 'admin',
  adminRole: 'support_agent',
};

const financeAdmin: SessionUser = {
  id: 'test-finance',
  name: 'Suresh Pillai',
  phone: '+91 98800 11003',
  role: 'admin',
  adminRole: 'finance',
};

const superAdmin: SessionUser = {
  id: 'test-super',
  name: 'Meera Krishnan',
  phone: '+91 98800 11005',
  role: 'super_admin',
  adminRole: 'super_admin',
};

function renderGuard(
  session: SessionUser | null,
  guard: {
    requiredRole?: SessionUser['role'] | SessionUser['role'][];
    requiresAuth?: boolean;
    adminPermission?: string;
  },
) {
  useAppStore.setState({ session });

  return render(
    <MemoryRouter initialEntries={['/guarded']}>
      <Routes>
        <Route path="/" element={<p>home screen</p>} />
        <Route path="/login" element={<p>login screen</p>} />
        <Route path="/forbidden" element={<p>forbidden screen</p>} />
        <Route
          path="/guarded"
          element={
            <RoleGuard {...guard}>
              <p>guarded screen</p>
            </RoleGuard>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
  useAppStore.setState({ session: null });
});

describe('RoleGuard', () => {
  it('lets a guest open a public buyer route', () => {
    renderGuard(null, {});
    expect(screen.getByText('guarded screen')).toBeInTheDocument();
  });

  it('sends a guest from a signed-in route to the login screen', () => {
    renderGuard(null, { requiresAuth: true });
    expect(screen.getByText('login screen')).toBeInTheDocument();
    expect(screen.queryByText('guarded screen')).not.toBeInTheDocument();
  });

  it('sends a guest away from a role-specific route to login', () => {
    renderGuard(null, { requiredRole: 'shop' });
    expect(screen.getByText('login screen')).toBeInTheDocument();
  });

  it('lets a buyer open a signed-in buyer route', () => {
    renderGuard(buyer, { requiresAuth: true });
    expect(screen.getByText('guarded screen')).toBeInTheDocument();
  });

  it('lets a shopkeeper open the shop console', () => {
    renderGuard(shop, { requiredRole: 'shop' });
    expect(screen.getByText('guarded screen')).toBeInTheDocument();
  });

  it('sends the wrong role to access denied, not to a redirect loop', () => {
    renderGuard(buyer, { requiredRole: 'shop' });
    expect(screen.getByText('forbidden screen')).toBeInTheDocument();
  });

  it('accepts either admin role for the admin console', () => {
    renderGuard(supportAdmin, { requiredRole: ['admin', 'super_admin'] });
    expect(screen.getByText('guarded screen')).toBeInTheDocument();
  });

  it('allows an admin who holds the extra screen permission', () => {
    renderGuard(financeAdmin, { adminPermission: 'read:payouts' });
    expect(screen.getByText('guarded screen')).toBeInTheDocument();
  });

  it('denies an admin who lacks the extra screen permission', () => {
    renderGuard(supportAdmin, { adminPermission: 'read:payouts' });
    expect(screen.getByText('forbidden screen')).toBeInTheDocument();
  });

  it('supports the super-admin wildcard', () => {
    renderGuard(superAdmin, { adminPermission: '*' });
    expect(screen.getByText('guarded screen')).toBeInTheDocument();
  });
});
