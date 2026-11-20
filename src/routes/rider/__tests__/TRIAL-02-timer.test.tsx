import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { I18nProvider } from '@/i18n';
import { en } from '@/i18n/en';
import { TrialTimer } from '@/components/rider/TrialTimer';
import { orderAt, setupFlow, teardownFlow } from '@/test/flowFixtures';
import { TRIAL_WINDOW_MS, trialRemainingMs } from '@/domain/trial';
import { now, type FakeClock } from '@/lib/clock';
import { formatRemaining } from '@/lib/format';

let clock: FakeClock;

beforeEach(async () => {
  clock = await setupFlow();
});

afterEach(() => {
  cleanup();
  teardownFlow();
});

describe('TRIAL-02 rider and buyer trial timers', () => {
  it('derive the same time from the stored deadline and one clock', async () => {
    const active = await orderAt('TRIAL_ACTIVE');
    const endsAt = active.trialEndsAt;
    expect(endsAt).toBeTruthy();
    expect(Date.parse(endsAt!) - now()).toBe(TRIAL_WINDOW_MS);

    clock.advance(60_000);
    const buyerRemaining = Date.parse(endsAt!) - now();
    const riderRemaining = trialRemainingMs(endsAt!, now());
    expect(riderRemaining).toBe(buyerRemaining);
    expect(riderRemaining).toBe(TRIAL_WINDOW_MS - 60_000);

    render(
      <I18nProvider>
        <TrialTimer endsAt={endsAt!} />
      </I18nProvider>,
    );
    const timer = screen.getByRole('timer');
    expect(timer).toHaveTextContent(formatRemaining(buyerRemaining));
    expect(timer).toHaveTextContent('14:00');
    expect(timer).toHaveAttribute('aria-label', en['rider.task.trialTimer']);
  });
});
