import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { I18nProvider } from '@/i18n';
import { en } from '@/i18n/en';
import { ToastProvider } from '@/components/ui/Toast';
import { ListingForm } from '@/components/shop/ListingForm';
import { LISTING_HAPPY_PATH_STEPS, LISTING_STEP_LIMIT } from '@/domain/shop';
import { setupFlow, teardownFlow } from '@/test/flowFixtures';

beforeEach(async () => {
  await setupFlow();
});

afterEach(() => {
  cleanup();
  teardownFlow();
});

/** SHOP-01: the measured happy path stays within eight interactions. */
describe('SHOP-01 step count', () => {
  it('reaches a published listing in six recorded steps', async () => {
    const onStep = vi.fn();
    render(
      <MemoryRouter>
        <I18nProvider>
          <ToastProvider>
            <ListingForm onStep={onStep} onSaved={() => {}} />
          </ToastProvider>
        </I18nProvider>
      </MemoryRouter>,
    );

    const file = new File(['photo'], 'kurta.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText(en['shop.listing.capture']), {
      target: { files: [file] },
    });
    await waitFor(() => expect(screen.getByText(en['shop.listing.suggested'])).toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'M' }));
    fireEvent.change(screen.getByLabelText(en['shop.listing.price']), {
      target: { value: '1200' },
    });
    fireEvent.click(screen.getByRole('button', { name: en['shop.listing.save'] }));

    await waitFor(() => expect(onStep).toHaveBeenCalledWith('save_listing'));
    const steps = onStep.mock.calls.map(([step]) => step);
    expect(steps).toContain('capture_photo');
    expect(steps).toContain('review_suggestions');
    expect(steps).toContain('choose_colour_and_fabric');
    expect(steps).toContain('add_sizes_and_quantities');
    expect(steps).toContain('set_price');
    expect(steps).toEqual(LISTING_HAPPY_PATH_STEPS.filter((step) => steps.includes(step)));
    expect(new Set(steps).size).toBeLessThanOrEqual(LISTING_STEP_LIMIT);
  });
});
