'use client';

import React, {createContext, useContext, useState} from 'react';
import {usePathname, useRouter} from 'next/navigation';
import Cookies from 'js-cookie';

type Lang = 'en' | 'nl' | 'bg';

interface LangCtx {
    lang: Lang;
    setLang: (l: Lang) => void;
}

const LanguageContext = createContext<LangCtx | undefined>(undefined);

export function LanguageProvider({children}: {children: React.ReactNode}) {
    /* 1️⃣  initial value from cookie (or fallback 'en') */
    const cookieLocale = Cookies.get('NEXT_LOCALE') as Lang | undefined;
    const [lang, setLangState] = useState<Lang>(cookieLocale ?? 'en');

    const router   = useRouter();
    const pathname = usePathname();                  // e.g. "/en/dashboard"

    /* 2️⃣  Change language = cookie + URL swap */
    const setLang = (l: Lang) => {
        if (l === lang) return;

        // persist for next-intl / SSR
        Cookies.set('NEXT_LOCALE', l, {path: '/'});
        setLangState(l);

        /* ------ build same path with new locale ------ */
        const parts = pathname.split('/');             // ['', 'en', 'dashboard', ...]
        if (parts.length > 1 && ['en', 'nl', 'bg'].includes(parts[1])) {
            parts[1] = l;                                // replace segment
        } else {
            parts.splice(1, 0, l);                       // no locale in URL, prepend
        }
        const newPath = parts.join('/') || '/';
        router.replace(newPath);                       // soft navigation
    };

    return (
        <LanguageContext.Provider value={{lang, setLang}}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used within <LanguageProvider>');
    return ctx;
};
