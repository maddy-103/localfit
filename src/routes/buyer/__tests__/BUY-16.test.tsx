import type { ReactNode } from 'react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { I18nProvider } from '@/i18n';
import { en } from '@/i18n/en';
import { ToastProvider } from '@/components/ui/Toast';
import { setupFlow, teardownFlow } from '@/test/flowFixtures';
import { useAppStore } from '@/store/appStore';
import ProductPage from '../ProductPage';
import CheckoutPage from '../CheckoutPage';

function LoginTarget() {
  const location = useLocation();
  const state = location.state as { returnTo?: string } | null;
  return (
    <div>
      <h1>{en['route.login']}</h1>
      <p data-testid="return-to">{state?.returnTo ?? 'none'}</p>
    </div>
  );
}

function renderAt(path: string, element: ReactNode) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <I18nProvider>
        <ToastProvider>
          <Routes>
            <Route path="/product/:id" element={element} />
            <Route path="/checkout" element={element} />
            <Route path="/login" element={<LoginTarget />} />
          </Routes>
        </ToastProvider>
      </I18nProvider>
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  await setupFlow();
  useAppStore.setState({ session: null, wishlist: [], wishlistSizes: {} });
});

afterEach(() => {
  cleanup();
  useAppStore.setState({ session: null, wishlist: [], wishlistSizes: {} });
  teardownFlow();
});

describe('BUY-16 guest access', () => {
  it('lets a guest open a public buyer route without a redirect', async () => {
    renderAt('/product/prod-kurta-set', <ProductPage />);
    expect(await screen.findByText('Handblock cotton kurta set')).toBeInTheDocument();
    expect(screen.queryByTestId('return-to')).not.toBeInTheDocument();
  });

  it('sends a guest who saves a wishlist item to login with a return path', async () => {
    renderAt('/product/prod-kurta-set', <ProductPage />);
    const save = await screen.findByRole('button', { name: en['product.wishlistAdd'] });

    fireEvent.click(save);

    expect(await screen.findByTestId('return-to')).toHaveTextContent('/product/prod-kurta-set');
    expect(useAppStore.getState().wishlist).toEqual([]);
  });

  it('sends a guest from checkout to login and keeps the checkout return path', async () => {
    renderAt('/checkout', <CheckoutPage />);
    expect(await screen.findByTestId('return-to')).toHaveTextContent('/checkout');
  });

  it('returns the buyer to the original route after signing in', async () => {
    renderAt('/product/prod-kurta-set', <ProductPage />);
    fireEvent.click(await screen.findByRole('button', { name: en['product.wishlistAdd'] }));
    const path = (await screen.findByTestId('return-to')).textContent;

    useAppStore.setState({
      session: { id: 'buyer-ananya', name: 'Ananya', phone: '+91 98860 22110', role: 'buyer' },
    });
    cleanup();
    renderAt(path ?? '/', <ProductPage />);

    expect(await screen.findByText('Handblock cotton kurta set')).toBeInTheDocument();
    expect(screen.queryByTestId('return-to')).not.toBeInTheDocument();
  });
});
