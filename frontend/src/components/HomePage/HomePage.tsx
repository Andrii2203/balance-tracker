import React, { useEffect, useState } from "react";
import { useUser } from "../../contexts/UserContext";
import LoginPanel from "../LoginPanel/LoginPanel";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from 'framer-motion';
import { useLocation } from "react-router-dom";
import './HomePage.css'

interface Props {
  setHideUI: (val:boolean)=>void;
}

const HomePage: React.FC<Props> = ({setHideUI}) => {
  const { t } = useTranslation();
  const { username } = useUser();
  const location = useLocation();
  const showLanguageSwitcher = location.state?.showLanguageSwitcher || false;

  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(()=>{
    setHideUI(settingsOpen);
  },[settingsOpen]);

  const toggleSettings = () => {
    setSettingsOpen(prev=>!prev);
  }

  return (
    <div className={`home-container ${settingsOpen ? 'hidden-mode': ''}`}>
      <div className="settings-toggle" onClick={toggleSettings}>
        {settingsOpen ? '❌' : '⚙️'}
      </div>

      <AnimatePresence mode="wait">
        {settingsOpen ? (
          
          <motion.div
            key="settings"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}
          >
            <LoginPanel showLanguageSwitcher={true} />
          </motion.div>
        ) : (
          
          <motion.div
            key={username ? 'home-logged' : 'home-login'}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}
          >
            {username ? (
              <motion.h1
                className="shared-h1"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
              >
                {t('hello', { name: username })}
              </motion.h1>
            ) : (
              <LoginPanel showLanguageSwitcher={showLanguageSwitcher} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}

export default HomePage;