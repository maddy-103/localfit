import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
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
          <PrivacyPage />
        </ToastProvider>
      </I18nProvider>
    </MemoryRouter>,
  );
}

beforeEach(() => {
  useAppStore.setState((state) => ({
    settings: {
      ...state.settings,
      consent: { location: true, marketing: true, personalisation: true, termsAccepted: true },
    },
  }));
});

afterEach(() => {
  cleanup();
});

describe('NFR-08 revocable consent', () => {
  it('lets a buyer withdraw one consent later without touching the others', () => {
    renderPrivacy();

    fireEvent.click(screen.getByRole('switch', { name: en['consent.marketing'] }));

    const consent = useAppStore.getState().settings.consent;
    expect(consent.marketing).toBe(false);
    expect(consent.location).toBe(true);
    expect(consent.personalisation).toBe(true);
  });

  it('allows each consent to be turned back on', () => {
    useAppStore.setState((state) => ({
      settings: {
        ...state.settings,
        consent: { location: false, marketing: false, personalisation: false, termsAccepted: true },
      },
    }));
    renderPrivacy();

    fireEvent.click(screen.getByRole('switch', { name: en['consent.location'] }));
    fireEvent.click(screen.getByRole('switch', { name: en['consent.personalisation'] }));

    const consent = useAppStore.getState().settings.consent;
    expect(consent.location).toBe(true);
    expect(consent.personalisation).toBe(true);
    expect(consent.marketing).toBe(false);
  });
});
