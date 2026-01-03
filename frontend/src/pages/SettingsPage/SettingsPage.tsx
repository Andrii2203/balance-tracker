import React, { useState, useEffect } from 'react';
import { useUser } from '../../contexts/UserContext';
import { supabase } from '../../supabaseClient';
import { ArrowLeft, Check, Palette, User, Globe, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../../components/LanguageSwitcher/LanguageSwitcher';
import { toast } from 'sonner';
import './SettingsPage.css';

const THEME_COLORS = [
    '#6c5ce7', // Purple (Default)
    '#00cec9', // Teal
    '#ff7675', // Coral
    '#fdcb6e', // Mustard
    '#2d3436', // Dark
    '#e17055', // Burnt Orange
    '#0984e3', // Blue
];

const SettingsPage: React.FC = () => {
    const { user, refreshUser } = useUser();
    const navigate = useNavigate();
    const { t } = useTranslation();

    // States
    const [name, setName] = useState(user?.user_metadata?.full_name || '');
    const [loading, setLoading] = useState(false);
    const [themeColor, setThemeColor] = useState(localStorage.getItem('theme-color') || '#6c5ce7');

    useEffect(() => {
        // Initialize name if available
        if (user?.user_metadata?.full_name) {
            setName(user.user_metadata.full_name);
        }
    }, [user]);

    const handleUpdateProfile = async () => {
        setLoading(true);
        const { error } = await supabase.auth.updateUser({
            data: { full_name: name }
        });

        if (error) {
            toast.error("Failed to update profile");
        } else {
            toast.success("Profile updated!");
            // Update localStorage immediately
            localStorage.setItem('user_name', name);

            // Refresh user context to update HomePage immediately
            if (refreshUser) await refreshUser();
        }
        setLoading(false);
    };

    const handleColorChange = (color: string) => {
        setThemeColor(color);
        document.documentElement.style.setProperty('--primary-color', color);
        localStorage.setItem('theme-color', color);

        // Use a lighter variant for secondary/glass effects if needed
        // For now, simpler is better.
        toast.success("Theme updated!");
    };

    return (
        <div className="page-container settings-page">
            <header className="unified-header">
                <button onClick={() => navigate(-1)} className="back-btn">
                    <ArrowLeft size={24} />
                </button>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 600, margin: 0 }}>{t('settings')}</h2>
            </header>

            <main className="page-content settings-content">

                {/* Profile Section */}
                <section className="settings-section glass-card">
                    <h3>
                        <User size={20} />
                        {t('profile')}
                    </h3>
                    <div className="input-group">
                        <label>{t('displayName')}</label>
                        <div className="input-wrapper">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder={t('enterName')}
                                className="settings-input"
                            />
                            <button onClick={handleUpdateProfile} disabled={loading} className="save-btn" title={t('save')}>
                                <Check size={18} />
                            </button>
                        </div>
                    </div>
                </section>

                {/* Appearance Section */}
                <section className="settings-section glass-card">
                    <h3>
                        <Palette size={20} />
                        {t('appearance')}
                    </h3>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                        {t('themeColor')}
                    </p>
                    <div className="color-picker-grid">
                        {THEME_COLORS.map(color => (
                            <button
                                key={color}
                                className={`color-swatch ${themeColor === color ? 'active' : ''}`}
                                style={{ backgroundColor: color }}
                                onClick={() => handleColorChange(color)}
                            >
                                {themeColor === color && <Check size={14} color="white" />}
                            </button>
                        ))}
                    </div>
                </section>

                {/* Language Section */}
                <section className="settings-section glass-card">
                    <h3>
                        <Globe size={20} />
                        {t('language')}
                    </h3>
                    <div className="language-wrapper">
                        <LanguageSwitcher />
                    </div>
                </section>

            </main>
        </div>
    );
};

export default SettingsPage;
