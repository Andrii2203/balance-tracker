import React, { useState } from "react";
import { useUser } from "../../contexts/UserContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import './LoginPanel.css';

interface LoginPanelProps {
    showLanguageSwitcher?: boolean;
}

const LoginPanel: React.FC<LoginPanelProps> = ({ showLanguageSwitcher = false }) => {
    const { t } = useTranslation();
    const { login, username } = useUser();

    const [name, setName] = useState<string>(() => username || localStorage.getItem('username') || '');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        login(name);
        if(!localStorage.getItem('username')) {
            localStorage.setItem("username", name);
        }
    }

    return (
        <form className="login-panel" onSubmit={handleLogin}>
            <h1 className="shared-h1">{t("hi")}</h1>
            <input 
                className="shared-input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t('name_placeholder')}
                type="text"
                autoFocus
                required
                maxLength={30}
            />
            <button type="submit" className="shared-button">→</button>
            {showLanguageSwitcher && (
                <LanguageSwitcher />
            )}
        </form>

    );
};

export default LoginPanel;