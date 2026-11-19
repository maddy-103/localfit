import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nProvider } from '@/i18n';
import { en } from '@/i18n/en';
import { useAppStore } from '@/store/appStore';
import ProfileRolesPage from '../ProfileRolesPage';

function renderRoles() {
  return render(
    <MemoryRouter initialEntries={['/profile/roles']}>
      <I18nProvider>
        <Routes>
          <Route path="/profile/roles" element={<ProfileRolesPage />} />
          <Route path="/shop" element={<h1>Shop console</h1>} />
          <Route path="/rider" element={<h1>Rider console</h1>} />
          <Route path="/" element={<h1>Buyer home</h1>} />
        </Routes>
      </I18nProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAppStore.setState({
    session: {
      id: 'buyer-ananya',
      name: 'Ananya Iyer',
      phone: '+91 98860 22110',
      role: 'buyer',
      availableRoles: ['buyer', 'shop', 'rider'],
    },
  });
});

afterEach(() => {
  cleanup();
  useAppStore.setState({ session: null });
});

describe('AUTH-07 role switching', () => {
  it('switches to the shop role without asking for another OTP', async () => {
    renderRoles();

    fireEvent.click(screen.getByRole('button', { name: en['roles.switch'].replace('{role}', en['nav.shop']) }));

    const session = useAppStore.getState().session;
    expect(session?.role).toBe('shop');
    expect(session?.phone).toBe('+91 98860 22110');
    expect(await screen.findByRole('heading', { name: 'Shop console' })).toBeVisible();
    expect(screen.queryByText(en['auth.otpTitle'])).not.toBeInTheDocument();
  });

  it('disables the button for the role that is already active', () => {
    renderRoles();

    expect(
      screen.getByRole('button', { name: en['roles.switch'].replace('{role}', en['nav.buyer']) }),
    ).toBeDisabled();
  });

  it('keeps the phone number when switching to the rider role', () => {
    renderRoles();

    fireEvent.click(screen.getByRole('button', { name: en['roles.switch'].replace('{role}', en['nav.rider']) }));

    const session = useAppStore.getState().session;
    expect(session?.role).toBe('rider');
    expect(session?.id).toBe('buyer-ananya');
  });
});
