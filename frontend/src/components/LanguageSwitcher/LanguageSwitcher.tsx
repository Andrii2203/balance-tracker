import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  return (
    <div className="btn-box">
      <button className={i18n.language === 'uk' ? 'active' : ''} onClick={() => i18n.changeLanguage('uk')}>UA</button>
      <button className={i18n.language === 'pl' ? 'active' : ''} onClick={() => i18n.changeLanguage('pl')}>PL</button>
      <button className={i18n.language === 'en' ? 'active' : ''} onClick={() => i18n.changeLanguage('en')}>EN</button>
    </div>
  )
}
export default LanguageSwitcher;