export {}
// import { useEffect, useState } from 'react';
// import { greetings } from './greetings';
// import { languageMap } from './languageMap';

// export function useGreetingCycle(intervalMs = 1500) {
//   const [index, setIndex] = useState(0);
//   const [finalGreeting, setFinalGreeting] = useState<string | null>(null);
//   const [done, setDone] = useState(false);

//   useEffect(() => {
//     if (done) return;

//     const interval = setInterval(() => {
//       setIndex((prev) => {
//         const next = (prev + 1) % greetings.length;

//         if (next === 0) {
//           let userLang = localStorage.getItem('userLang');

//           if (!userLang) {
//             userLang = navigator.language.split('-')[0];
//             localStorage.setItem('userLang', userLang);
//           }

//           console.log('useGreetingCycle userLang:', userLang);

//           const userLanguageName = languageMap[userLang];
//           const match = greetings.find(g => g.language === userLanguageName);

//           if (match) setFinalGreeting(match.greeting);

//           setDone(true);
//           clearInterval(interval);
//         }

//         return next;
//       });
//     }, intervalMs);

//     return () => clearInterval(interval);
//   }, [done, intervalMs]);

//   const currentText = finalGreeting || greetings[index].greeting;
//   return currentText;
// }
