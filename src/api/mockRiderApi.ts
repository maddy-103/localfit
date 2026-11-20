/** Rider-facing half of the mock Api. Wired into mockApi by mock.ts. */
import type { RiderApi } from './types';
import { respond } from './mockStore';
import {
  claimCompensation,
  closeTrip,
  collectPickup,
  confirmRiderDecisions,
  handOverReturnAtShop,
  markArrived,
  recordHandoverPhoto,
  riderEarningsView,
  riderTask,
  riderTasks,
  scanReturnedItems,
  waitingSession,
} from './mockRiderOps';
import {
  listQueuedRiderActions,
  matchRiderSelfie,
  markRiderActionSynced,
  queueRiderAction,
  readRiderConfig,
  readRiderPresence,
  readRiderRegistration,
  riderProfile,
  sendSos,
  setRiderRegistrationStatus,
  writeRiderPresence,
  writeRiderRegistration,
} from './mockRiderSetup';

export const mockRiderApi: RiderApi = {
  getRiderRegistration: () => respond(() => readRiderRegistration()),
  saveRiderRegistration: (input) => respond(() => writeRiderRegistration(input)),
  matchRiderSelfie: () => respond(() => matchRiderSelfie()),
  setRiderRegistrationStatus: (status, note) =>
    respond(() => setRiderRegistrationStatus(status, note)),
  getRiderPresence: () => respond(() => readRiderPresence()),
  setRiderOnline: (online) => respond(() => writeRiderPresence(online)),
  getRiderConfig: () => respond(() => readRiderConfig()),
  getRiderProfile: () => respond(() => riderProfile()),
  listRiderTasks: () => respond(() => riderTasks()),
  getRiderTask: (id) => respond(() => riderTask(id)),
  collectPickup: (orderId, input, actor) => respond(() => collectPickup(orderId, input, actor)),
  markArrived: (orderId, actor, gps) => respond(() => markArrived(orderId, actor, gps)),
  getWaitingSession: (orderId) => respond(() => waitingSession(orderId)),
  claimCompensation: (orderId, actor) => respond(() => claimCompensation(orderId, actor)),
  recordHandoverPhoto: (orderId, photoId, actor) =>
    respond(() => recordHandoverPhoto(orderId, photoId, actor)),
  confirmRiderDecisions: (orderId, actor, note) =>
    respond(() => confirmRiderDecisions(orderId, actor, note)),
  scanReturnedItems: (orderId, scanCodes, actor) =>
    respond(() => scanReturnedItems(orderId, scanCodes, actor)),
  closeTrip: (orderId, actor, photoId) => respond(() => closeTrip(orderId, actor, photoId)),
  handOverReturnAtShop: (orderId, actor) => respond(() => handOverReturnAtShop(orderId, actor)),
  getRiderEarnings: () => respond(() => riderEarningsView()),
  sendSos: (input, actor) => respond(() => sendSos(input, actor)),
  queueRiderAction: (action) => respond(() => queueRiderAction(action)),
  listQueuedRiderActions: () => respond(() => listQueuedRiderActions()),
  markRiderActionSynced: (id) => respond(() => markRiderActionSynced(id)),
};
