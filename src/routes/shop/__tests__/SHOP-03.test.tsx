import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/api/client';
import { ToastProvider } from '@/components/ui/Toast';
import { I18nProvider } from '@/i18n';
import { setupFlow, teardownFlow } from '@/test/flowFixtures';
import ProductPage from '@/routes/buyer/ProductPage';

beforeEach(async () => {
  await setupFlow();
});

afterEach(() => {
  cleanup();
  teardownFlow();
});

/**
 * SHOP-03/NFR-03: a counter sale is broadcast on `inventory` and the buyer
 * product page refreshes through api.subscribe within the three-second SLA.
 */
describe('SHOP-03 buyer stock sync', () => {
  it('shows the size out of stock within 3 seconds of Sold in shop', async () => {
    render(
      <MemoryRouter initialEntries={['/product/prod-georgette-saree']}>
        <I18nProvider>
          <ToastProvider>
            <Routes>
              <Route path="/product/:id" element={<ProductPage />} />
            </Routes>
          </ToastProvider>
        </I18nProvider>
      </MemoryRouter>,
    );

    const size = await screen.findByRole('button', { name: 'Free' });
    expect(size).toBeEnabled();

    await act(async () => {
      await api.sellInShop('prod-georgette-saree', 'var-saree-free', 8);
    });

    await waitFor(
      () => expect(screen.getByRole('button', { name: 'Free' })).toBeDisabled(),
      { timeout: 3000 },
    );
    expect((await api.getProduct('prod-georgette-saree'))?.stockLeft).toBe(0);
  });
});
