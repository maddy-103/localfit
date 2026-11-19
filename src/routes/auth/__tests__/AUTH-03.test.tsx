import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '@/i18n';
import { en } from '@/i18n/en';
import { useAppStore } from '@/store/appStore';
import ConsentPage from '../ConsentPage';

function renderConsent() {
  return render(
    <MemoryRouter initialEntries={['/consent']}>
      <I18nProvider>
        <ConsentPage />
      </I18nProvider>
    </MemoryRouter>,
  );
}

const cleared = {
  location: false,
  marketing: false,
  personalisation: false,
  termsAccepted: false,
};

beforeEach(() => {
  useAppStore.setState((state) => ({
    settings: { ...state.settings, consent: { ...cleared }, onboarded: false },
  }));
});

afterEach(() => {
  cleanup();
});

describe('AUTH-03 separate consents', () => {
  it('keeps live location, marketing and data-use choices independent', () => {
    renderConsent();

    fireEvent.click(screen.getByRole('switch', { name: en['consent.location'] }));

    const consent = useAppStore.getState().settings.consent;
    expect(consent.location).toBe(true);
    expect(consent.marketing).toBe(false);
    expect(consent.personalisation).toBe(false);

    fireEvent.click(screen.getByRole('switch', { name: en['consent.marketing'] }));
    const next = useAppStore.getState().settings.consent;
    expect(next.location).toBe(true);
    expect(next.marketing).toBe(true);
    expect(next.personalisation).toBe(false);
  });

  it('keeps the terms checkbox separate from the three data consents', () => {
    renderConsent();

    fireEvent.click(screen.getByRole('switch', { name: en['consent.personalisation'] }));

    const consent = useAppStore.getState().settings.consent;
    expect(consent.personalisation).toBe(true);
    expect(consent.termsAccepted).toBe(false);
    expect(screen.getByRole('button', { name: en['consent.continue'] })).toBeDisabled();
  });

  it('enables continue only once the terms are accepted', () => {
    renderConsent();

    fireEvent.click(screen.getByLabelText(en['consent.terms']));

    expect(useAppStore.getState().settings.consent.termsAccepted).toBe(true);
    expect(screen.getByRole('button', { name: en['consent.continue'] })).toBeEnabled();
  });

  it('persists the choices so a later session keeps them', () => {
    renderConsent();

    fireEvent.click(screen.getByRole('switch', { name: en['consent.location'] }));

    const stored = window.localStorage.getItem('lf:app');
    expect(stored).toBeTruthy();
    const parsed = JSON.parse(stored ?? '{}') as {
      state?: { settings?: { consent?: { location?: boolean } } };
    };
    expect(parsed.state?.settings?.consent?.location).toBe(true);
  });
});
