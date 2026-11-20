/** Rider registration, presence, config, safety and offline queue (mock). */
import { nowIso } from '@/lib/clock';
import { defaultRiderRegistration, getState, notify, setState, uid } from './mockStore';
import { riders } from './seed';
import type {
  QueuedRiderAction,
  RiderApprovalStatus,
  RiderConfig,
  RiderPresence,
  RiderProfileView,
  RiderRegistration,
  SaveRiderRegistrationInput,
  SelfieMatchResult,
  SosAlert,
} from './types';

function copyRegistration(value: RiderRegistration): RiderRegistration {
  return {
    ...value,
    documents: {
      idProof: value.documents.idProof ? { ...value.documents.idProof } : null,
      licence: value.documents.licence ? { ...value.documents.licence } : null,
      selfie: value.documents.selfie ? { ...value.documents.selfie } : null,
    },
  };
}

export function readRiderRegistration(): RiderRegistration | null {
  const registration = getState().riderRegistration;
  return registration ? copyRegistration(registration) : null;
}

export function writeRiderRegistration(input: SaveRiderRegistrationInput): RiderRegistration {
  const state = getState();
  const previous = state.riderRegistration;
  const alreadySubmitted = previous?.submittedAt;
  const next: RiderRegistration = {
    ...copyRegistration(previous ?? defaultRiderRegistration()),
    ...input,
    documents: {
      idProof: input.documents.idProof ? { ...input.documents.idProof } : null,
      licence: input.documents.licence ? { ...input.documents.licence } : null,
      selfie: input.documents.selfie ? { ...input.documents.selfie } : null,
    },
    riderId: previous?.riderId ?? riders[0]?.id ?? 'rider-arjun',
    status: input.status ?? 'submitted',
    submittedAt: alreadySubmitted ?? nowIso(),
    updatedAt: nowIso(),
  };
  setState({ ...state, riderRegistration: next });
  notify('rider-profile', copyRegistration(next));
  return copyRegistration(next);
}

/** Mock camera step: a fixed result with a score the UI can display. */
export function matchRiderSelfie(): SelfieMatchResult {
  return { matched: true, score: 0.98 };
}

export function setRiderRegistrationStatus(
  status: RiderApprovalStatus,
  note?: string,
): RiderRegistration {
  const state = getState();
  const next = {
    ...copyRegistration(state.riderRegistration),
    status,
    ...(note ? { note } : {}),
    updatedAt: nowIso(),
  };
  setState({ ...state, riderRegistration: next });
  notify('rider-profile', copyRegistration(next));
  return copyRegistration(next);
}

export function readRiderPresence(): RiderPresence {
  return { ...getState().riderPresence };
}

export function writeRiderPresence(online: boolean): RiderPresence {
  const state = getState();
  const next = { online, updatedAt: nowIso() };
  setState({ ...state, riderPresence: next });
  notify('rider-presence', { ...next });
  return { ...next };
}

export function readRiderConfig(): RiderConfig {
  return { ...getState().riderConfig };
}

export function riderProfile(): RiderProfileView {
  const state = getState();
  const registration = copyRegistration(state.riderRegistration);
  const rider =
    riders.find((entry) => entry.id === registration.riderId) ??
    riders[0] ?? {
      id: registration.riderId,
      name: registration.fullName,
      phone: registration.phone,
      vehicle: registration.vehicleNumber,
      status: 'pending' as const,
      rating: 0,
      trips: 0,
      zone: registration.city,
      joinedAt: registration.updatedAt,
    };
  return { rider: { ...rider }, registration, language: 'en' };
}

/** RIDE-07: an alert always carries the rider's last known coordinates. */
export function sendSos(
  input: { orderId?: string; gps?: SosAlert['gps']; note?: string },
  actor: { id: string },
): SosAlert {
  const state = getState();
  const alert: SosAlert = {
    id: uid('sos'),
    riderId: actor.id,
    ...(input.orderId ? { orderId: input.orderId } : {}),
    ...(input.gps ? { gps: { ...input.gps } } : {}),
    ...(input.note ? { note: input.note } : {}),
    createdAt: nowIso(),
    status: 'sent',
  };
  setState({ ...state, sosAlerts: [alert, ...state.sosAlerts] });
  notify('rider-alerts', alert);
  return alert;
}

function copyQueue(): QueuedRiderAction[] {
  return getState().riderQueue.map((action) => ({ ...action, payload: { ...action.payload } }));
}

export function queueRiderAction(
  action: Omit<QueuedRiderAction, 'id' | 'createdAt' | 'status'>,
): QueuedRiderAction[] {
  const state = getState();
  const next = [
    ...state.riderQueue,
    { ...action, id: uid('queued'), createdAt: nowIso(), status: 'pending' as const },
  ];
  setState({ ...state, riderQueue: next });
  notify('rider-queue', next);
  return copyQueue();
}

export function listQueuedRiderActions(): QueuedRiderAction[] {
  return copyQueue();
}

export function markRiderActionSynced(id: string): QueuedRiderAction[] {
  const state = getState();
  const next = state.riderQueue.map((action) =>
    action.id === id ? { ...action, status: 'synced' as const } : action,
  );
  setState({ ...state, riderQueue: next });
  notify('rider-queue', next);
  return copyQueue();
}
