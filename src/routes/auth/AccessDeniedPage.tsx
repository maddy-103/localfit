import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function AccessDeniedPage() {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <EmptyState
      icon="shield"
      title={t('common.forbidden')}
      body={t('common.forbiddenBody')}
      action={
        <Button onClick={() => navigate('/')} leftIcon="arrow-right">
          {t('common.goHome')}
        </Button>
      }
    />
  );
}
