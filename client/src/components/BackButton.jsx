import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const className = 'inline-flex items-center gap-2 text-sm text-ivory/50 hover:text-gold transition-colors mb-8';

function BackButton({ to, onClick, label }) {
  const { t } = useTranslation();
  const defaultLabel = label || t('commun.retourAccueil');
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className}>
        <ArrowLeft size={16} />
        {defaultLabel}
      </button>
    );
  }

  return (
    <Link to={to} className={className}>
      <ArrowLeft size={16} />
      {defaultLabel}
    </Link>
  );
}

export default BackButton;
