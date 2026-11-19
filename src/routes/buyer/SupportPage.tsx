import { useState, type FormEvent } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '@/api/client';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Icon } from '@/components/icons/Icon';
import { Input } from '@/components/ui/Input';
import { orderLabelKey } from '@/components/buyer/orderUi';
import { useAsync } from '@/lib/useAsync';
import styles from '@/components/buyer/pages.module.css';

interface Message {
  id: number;
  text: string;
  mine: boolean;
}

/** Support with chat, call and a human fallback, in the buyer's language. */
export default function SupportPage() {
  const { t, lang } = useI18n();
  const [params] = useSearchParams();
  const orderId = params.get('order') ?? '';
  const orderState = useAsync(() => api.getOrder(orderId), `support:${orderId}`);
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [queued, setQueued] = useState(false);

  const send = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;
    setMessages((current) => [...current, { id: current.length + 1, text: trimmed, mine: true }]);
    setText('');
  };

  return (
    <main className={styles.page}>
      <div className={styles.container}>
        <Breadcrumb items={[{ label: t('breadcrumb.home'), to: '/' }, { label: t('support.title') }]} />
        <h1 className={styles.heading}>{t('support.title')}</h1>
        <p className={styles.intro}>{t('support.intro')}</p>

        {orderId ? (
          <p className={styles.banner}>
            <Icon name="box" size={18} />
            {t('support.order')}: <Link to={`/orders/${orderId}`} className={styles.link}>{orderId}</Link>
            {orderState.data ? ` · ${t(orderLabelKey(orderState.data.state))}` : ''}
          </p>
        ) : (
          <p className={styles.banner}>{t('support.noOrder')}</p>
        )}

        <section className={`${styles.card} ${styles.sectionGrid}`} aria-label={t('support.chat')}>
          <div className={styles.chatLog} role="log" aria-live="polite">
            {messages.length ? (
              messages.map((message) => (
                <p key={message.id} className={`${styles.chatBubble} ${message.mine ? styles.chatMine : ''}`}>
                  {message.text}
                </p>
              ))
            ) : (
              <p className={styles.muted}>{t('support.intro')}</p>
            )}
          </div>
          <form className={styles.row} onSubmit={send}>
            <Input
              label={t('support.messageLabel')}
              value={text}
              onChange={(event) => setText(event.target.value)}
              className={styles.fieldFull}
            />
            <Button type="submit">{t('support.send')}</Button>
          </form>
          <p className={styles.small} lang={lang}>
            {messages.length ? (queued ? t('support.humanQueued') : t('support.sent')) : ''}
          </p>
        </section>

        <div className={styles.actions}>
          <a className={styles.outlinePill} href={`tel:${t('support.callNumber').replace(/\s/g, '')}`}>
            <Icon name="phone" size={16} /> {t('support.call')}
          </a>
          <Button variant="outline" onClick={() => setQueued(true)}>
            {t('support.human')}
          </Button>
        </div>
        <p className={styles.note}>{t('support.humanHelp')}</p>
      </div>
    </main>
  );
}
