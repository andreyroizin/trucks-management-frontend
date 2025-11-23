import type {Metadata} from 'next';
import React from 'react';
import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';

import '../styles/fonts';
import '../styles/globals.css';

import Providers from '@/app/[locale]/providers';
import ThemeRegistry from '@/app/[locale]/ThemeRegistry';
import SideNavigation from '@/components/SideNavigation';
import MobileNavigationDriver from '@/components/MobileNavigationDriver';

export const metadata: Metadata = {
    title: 'Vervoer-Manager',
    description: 'Vervoer-Manager - Professional Transport Management System'
};

export default async function LocaleLayout({children, params}: {
    children: React.ReactNode;
    params: Promise<{locale: string}>;
}) {
    // ---- get the messages for the current locale ----
    // const messages = useMessages();

    const {locale} = await params;
    if (!hasLocale(routing.locales, locale)) {
        notFound();
    }

    const messages = (await import(`@/messages/${locale}.json`)).default;

    return (
        <html lang={locale}>
        <body>
        {/* Intl provider first so every subtree can call useTranslations() */}
        <NextIntlClientProvider locale={locale} messages={messages}>
            <ThemeRegistry>
                <Providers>
                    <MobileNavigationDriver/>
                    <div style={{display: 'flex', height: '100vh'}}>
                        <SideNavigation/>
                        <main className="p-4" style={{flexGrow: 1, overflowY: 'auto'}}>
                            {children}
                        </main>
                    </div>
                </Providers>
            </ThemeRegistry>
        </NextIntlClientProvider>
        </body>
        </html>
    );
}