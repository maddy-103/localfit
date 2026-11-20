import type { Order } from '@/api/types';
import type { RiderTask } from '@/domain/rider';

/** Props shared by every single-task step view. */
export interface TaskViewProps {
  task: RiderTask;
  order: Order;
  /** Replaces the locally displayed order after an API action. */
  onOrder: (order: Order) => void;
  /** Reloads the task detail and list after a state change. */
  onChange: () => void;
}
