import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { StatusChip } from '../StatusChip';

afterEach(() => {
  cleanup();
});

describe('NFR-06 status is never colour alone', () => {
  it('renders an icon, the label and the tone class', () => {
    const { container } = render(<StatusChip tone="success" label="Approved" />);
    const chip = container.firstElementChild as HTMLElement;

    expect(chip).toHaveTextContent('Approved');
    expect(chip.querySelector('svg')).toBeTruthy();
    expect(chip.className).toContain('statusSuccess');
  });

  it('keeps the icon when an explicit one is supplied', () => {
    const { container } = render(<StatusChip tone="error" icon="sos" label="Alert sent" />);
    const chip = container.firstElementChild as HTMLElement;

    expect(chip).toHaveTextContent('Alert sent');
    expect(chip.querySelector('svg')).toBeTruthy();
    expect(chip.className).toContain('statusError');
  });
});
