import {defineRouting} from 'next-intl/routing';
import {SUPPORTED_LOCALES} from "@/utils/constants/supportedLocales";

export const routing = defineRouting({
    // A list of all locales that are supported
    locales: SUPPORTED_LOCALES,

    // Used when no locale matches
    defaultLocale: 'en'
});
