import { useState } from 'react';
import { useI18n } from '@/i18n';
import {
  Button,
  Card,
  ConfirmDialog,
  Dialog,
  Sheet,
  Stepper,
  Tabs,
} from '@/components/ui';
import { StyleSection } from './StyleSection';
import styles from './style.module.css';

export function SurfacesSection() {
  const { t } = useI18n();
  const [tab, setTab] = useState('details');
  const [sheet, setSheet] = useState(false);
  const [dialog, setDialog] = useState(false);
  const [confirm, setConfirm] = useState(false);

  const steps = [
    { id: 'placed', label: t('style.stepPlaced'), state: 'done' as const, time: '6:10 pm' },
    { id: 'packed', label: t('style.stepPacked'), state: 'done' as const, time: '6:18 pm' },
    { id: 'transit', label: t('style.stepTransit'), state: 'current' as const, time: '6:24 pm' },
    { id: 'arrived', label: t('style.stepArrived'), state: 'upcoming' as const },
  ];

  return (
    <>
      <StyleSection title={t('style.surfaces')}>
        <div className={styles.columns}>
          <Card padded>
            <p>{t('style.sampleToggleHint')}</p>
          </Card>
          <Card>
            <div style={{ padding: 'var(--space-4)' }}>
              <p>{t('style.emptyBody')}</p>
            </div>
          </Card>
        </div>
      </StyleSection>

      <StyleSection title={t('style.tabs')}>
        <div className={styles.stack}>
          <Tabs
            label={t('style.tabs')}
            active={tab}
            onChange={setTab}
            items={[
              { id: 'details', label: t('style.sampleCheckbox') },
              { id: 'reviews', label: t('style.rating') },
              { id: 'faqs', label: t('route.support') },
            ]}
          />
          <p className={styles.caption}>{tab}</p>
        </div>
      </StyleSection>

      <StyleSection title={t('style.stepper')}>
        <div className={styles.stack}>
          <Stepper steps={steps} label={t('style.stepper')} />
          <div style={{ maxWidth: 320 }}>
            <Stepper steps={steps} vertical label={t('style.stepper')} />
          </div>
        </div>
      </StyleSection>

      <StyleSection title={t('style.sheet')}>
        <div className={styles.row}>
          <Button variant="outline" onClick={() => setSheet(true)}>
            {t('style.openSheet')}
          </Button>
          <Button variant="outline" onClick={() => setDialog(true)}>
            {t('style.openDialog')}
          </Button>
          <Button variant="outline" onClick={() => setConfirm(true)}>
            {t('style.openConfirm')}
          </Button>
        </div>

        <Sheet
          open={sheet}
          onClose={() => setSheet(false)}
          title={t('style.sampleSheetTitle')}
          footer={
            <>
              <Button variant="ghost" onClick={() => setSheet(false)}>
                {t('common.clear')}
              </Button>
              <Button onClick={() => setSheet(false)}>{t('common.apply')}</Button>
            </>
          }
        >
          <p>{t('style.sampleToggleHint')}</p>
        </Sheet>

        <Dialog
          open={dialog}
          onClose={() => setDialog(false)}
          title={t('style.sampleDialogTitle')}
          footer={
            <>
              <Button variant="outline" onClick={() => setDialog(false)}>
                {t('common.back')}
              </Button>
              <Button onClick={() => setDialog(false)}>{t('common.confirm')}</Button>
            </>
          }
        >
          <p>{t('style.sampleConfirmBody')}</p>
        </Dialog>

        <ConfirmDialog
          open={confirm}
          onClose={() => setConfirm(false)}
          onConfirm={() => setConfirm(false)}
          title={t('style.sampleConfirmTitle')}
          message={t('style.sampleConfirmBody')}
          confirmLabel={t('common.clear')}
          destructive
        />
      </StyleSection>
    </>
  );
}
