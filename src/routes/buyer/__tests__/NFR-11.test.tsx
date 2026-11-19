import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '@/i18n';
import { en } from '@/i18n/en';
import { api } from '@/api/client';
import { setupFlow, teardownFlow } from '@/test/flowFixtures';
import PaymentMethodsPage from '../PaymentMethodsPage';

function renderPayments() {
  return render(
    <MemoryRouter initialEntries={['/profile/payments']}>
      <I18nProvider>
        <PaymentMethodsPage />
      </I18nProvider>
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  await setupFlow();
});

afterEach(() => {
  cleanup();
  teardownFlow();
});

describe('NFR-11 token-only payment display', () => {
  it('shows saved gateway tokens instead of card numbers', async () => {
    renderPayments();

    expect(await screen.findByText(/upi••4821/)).toBeInTheDocument();
    expect(screen.getByText(/card••4242/)).toBeInTheDocument();
    expect(screen.getByText(/wallet••9015/)).toBeInTheDocument();
    expect(screen.getByText(en['payments.note'])).toBeInTheDocument();
    expect(document.body.textContent ?? '').not.toMatch(/\d{12,19}/);
  });

  it('keeps adding new methods disabled in phase 2', async () => {
    renderPayments();

    await screen.findByText(/upi••4821/);
    expect(screen.getByRole('button', { name: en['payments.addNew'] })).toBeDisabled();
  });

  it('returns only tokens from the API, never a card number', async () => {
    const methods = await api.listPaymentMethods();

    expect(methods.length).toBeGreaterThan(0);
    for (const method of methods) {
      expect(method.token).toContain('••');
      expect(Object.keys(method)).not.toContain('cardNumber');
      expect(Object.keys(method)).not.toContain('pan');
    }
    expect(JSON.stringify(methods)).not.toMatch(/\d{12,19}/);
  });
});
