import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import './WelcomePage.css';
import { Globe, ArrowRight } from 'lucide-react';
import { useGreetingCycle } from '../../hooks/useGreetingCycle/useGreetingCycle';
import { CONFIG } from '../../config/config';

interface Props {
  setUserLang: (lang: string | null) => void;
}

const WelcomePage: React.FC<Props> = ({ setUserLang }) => {
  const navigate = useNavigate();
  const { currentGreeting, showFinal, finalGreeting } = useGreetingCycle(setUserLang);

  const handleConfirm = () => {
    navigate('/home', { state: { showLanguageSwitcher: false }, replace: true });
  };
  const handleChangeLang = () => {
    navigate('/home', { state: { showLanguageSwitcher: true }, replace: true });
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
            transition={{ duration: CONFIG.ANIMATION.ANIM_MS / 1000, ease: 'easeOut' }}
            className="welcome-final"
          >
            <h1 className="greeting-text">{finalGreeting}</h1>
            <div className="welcome-buttons">
              <motion.button
                className="btn btn-change"
                onClick={handleChangeLang}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                title="Change Language"
              >
                <Globe size={24} />
              </motion.button>

              <motion.button
                className="btn btn-confirm"
                onClick={handleConfirm}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <ArrowRight size={24} />
              </motion.button>
            </div>
          </motion.div>
        ) : (
          <motion.h1
            key={currentGreeting}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -30, scale: 0.95 }}
            transition={{ duration: CONFIG.ANIMATION.ANIM_MS / 1000, ease: 'easeOut' }}
            className="greeting-text"
          >
            {currentGreeting}
          </motion.h1>
        )}
      </AnimatePresence>
    </div>
  );
};

export default WelcomePage;