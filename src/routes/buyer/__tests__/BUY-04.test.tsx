import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '@/components/ui/Toast';
import { I18nProvider } from '@/i18n';
import { en } from '@/i18n/en';
import { setupFlow, teardownFlow } from '@/test/flowFixtures';
import ProductPage from '../ProductPage';

const ETA_TEXT = en['product.eta'].replace('{window}', '45–60 min');

beforeEach(async () => {
  await setupFlow();
});

afterEach(() => {
  cleanup();
  teardownFlow();
});

describe('BUY-04 delivery ETA before Add to bag', () => {
  it('shows the shop ETA window ahead of the Add to bag control', async () => {
    render(
      <MemoryRouter initialEntries={['/product/prod-kurta-set']}>
        <I18nProvider>
          <ToastProvider>
            <Routes>
              <Route path="/product/:id" element={<ProductPage />} />
            </Routes>
          </ToastProvider>
        </I18nProvider>
      </MemoryRouter>,
    );

    const eta = await screen.findByText(ETA_TEXT);
    const add = screen.getByRole('button', { name: en['product.addToBag'] });

    expect(eta).toBeInTheDocument();
    expect(add).toBeInTheDocument();
    expect(eta.compareDocumentPosition(add) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
