import type { Order } from '@/api/types';
import type { OrderEvent } from '@/domain/orderMachine';
import type { TranslationKey } from '@/i18n';
import { useI18n } from '@/i18n';
import { formatDateTime, formatPaise } from '@/lib/format';
import flow from './flow.module.css';

function labelFor(t: ReturnType<typeof useI18n>['t'], key: string): string {
  return t(key as TranslationKey);
}

function eventLabel(t: ReturnType<typeof useI18n>['t'], event: OrderEvent): string {
  if (event.action) return labelFor(t, `timeline.${event.action}`);
  return labelFor(t, `timeline.${event.to}`);
}

/** Read-only, timestamped event trail shared by tracking and return screens. */
export function OrderTimeline({ order }: { order: Order }) {
  const { t } = useI18n();
  const events = [...order.events].reverse();

  return (
    <section aria-labelledby="order-timeline-title">
      <h2 className={flow.cardTitle} id="order-timeline-title">
        {t('timeline.title')}
      </h2>
      <ol className={flow.timeline} aria-label={t('track.timeline')}>
        {events.map((event) => (
          <li className={flow.timelineRow} key={event.id}>
            <span className={flow.timelineDot} aria-hidden="true" />
            <span>
              <strong>{eventLabel(t, event)}</strong>
              {event.note ? <span className={flow.timelineNote}> · {event.note}</span> : null}
              <span className={flow.timelineNote}>
                {' · '}
                {labelFor(t, `timeline.actor${event.actor.role.charAt(0).toUpperCase()}${event.actor.role.slice(1)}`)}
              </span>
            </span>
            <time className={flow.timelineNote} dateTime={event.timestamp}>
              {formatDateTime(event.timestamp)}
              {event.amountPaise !== undefined
                ? ` · ${formatPaise(event.amountPaise)}`
                : ''}
            </time>
          </li>
        ))}
      </ol>
    </section>
  );
}
