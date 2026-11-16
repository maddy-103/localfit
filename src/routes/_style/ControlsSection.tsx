import { useState } from 'react';
import { useI18n } from '@/i18n';
import {
  Button,
  Checkbox,
  Chip,
  IconButton,
  Input,
  RadioPills,
  Select,
  Textarea,
  Toggle,
} from '@/components/ui';
import { StyleSection } from './StyleSection';
import styles from './style.module.css';

const SIZE_OPTIONS = [
  { value: 's', label: 'S' },
  { value: 'm', label: 'M' },
  { value: 'l', label: 'L' },
  { value: 'xl', label: 'XL', disabled: true },
];

export function ControlsSection() {
  const { t } = useI18n();
  const [toggled, setToggled] = useState(true);
  const [checked, setChecked] = useState(true);
  const [size, setSize] = useState('m');
  const [chip, setChip] = useState(true);

  return (
    <>
      <StyleSection title={t('style.buttons')}>
        <div className={styles.row}>
          <Button>{t('button.solid')}</Button>
          <Button variant="outline">{t('button.outline')}</Button>
          <Button variant="ghost">{t('button.ghost')}</Button>
          <Button destructive>{t('style.sampleConfirmTitle')}</Button>
          <Button loading>{t('button.loading')}</Button>
          <Button disabled>{t('button.disabled')}</Button>
          <Button size="lg" rightIcon="arrow-right">
            {t('common.next')}
          </Button>
          <Button size="sm" leftIcon="plus">
            {t('nav.bag')}
          </Button>
          <Button fullWidth>{t('common.apply')}</Button>
        </div>
      </StyleSection>

      <StyleSection title={t('style.iconButtons')}>
        <div className={styles.row}>
          <IconButton icon="cart" label={t('nav.bag')} />
          <IconButton icon="search" label={t('nav.search')} variant="outline" />
          <IconButton icon="close" label={t('common.close')} />
          <IconButton icon="settings" label={t('nav.settings')} variant="outline" />
          <IconButton icon="trash" label={t('common.clear')} disabled />
        </div>
      </StyleSection>

      <StyleSection title={t('style.inputs')}>
        <div className={styles.columns}>
          <div className={styles.stack}>
            <Input
              label={t('style.sampleLabel')}
              placeholder={t('style.samplePlaceholder')}
              hint={t('style.sampleHint')}
              icon="phone"
              inputMode="tel"
            />
            <Input
              label={t('style.sampleLabel')}
              placeholder={t('style.samplePlaceholder')}
              error={t('style.sampleError')}
              defaultValue="98765"
              required
            />
            <Input label={t('style.sampleLabel')} placeholder={t('style.samplePlaceholder')} disabled />
          </div>
          <div className={styles.stack}>
            <Textarea
              label={t('style.sampleTextarea')}
              placeholder={t('style.sampleTextarea')}
              hint={t('common.optional')}
            />
            <Textarea
              label={t('style.sampleTextarea')}
              error={t('style.sampleError')}
              defaultValue="Ring the bell twice."
            />
            <Select
              label={t('style.sampleSelect')}
              placeholder={t('style.sampleSelect')}
              options={[
                { value: 'bengaluru', label: 'Bengaluru' },
                { value: 'mysuru', label: 'Mysuru' },
                { value: 'hubballi', label: 'Hubballi', disabled: true },
              ]}
            />
            <Select
              label={t('style.sampleSelect')}
              options={[{ value: 'bengaluru', label: 'Bengaluru' }]}
              error={t('style.sampleError')}
            />
          </div>
        </div>
      </StyleSection>

      <StyleSection title={t('style.selection')}>
        <div className={styles.columns}>
          <div className={styles.stack}>
            <Toggle
              label={t('style.sampleToggle')}
              description={t('style.sampleToggleHint')}
              checked={toggled}
              onChange={setToggled}
            />
            <Toggle
              label={t('style.sampleToggle')}
              checked={false}
              onChange={() => undefined}
            />
            <Toggle
              label={t('style.sampleToggle')}
              checked
              onChange={() => undefined}
              disabled
            />
            <Checkbox
              label={t('style.sampleCheckbox')}
              checked={checked}
              onChange={(event) => setChecked(event.target.checked)}
            />
            <Checkbox label={t('style.sampleCheckbox')} onChange={() => undefined} />
          </div>
          <div className={styles.stack}>
            <RadioPills
              legend={t('style.sampleLegend')}
              name="style-size"
              options={SIZE_OPTIONS}
              value={size}
              onChange={setSize}
            />
            <div className={styles.row}>
              <Chip selected={chip} onClick={() => setChip((value) => !value)}>
                {t('nav.search')}
              </Chip>
              <Chip selected={!chip} onClick={() => setChip((value) => !value)}>
                {t('nav.orders')}
              </Chip>
              <Chip>{t('common.all')}</Chip>
            </div>
          </div>
        </div>
      </StyleSection>
    </>
  );
}
