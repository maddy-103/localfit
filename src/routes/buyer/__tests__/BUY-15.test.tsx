import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { I18nProvider } from '@/i18n';
import { en } from '@/i18n/en';
import { setMockFailures } from '@/api/mock';
import { setupFlow, teardownFlow } from '@/test/flowFixtures';
import { clearHomeCache, loadHomeCache } from '@/lib/homeCache';
import HomePage from '../HomePage';

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/']}>
      <I18nProvider>
        <HomePage />
      </I18nProvider>
    </MemoryRouter>,
  );
}

beforeEach(async () => {
  await setupFlow();
  setMockFailures(false);
  await clearHomeCache();
});

afterEach(async () => {
  cleanup();
  setMockFailures(false);
  await clearHomeCache();
  teardownFlow();
});

describe('BUY-15 cached stock state', () => {
  it('saves the last known home snapshot after a successful load', async () => {
    renderHome();
    expect((await screen.findAllByText('Handblock cotton kurta set')).length).toBeGreaterThan(0);

    await waitFor(async () => {
      const cached = await loadHomeCache();
      expect(cached?.products.length ?? 0).toBeGreaterThan(0);
      expect(cached?.shops.length ?? 0).toBeGreaterThan(0);
    });
  });

  it('shows the cached products and an offline banner when the API fails', async () => {
    const first = renderHome();
    await screen.findAllByText('Handblock cotton kurta set');
    await waitFor(async () => {
      expect((await loadHomeCache())?.products.length ?? 0).toBeGreaterThan(0);
    });
    first.unmount();

    setMockFailures(true);
    renderHome();

    expect((await screen.findAllByText('Handblock cotton kurta set')).length).toBeGreaterThan(0);
    expect(await screen.findByText(en['offline.banner'])).toBeInTheDocument();
  });
});
