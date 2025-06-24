import React from "react";
import { useUser } from "../../contexts/UserContext";
import LoginPanel from "../LoginPanel/LoginPanel";

const HomePage = () => {
  const { username } = useUser();

  return (
    <div>
      {username ? (
        <>
          <h1>Hello {username}!</h1>
        </>
      ) : (
        <LoginPanel />
      )}
    </div>
  )
}

export default HomePage;