import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { ToastProvider } from '@/components/ui/Toast';
import { I18nProvider } from '@/i18n';
import { en } from '@/i18n/en';
import { setupFlow, teardownFlow } from '@/test/flowFixtures';
import ProductPage from '../ProductPage';

function renderProduct() {
  return render(
    <MemoryRouter initialEntries={['/product/prod-linen-shirt']}>
      <I18nProvider>
        <ToastProvider>
          <Routes>
            <Route path="/product/:id" element={<ProductPage />} />
          </Routes>
        </ToastProvider>
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

describe('BUY-05 size guide and fit tags', () => {
  it('shows fit tags and an openable size guide on every product', async () => {
    renderProduct();
    expect(await screen.findByRole('heading', { level: 1, name: 'Slim fit linen shirt' })).toBeInTheDocument();
    expect(screen.getByText('Runs small')).toBeInTheDocument();
    expect(screen.getByText('Take one size up')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: en['product.sizeGuide'] }));
    expect(await screen.findByRole('dialog')).toHaveAccessibleName(en['product.sizeGuideTitle']);
    expect(screen.getByText(en['product.chest'])).toBeInTheDocument();
    expect(screen.getByRole('rowheader', { name: 'M' })).toBeInTheDocument();
  });
});

describe('BUY-06 per-item try-at-door terms', () => {
  it('shows the terms before the buyer can turn try-at-door on for that item', async () => {
    renderProduct();
    await screen.findByRole('heading', { level: 1, name: 'Slim fit linen shirt' });

    const toggle = screen.getByRole('switch', { name: en['product.tryAtDoor'] });
    expect(toggle).toHaveAttribute('aria-checked', 'false');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    expect(await screen.findByRole('dialog')).toHaveAccessibleName(en['product.tryTermsTitle']);
    expect(screen.getByText(en['trialTerms.copy'])).toBeInTheDocument();
    expect(screen.getByText(en['trialTerms.defaultOutcome'])).toBeInTheDocument();
    expect(screen.getByText(en['trialTerms.paymentTitle'])).toBeInTheDocument();
  });
});
