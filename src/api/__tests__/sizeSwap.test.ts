import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { api } from '@/api/client';
import { orderAt, setupFlow, teardownFlow } from '@/test/flowFixtures';

const BUYER = { id: 'buyer-ananya', role: 'buyer' as const };

beforeEach(async () => {
  await setupFlow();
});

afterEach(() => {
  teardownFlow();
});

describe('size swap during the trial', () => {
  it('records a pending request without changing a decision, then confirms it at lock', async () => {
    const active = await orderAt('TRIAL_ACTIVE');
    const line = active.lines[0]!;

    const requested = await api.setTrialDecision(active.id, line.id, 'keep', BUYER);
    const swapped = await api.requestSizeSwap(
      active.id,
      { lineId: line.id, variantId: 'var-kurta-l' },
      BUYER,
    );

    expect(swapped.swapRequests).toHaveLength(1);
    expect(swapped.swapRequests[0]).toMatchObject({
      lineId: line.id,
      fromVariantId: line.variantId,
      toVariantId: 'var-kurta-l',
      status: 'requested',
    });
    expect(swapped.lines.find((entry) => entry.id === line.id)?.decision).toBe('keep');
    expect(swapped.lines.find((entry) => entry.id === line.id)?.variantId).toBe(line.variantId);
    expect(swapped.events.some((event) => event.action === 'swap_requested')).toBe(true);
    expect(requested.state).toBe('TRIAL_ACTIVE');

    const locked = await api.lockTrial(active.id, BUYER, 'buyer');
    expect(locked.swapRequests[0]?.status).toBe('confirmed');
    expect(locked.events.some((event) => event.action === 'swap_confirmed')).toBe(true);
  });

  it('rejects a swap into a size with no stock', async () => {
    const active = await orderAt('TRIAL_ACTIVE');
    const line = active.lines[0]!;

    await expect(
      api.requestSizeSwap(active.id, { lineId: line.id, variantId: 'var-kurta-xl' }, BUYER),
    ).rejects.toThrow(/stock/);

    await expect(
      api.requestSizeSwap(active.id, { lineId: line.id, variantId: line.variantId }, BUYER),
    ).rejects.toThrow(/already/);
  });
});
