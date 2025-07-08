import { NextRequest, NextResponse } from 'next/server';
import {
    DRIVER_ROLE,
    CONTACT_PERSON_ROLES,
    ALL_ROLES,
} from '@/utils/constants/roles';

/**
 * Handles all `/partrides/*` routing & auth rules.
 * Returns a NextResponse when it decides, otherwise `null`
 * so the caller can keep processing other route groups.
 */
export function handlePartridesRoutes(
    req: NextRequest,
    roles: string[] | null,
    locale: string,
    pathname: string
): NextResponse | null {

    // only care about /partrides
    if (!pathname.startsWith('/partrides')) return null;

    /* ────────────────── shared pages ────────────────── */
    const isCreate = pathname === '/partrides/create';
    const isEdit   = pathname === '/partrides/edit';

    if (isCreate || isEdit) {
        if (roles?.some(r => ALL_ROLES.includes(r))) {
            return NextResponse.next();
        }
        return NextResponse.redirect(new URL('/403', req.url));
    }

    /* ────────────────── detail pages ─────────────────── */
    if (pathname.startsWith('/partrides/')) {
        const url = req.nextUrl.clone();

        if (roles?.includes(DRIVER_ROLE)) {
            url.pathname = `/${locale}/driver${pathname}`;
        } else if (roles?.some(r => CONTACT_PERSON_ROLES.includes(r))) {
            url.pathname = `/${locale}/contact-person${pathname}`;
        } else {
            return NextResponse.redirect(new URL('/403', req.url));
        }
        return NextResponse.rewrite(url);
    }

    return NextResponse.next();            // fallback
}