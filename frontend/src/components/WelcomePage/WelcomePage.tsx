import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './WelcomePage.css';
import { greetings } from '../../hooks/useGreetingCycle/greetings';
import { languageMap } from '../../hooks/useGreetingCycle/languageMap';
import i18n from '../../i18n';

interface Props {
  setUserLang: (lang: string | null) => void;
}

const DISPLAY_MS = 300;
const ANIM_MS = 300;
const TOTAL_MS = DISPLAY_MS + ANIM_MS;

const WelcomePage: React.FC<Props> = ({ setUserLang }) => {
  const [index, setIndex] = useState(0);
  const [finalGreeting, setFinalGreeting] = useState<string | null>(null);
  const [showFinal, setShowFinal] = useState(false);
  const navigate = useNavigate();

  const timerRef = useRef<number | null>(null);
  const runningRef = useRef(false);
  const mountedRef = useRef(false);

  // Ініціалізація
  useEffect(() => {
    mountedRef.current = true;

    let userLang = localStorage.getItem('userLang');
    if (!userLang) {
      userLang = (navigator.language || 'en').split('-')[0];
      localStorage.setItem('userLang', userLang);
    }
    i18n.changeLanguage(userLang);
    setUserLang(userLang);

    const userLanguageName = (languageMap as Record<string, string | undefined>)[userLang];
    if (userLanguageName) {
      const match = greetings.find(g => g.language === userLanguageName);
      if (match) setFinalGreeting(match.greeting);
    }

    return () => {
      mountedRef.current = false;
      if (timerRef.current !== null) clearTimeout(timerRef.current);
    };
  }, []);

  // Цикл привітань
  useEffect(() => {
    if (showFinal || runningRef.current) return;

    runningRef.current = true;

    const scheduleNext = () => {
      timerRef.current = window.setTimeout(() => {
        if (!mountedRef.current) return;

        setIndex(prev => {
          const next = prev + 1;
          if (next >= greetings.length) {
            runningRef.current = false;
            setShowFinal(true);
            return prev;
          }
          return next;
        });

        if (runningRef.current) scheduleNext();
      }, TOTAL_MS);
    };

    scheduleNext();

    return () => {
      runningRef.current = false;
      if (timerRef.current !== null) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [showFinal]);

  const safeIndex = Math.min(index, Math.max(0, greetings.length - 1));
  const currentText =
    showFinal && finalGreeting ? finalGreeting : greetings[safeIndex]?.greeting ?? '...';

  // Обробники кнопок
  const handleConfirm = () => {
    navigate('/home', { state: {showLanguageSwitcher: false},  replace: true });
  };
  const handleChangeLang = () => {
    navigate('/home', { state: {showLanguageSwitcher: true}, replace: true });
  };

  return (
    <div className="welcome-container">
      <AnimatePresence mode="wait">
        {showFinal ? (
          <motion.div
            key="final"
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: ANIM_MS / 1000, ease: 'easeOut' }}
            className="welcome-final"
          >
            <h1 className="greeting-text">{finalGreeting}</h1>
            <div className="welcome-buttons">
              <motion.button
                className="btn btn-change"
                onClick={handleChangeLang}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                🌐
              </motion.button>
              
              <motion.button
                className="btn btn-confirm"
                onClick={handleConfirm}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                →
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.h1
            key={currentText}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: ANIM_MS / 1000, ease: 'easeOut' }}
            className="greeting-text"
          >
            {currentText}
          </motion.h1>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WelcomePage;