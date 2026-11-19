import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { api } from '@/api/client';
import CheckoutPage from '../CheckoutPage';
import { ToastProvider } from '@/components/ui/Toast';
import { I18nProvider } from '@/i18n';
import { en } from '@/i18n/en';
import { setupFlow, teardownFlow } from '@/test/flowFixtures';
import { useAppStore } from '@/store/appStore';

function renderCheckout() {
  return render(
    <MemoryRouter initialEntries={['/checkout']}>
      <I18nProvider>
        <ToastProvider>
          <CheckoutPage />
        </ToastProvider>
      </I18nProvider>
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  await setupFlow();
  useAppStore.setState({
    session: {
      id: 'buyer-ananya',
      name: 'Ananya Iyer',
      phone: '+91 98860 22110',
      role: 'buyer',
    },
  });
  await api.addToBag({
    productId: 'prod-kurta-set',
    variantId: 'var-kurta-m',
    qty: 1,
    tryAtDoor: true,
  });
});

afterEach(() => {
  cleanup();
  useAppStore.setState({ session: null });
  teardownFlow();
});

describe('BUY-08 checkout terms gate', () => {
  it('shows the exact trial terms and keeps Pay disabled until they are seen and ticked', async () => {
    renderCheckout();

    expect(await screen.findByText(en['trialTerms.title'])).toBeInTheDocument();
    expect(screen.getByText(en['trialTerms.defaultOutcome'])).toBeInTheDocument();
    expect(screen.getByText(en['trialTerms.card'])).toBeInTheDocument();
    expect(screen.getByText(en['trialTerms.upi'])).toBeInTheDocument();
    expect(screen.getByText(en['trialTerms.wallet'])).toBeInTheDocument();
    expect(screen.getByText(en['trialTerms.cod'])).toBeInTheDocument();

    const pay = screen.getByRole('button', { name: /^Pay / });
    const terms = screen.getByTestId('trial-terms');
    await waitFor(() => expect(terms).toHaveAttribute('data-terms-visible', 'true'));
    expect(pay).toBeDisabled();

    fireEvent.click(screen.getByRole('checkbox', { name: en['checkout.tick'] }));

    await waitFor(() => expect(pay).toBeEnabled());
  });

  it('keeps Pay disabled when the terms are seen but not accepted', async () => {
    renderCheckout();

    const pay = await screen.findByRole('button', { name: /^Pay / });

    expect(pay).toBeDisabled();
  });
});
