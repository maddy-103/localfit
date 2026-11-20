import { useNavigate } from 'react-router-dom';
import { useI18n } from '@/i18n';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';

export default function NotFoundPage() {
  const { t } = useI18n();
  const navigate = useNavigate();

  return (
    <main>
      <h1 className="u-visually-hidden">{t('common.notFound')}</h1>
      <EmptyState
        icon="search"
        title={t('common.notFound')}
        body={t('common.notFoundBody')}
        action={
          <Button onClick={() => navigate('/')} leftIcon="arrow-right">
            {t('common.goHome')}
          </Button>
        }
      />
    </main>
  );
}
