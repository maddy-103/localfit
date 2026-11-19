import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nProvider } from '@/i18n';
import { en } from '@/i18n/en';
import { ToastProvider } from '@/components/ui/Toast';
import { useAppStore } from '@/store/appStore';
import PrivacyPage from '../PrivacyPage';

function renderPrivacy() {
  return render(
    <MemoryRouter initialEntries={['/profile/privacy']}>
      <I18nProvider>
        <ToastProvider>
          <Routes>
            <Route path="/profile/privacy" element={<PrivacyPage />} />
            <Route path="/welcome" element={<h1>{en['welcome.heading']}</h1>} />
          </Routes>
        </ToastProvider>
      </I18nProvider>
    </MemoryRouter>,
  );
}

const createObjectURL = vi.fn<(blob: Blob) => string>(() => 'blob:localfit-test');
const revokeObjectURL = vi.fn();
let clickSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  clickSpy = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  Object.defineProperty(URL, 'createObjectURL', {
    value: createObjectURL,
    configurable: true,
    writable: true,
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    value: revokeObjectURL,
    configurable: true,
    writable: true,
  });
  createObjectURL.mockClear();
  revokeObjectURL.mockClear();

  useAppStore.setState((state) => ({
    session: {
      id: 'buyer-ananya',
      name: 'Ananya Iyer',
      phone: '+91 98860 22110',
      role: 'buyer',
    },
    settings: {
      ...state.settings,
      onboarded: true,
      consent: { location: true, marketing: true, personalisation: false, termsAccepted: true },
    },
  }));
});

afterEach(() => {
  cleanup();
  clickSpy.mockClear();
  useAppStore.setState({ session: null });
});

describe('BUY-17 data download and account deletion', () => {
  it('downloads the buyer data as JSON and confirms with a toast', async () => {
    renderPrivacy();

    fireEvent.click(screen.getByRole('button', { name: en['privacy.download'] }));

    expect(createObjectURL).toHaveBeenCalledTimes(1);
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(revokeObjectURL).toHaveBeenCalledTimes(1);
    expect(await screen.findByText(en['privacy.downloaded'])).toBeInTheDocument();

    const blob = createObjectURL.mock.calls[0]![0];
    const text = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = () => reject(reader.error);
      reader.readAsText(blob);
    });
    const payload = JSON.parse(text);
    expect(payload.session.phone).toBe('+91 98860 22110');
    expect(payload.settings.consent.marketing).toBe(true);
  });

  it('deletes the account only after both confirmation steps', async () => {
    renderPrivacy();

    const deleteButton = screen.getByRole('button', { name: en['privacy.deleteButton'] });
    expect(deleteButton).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox', { name: en['privacy.confirmStep1'] }));
    expect(deleteButton).toBeDisabled();

    const confirmInput = screen.getByLabelText(en['privacy.confirmStep2']);
    fireEvent.change(confirmInput, { target: { value: 'delete' } });
    expect(deleteButton).toBeDisabled();

    fireEvent.change(confirmInput, { target: { value: 'DELETE' } });
    expect(deleteButton).toBeEnabled();

    fireEvent.click(deleteButton);

    expect(useAppStore.getState().session).toBeNull();
    expect(useAppStore.getState().settings.onboarded).toBe(false);
    expect(await screen.findByRole('heading', { name: en['welcome.heading'] })).toBeVisible();
  });
});
