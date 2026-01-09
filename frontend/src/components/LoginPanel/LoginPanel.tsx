import React, { useState } from "react";
import { useUser } from "../../contexts/UserContext";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import './LoginPanel.css';
import { logger } from '../../utils/logger';

interface LoginPanelProps {
    showLanguageSwitcher?: boolean;
}

const LoginPanel: React.FC<LoginPanelProps> = ({ showLanguageSwitcher = false }) => {
    const { t } = useTranslation();
    const { sendOtp, verifyOtp } = useUser();

    // Auth State
    const [step, setStep] = useState<1 | 2>(1); // 1 = Email, 2 = Code
    const [email, setEmail] = useState("");
    const [otpCode, setOtpCode] = useState("");
    const [loading, setLoading] = useState(false);

    // Step 1: Send Code
    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await sendOtp(email);
            if (error) throw error;
            toast.success(t("codeSent"));
            setStep(2);
        } catch (err: any) {
            toast.error(err.message || t("failedToSendCode"));
        } finally {
            setLoading(false);
        }
    }

    // Step 2: Verify Code
    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const { error } = await verifyOtp(email, otpCode);
            if (error) throw error;
            toast.success(t("welcomeBack"));
            // Session update happens automatically in UserContext via onAuthStateChange
        } catch (err: any) {
            toast.error(err.message || t("invalidCode"));
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-panel-container">
            <h1 className="shared-h1">{step === 1 ? t("hi") : t("enterCode")}</h1>

            {step === 1 ? (
                <form className="login-form" onSubmit={handleSendCode}>
                    <input
                        className="shared-input"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder={t("emailPlaceholder")}
                        type="email"
                        required
                        autoFocus
                    />
                    <button type="submit" className="shared-button" disabled={loading}>
                        {loading ? t("sending") : <>{t("getCode")} <ArrowRight size={16} /></>}
                    </button>
                    {/* Add a subtle note about admin access if needed, or keep clean */}
                </form>
            ) : (
                <form className="login-form" onSubmit={handleVerifyCode}>
                    <input
                        className="shared-input"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder={t("otpPlaceholder")}
                        type="text"
                        required
                        autoFocus
                        maxLength={6}
                        pattern="\d*"
                    />
                    <button type="submit" className="shared-button" disabled={loading}>
                        {loading ? t("verifying") : <>{t("login")} <ArrowRight size={16} /></>}
                    </button>
                    <div className="email-hint">{t("sentTo", { email })}</div>
                    <button
                        type="button"
                        className="toggle-auth-mode"
                        onClick={() => setStep(1)}
                    >
                        {t("changeEmail")}
                    </button>
                </form>
            )}

            {showLanguageSwitcher && (
                <div className="login-lang-switcher">
                    <LanguageSwitcher />
                </div>
            )}

                    {process.env.REACT_APP_FORCE_APPROVE === 'true' && (
                        <div style={{ marginTop: 12 }}>
                            <button
                                type="button"
                                className="shared-button"
                                onClick={() => {
                                try {
                                    localStorage.setItem('bt:dev_user', 'true');
                                    localStorage.setItem('user_name', 'Dev User');
                                    logger.info('Dev skip login clicked, flag set bt:dev_user=true');
                                } catch (err) {
                                    logger.warn('Dev skip login failed to set localStorage', err);
                                }
                                window.location.href = '/';
                            }}
                            >
                                {t('devSkipLogin') || 'Dev: Skip login'}
                            </button>
                        </div>
                    )}
        </div>
    );
};

export default LoginPanel;