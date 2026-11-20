import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { api } from '@/api/client';
import { I18nProvider } from '@/i18n';
import { en } from '@/i18n/en';
import { setupFlow, teardownFlow } from '@/test/flowFixtures';
import RegisterRiderPage from '../RegisterRiderPage';
import RegisterRiderStatusPage from '../RegisterRiderStatusPage';

function renderRegistration() {
  return render(
    <MemoryRouter initialEntries={['/register/rider']}>
      <I18nProvider>
        <Routes>
          <Route path="/register/rider" element={<RegisterRiderPage />} />
          <Route path="/register/rider/status" element={<RegisterRiderStatusPage />} />
        </Routes>
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

describe('AUTH-05 rider registration', () => {
  it('places an unapproved rider in the approval status flow', async () => {
    renderRegistration();

    expect(screen.getByLabelText(/Full name/)).toBeInTheDocument();
    expect(screen.getByLabelText(/Vehicle type/)).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText(/Full name/), {
      target: { value: 'Arjun Kumar' },
    });
    fireEvent.change(screen.getByLabelText(/Phone number/), {
      target: { value: '9876543210' },
    });
    fireEvent.change(screen.getByLabelText(/Registration number/), {
      target: { value: 'KA01AB1234' },
    });

    // Submitting before the mock face match is refused.
    fireEvent.click(screen.getByRole('button', { name: en['regRider.submit'] }));
    expect(await screen.findByText(en['regRider.matchRequired'])).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: en['regRider.openCamera'] }));
    fireEvent.click(screen.getByRole('button', { name: en['regRider.matchSelfie'] }));
    expect(await screen.findByText(/Selfie matched/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: en['regRider.submit'] }));

    expect(await screen.findByText(en['regRider.statusTitle'])).toBeInTheDocument();
    expect(screen.getByText(en['regRider.status.submitted'])).toBeInTheDocument();
    expect(screen.getByText(en['regRider.inactive'])).toBeInTheDocument();

    const saved = await api.getRiderRegistration();
    expect(saved).toMatchObject({
      fullName: 'Arjun Kumar',
      vehicleType: 'scooter',
      vehicleNumber: 'KA01AB1234',
      selfieMatched: true,
      status: 'submitted',
    });
    expect(saved?.documents.selfie).toMatchObject({ name: 'selfie-mock.jpg' });
  });
});
