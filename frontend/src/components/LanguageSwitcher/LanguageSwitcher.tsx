import React from 'react';
import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher: React.FC = () => {
    const { i18n } = useTranslation();

    return (
    <div className="btn-box">
        <button onClick={() => i18n.changeLanguage('uk')}>UA</button>
        <button onClick={() => i18n.changeLanguage('pl')}>PL</button>
        <button onClick={() => i18n.changeLanguage('en')}>EN</button>
      </div>
    )
}
export default LanguageSwitcher;