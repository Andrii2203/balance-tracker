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




















// import React, { useEffect, useState } from 'react';
// // import './App.css'

// const App: React.FC = () => {
//   const baseText: string = `Lorem ipsum dolor sit amet consectetur adipisicing elit. 
//     Facilis nemo deserunt reiciendis dolor eaque tempora perferendis! 
//     In tempora, corrupti animi dolorum illo porro rem fugiat beatae quia eaque alias debitis.`;

//   const repeatedText: string = Array(50).fill(baseText).join(' ');

//   const [scrollY, setScrollY] = useState(0);

//   useEffect(() => {
//     const handleScroll = () => {
//       setScrollY(window.scrollY);
//     };
//     window.addEventListener('scroll', handleScroll);

//     // Cleanup
//     return () => {
//       window.removeEventListener('scroll', handleScroll);
//     };
//   }, []);

//   const magnifierHeight = 60; // Висота чорного блоку
//   const contentTopOffset = 0; // margin-top у контенті

//   let opacity = 0;
//   let transform = `translateY(${contentTopOffset}px) scale(1)`;

//   if (scrollY >= contentTopOffset) {
//     const visibleY = scrollY - contentTopOffset;
//     opacity = 1;
//     transform = `translateY(${-visibleY}px) scale(1)`;
//   }

//   return (
//     <div>
//       {/* Лупа */}
//       <div
//         className="magnifier-header "
//         style={{
//           position: 'fixed',
//           top: 0,
//           left: 0,
//           width: '100%',
//           height: `${magnifierHeight}px`,
//           overflow: 'hidden',
//           background: '#ffffff',
//           color: '#000000',
//           // borderBottom: '1px solid grey',
//           boxShadow: "0 6px 12px rgba(0, 0, 0, 0.15)",
//         }}
//       >
//         <div
//           className="magnified-content"
//           id="magnified"
//           style={{
//             position: 'relative',
//             marginTop: '70px',
//             transformOrigin: 'top left',
//             transform,
//             width: '100%',
//             opacity,
//             fontSize: '1rem',
//             lineHeight: '1',
//             textAlign: 'center',
//           }}
//         >
//           {repeatedText}
//         </div>
//       </div>

//       {/* Основний контент */}
//       <div
//         className="content"
//         id="mainText"
//         style={{
//           marginTop: '70px',
//           width: '80%',
//           marginLeft: 'auto',
//           marginRight: 'auto',
//           fontSize: '1rem',
//           lineHeight: '1',
//           textAlign: 'left',
//         }}
//       >
//         {repeatedText}
//       </div>
//     </div>
//   );
// };

// export default App;
