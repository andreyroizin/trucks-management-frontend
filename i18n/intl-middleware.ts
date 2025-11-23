import createMiddleware from 'next-intl/middleware';
import {routing} from './routing';
import type {NextRequest} from 'next/server';

export const intlMiddleware = createMiddleware({
    ...routing,
    // Custom locale detection that reads from cookie
    localeDetection: true,
    // This function will be called to detect the locale
    defaultLocale: routing.defaultLocale,
    locales: routing.locales,
    // Next-intl automatically reads NEXT_LOCALE cookie when localeDetection is true
});
