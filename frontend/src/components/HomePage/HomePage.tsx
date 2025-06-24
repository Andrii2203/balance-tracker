import React from "react";
import { useUser } from "../../contexts/UserContext";
import LoginPanel from "../LoginPanel/LoginPanel";
import { useTranslation } from "react-i18next";

const HomePage = () => {
  const { t } = useTranslation();
  const { username } = useUser();

  return (
    <div>
      {username ? (
        <>
          <h1>{t('hello', { name: username })}</h1>
        </>
      ) : (
        <LoginPanel />
      )}
    </div>
  )
}

export default HomePage;