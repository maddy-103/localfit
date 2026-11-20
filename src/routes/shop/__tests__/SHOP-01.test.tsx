import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { I18nProvider } from '@/i18n';
import { en } from '@/i18n/en';
import { ToastProvider } from '@/components/ui/Toast';
import { setupFlow, teardownFlow } from '@/test/flowFixtures';
import ListingNewPage from '../ListingNewPage';

let online = true;
const setOnline = (value: boolean) => {
  online = value;
  Object.defineProperty(navigator, 'onLine', { configurable: true, get: () => online });
};

beforeEach(async () => {
  await setupFlow();
  setOnline(true);
});

afterEach(() => {
  cleanup();
  setOnline(true);
  teardownFlow();
});

describe('SHOP-01/SHOP-02 offline Snap & List', () => {
  it('queues a saved listing offline and publishes it when the network returns', async () => {
    setOnline(false);
    render(
      <MemoryRouter initialEntries={['/shop/listing/new']}>
        <I18nProvider>
          <ToastProvider>
            <ListingNewPage />
          </ToastProvider>
        </I18nProvider>
      </MemoryRouter>,
    );

    fireEvent.change(await screen.findByLabelText(/Item name/), {
      target: { value: 'Cotton kurta' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'M' }));
    fireEvent.change(screen.getByLabelText(en['shop.listing.price']), {
      target: { value: '1200' },
    });
    fireEvent.click(screen.getByRole('button', { name: en['shop.listing.save'] }));

    expect(
      (await screen.findAllByText(en['shop.listing.queued'], {}, { timeout: 3000 })).length,
    ).toBeGreaterThan(0);

    setOnline(true);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });

    expect(
      (await screen.findAllByText(en['shop.listing.published'], {}, { timeout: 3000 })).length,
    ).toBeGreaterThan(0);
  });
});
