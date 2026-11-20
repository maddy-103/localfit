import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { api } from '@/api/client';
import { I18nProvider } from '@/i18n';
import { setupFlow, teardownFlow } from '@/test/flowFixtures';
import { useAppStore } from '@/store/appStore';
import BagPage from '../BagPage';

function renderBag() {
  return render(
    <MemoryRouter initialEntries={['/bag']}>
      <I18nProvider>
        <BagPage />
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
  await api.addToBag({ productId: 'prod-kurta-set', variantId: 'var-kurta-m', qty: 1, tryAtDoor: false });
  await api.addToBag({ productId: 'prod-georgette-saree', variantId: 'var-saree-free', qty: 1, tryAtDoor: false });
});

afterEach(() => {
  cleanup();
  useAppStore.setState({ session: null });
  teardownFlow();
});

describe('BUY-07 bag grouped by shop', () => {
  it('shows one group per shop with separate-delivery copy and its own ETA', async () => {
    renderBag();

    expect(await screen.findByRole('heading', { level: 2, name: 'Kiran Silks' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 2, name: 'Meera Textiles' })).toBeInTheDocument();
    expect(screen.getAllByText(/Separate delivery from other shops/)).toHaveLength(2);
    expect(screen.getAllByText(/Arrives in/)).toHaveLength(2);
    expect(screen.getByText('Handblock cotton kurta set')).toBeInTheDocument();
    expect(screen.getByText('Georgette saree with blouse piece')).toBeInTheDocument();
  });
});
