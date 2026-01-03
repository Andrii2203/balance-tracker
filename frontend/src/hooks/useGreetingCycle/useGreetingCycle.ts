import { useState, useEffect, useRef } from 'react';
import { greetings } from './greetings';
import { languageMap } from './languageMap';
import i18n from '../../i18n';
import { CONFIG } from '../../config/config';

export function useGreetingCycle(setUserLang: (lang: string | null) => void) {
    const [index, setIndex] = useState(0);
    const [showFinal, setShowFinal] = useState(false);
    const [finalGreeting, setFinalGreeting] = useState<string | null>(null);

    const timerRef = useRef<number | null>(null);
    const mountedRef = useRef(false);

    const TOTAL_MS = CONFIG.ANIMATION.DISPLAY_MS + CONFIG.ANIMATION.ANIM_MS;

    useEffect(() => {
        mountedRef.current = true;

        // Language initialization
        let userLang = localStorage.getItem('userLang');
        if (!userLang) {
            userLang = (navigator.language || 'en').split('-')[0];
            localStorage.setItem('userLang', userLang);
        }
        i18n.changeLanguage(userLang);
        setUserLang(userLang);

        const userLanguageName = (languageMap as Record<string, string | undefined>)[userLang];
        if (userLanguageName) {
            const match = greetings.find((g) => g.language === userLanguageName);
            if (match) setFinalGreeting(match.greeting);
        }

        // Animation cycle
        const scheduleNext = () => {
            timerRef.current = window.setTimeout(() => {
                if (!mountedRef.current) return;

                setIndex((prev) => {
                    const next = prev + 1;
                    if (next >= greetings.length) {
                        setShowFinal(true);
                        return prev;
                    }
                    return next;
                });

                if (!showFinal) scheduleNext();
            }, TOTAL_MS);
        };

        scheduleNext();

        return () => {
            mountedRef.current = false;
            if (timerRef.current !== null) clearTimeout(timerRef.current);
        };
    }, [showFinal, setUserLang, TOTAL_MS]);

    const currentGreeting = showFinal && finalGreeting ? finalGreeting : greetings[index]?.greeting ?? '...';

    return { currentGreeting, showFinal, finalGreeting };
}
