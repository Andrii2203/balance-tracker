import React, { useState } from "react";
import { BrowserRouter as Router, useLocation } from "react-router-dom";
import { UserProvider, useUser } from "./contexts/UserContext";
import AppRoutes from "./AppRoutes";
import BottomNav from "./components/BottomNav/BottomNav";
import { navItems } from "./data/navItems";
import './App.css'

const AppContent = () => {
  const { username } = useUser();
  const [hideUI, setHideUI] = useState<boolean>(false);

  return (
    <>
      <AppRoutes setHideUI={setHideUI} />
      {username && !hideUI && (
        <BottomNav items={navItems} />
      )}
    </>
  )
}

function App() {

  return (
    <UserProvider>
      <Router>
        <AppContent />
      </Router>
    </UserProvider>
  );
}

export default App;













// import React from 'react';
// import './App.css'

// const App: React.FC = () => {
//   return (
//     <div>
//       <div className="glassContainer">
//         <svg style={{ display: 'none' }}>
//           <filter id="container-glass" x="0%" y="0%" width="100%" height="100%">
//             <feTurbulence type="fractalNoise" baseFrequency="0.008 0.008" numOctaves="2" seed="92" result="noise" />
//             <feGaussianBlur in="noise" stdDeviation="0.02" result="blur" />
//             <feDisplacementMap in="SourceGraphic" in2="blur" scale="77" xChannelSelector="R" yChannelSelector="G" />
//           </filter>
//           <filter id="btn-glass" primitiveUnits="objectBoundingBox">
//             <feGaussianBlur in="SourceGraphic" stdDeviation="0.02" result="blur"></feGaussianBlur>
//             <feDisplacementMap id="disp" in="blur" in2="map" scale="1" xChannelSelector="R" yChannelSelector="G" />
//           </filter>
//         </svg>
//       </div>
//       Lorem ipsum, dolor sit amet consectetur adipisicing elit. Eligendi esse repudiandae fuga optio ea eum velit aut, repellendus aperiam numquam ad, cum, deleniti itaque commodi nisi fugit in earum? Aspernatur.
//     </div>
//   );
// };

// export default App;