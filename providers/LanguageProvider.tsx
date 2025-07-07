'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type Lang = 'en' | 'nl' | 'bg';

interface LangCtx {
    lang: Lang;
    setLang: (l: Lang) => void;
}

const LanguageContext = createContext<LangCtx | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: React.ReactNode }) => {
    const [lang, setLang] = useState<Lang>('en');

    // on first load, read from localStorage
    useEffect(() => {
        const stored = localStorage.getItem('vm-lang') as Lang | null;
        if (stored) setLang(stored);
    }, []);

    const changeLang = (l: Lang) => {
        setLang(l);
        localStorage.setItem('vm-lang', l);
        // here you would also call i18n.changeLanguage(l) if you use i18next
    };

    return (
        <LanguageContext.Provider value={{ lang, setLang: changeLang }}>
            {children}
        </LanguageContext.Provider>
    );
};

export const useLanguage = () => {
    const ctx = useContext(LanguageContext);
    if (!ctx) throw new Error('useLanguage must be used within <LanguageProvider>');
    return ctx;
};
