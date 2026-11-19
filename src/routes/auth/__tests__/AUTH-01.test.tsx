import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '@/i18n';
import { en } from '@/i18n/en';
import { createFakeClock, resetClock, setClock, type FakeClock } from '@/lib/clock';
import OtpPage from '../OtpPage';

let clock: FakeClock;

function renderOtp() {
  return render(
    <MemoryRouter initialEntries={[{ pathname: '/login/otp', state: { phone: '9886022110', returnTo: '/' } }]}>
      <I18nProvider>
        <OtpPage />
      </I18nProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  clock = createFakeClock('2026-11-19T10:00:00.000Z');
  setClock(clock);
});

afterEach(() => {
  cleanup();
  resetClock();
  vi.unstubAllEnvs();
});

describe('AUTH-01 OTP delivery fallbacks', () => {
  it('hides resend and WhatsApp until the timeout, then offers both', async () => {
    renderOtp();

    const resend = screen.getByRole('button', { name: en['auth.resendIn'].replace('{seconds}', '30') });
    expect(resend).toBeDisabled();
    expect(screen.queryByRole('button', { name: en['auth.whatsapp'] })).not.toBeInTheDocument();

    act(() => { clock.advance(31_000); });
    await waitFor(() => expect(screen.getByRole('button', { name: en['auth.resend'] })).toBeEnabled(), { timeout: 3000 });

    act(() => { clock.advance(30_000); });
    const whatsapp = await screen.findByRole('button', { name: en['auth.whatsapp'] }, { timeout: 3000 });
    fireEvent.click(whatsapp);

    expect(await screen.findByText(en['auth.whatsappSent'])).toBeInTheDocument();
    expect(screen.getByRole('button', { name: en['auth.resendIn'].replace('{seconds}', '30') })).toBeDisabled();
  });

  it('shows the fixed demo code only when VITE_DEMO is true', async () => {
    vi.stubEnv('VITE_DEMO', 'true');
    renderOtp();
    expect(await screen.findByText(en['auth.demoCode'].replace('{code}', '123456'))).toBeInTheDocument();
  });

  it('does not show the demo code in a normal build', () => {
    renderOtp();
    expect(screen.queryByText(en['auth.demoCode'].replace('{code}', '123456'))).not.toBeInTheDocument();
  });
});
