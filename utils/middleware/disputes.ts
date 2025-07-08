import { NextRequest, NextResponse } from 'next/server';
import {
    DRIVER_ROLE,
    CONTACT_PERSON_ROLES,
    ALL_ROLES,
} from '@/utils/constants/roles';

/**
 * Handles everything under /disputes/*
 * Return NextResponse if handled, otherwise null.
 */
export function handleDisputesRoutes(
    req: NextRequest,
    roles: string[] | null,
    locale: string,
    pathname: string
): NextResponse | null {
    if (!pathname.startsWith('/disputes')) return null;   // not our route group

    /* ── shared pages (/create, /edit) ───────────────────────────── */
    if (pathname === '/disputes/create' || pathname === '/disputes/edit') {
        if (roles?.some(r => ALL_ROLES.includes(r))) {
            return NextResponse.next();
        }
        return NextResponse.redirect(new URL('/403', req.url));
    }

    /* ── base list page (/disputes) ─────────────────────────────── */
    if (pathname === '/disputes') {
        const url = req.nextUrl.clone();
        if (roles?.includes(DRIVER_ROLE)) {
            url.pathname = `/${locale}/driver/disputes`;               // driver list page
        } else if (roles?.some(r => CONTACT_PERSON_ROLES.includes(r))) {
            url.pathname = `/${locale}/contact-person/disputes`;       // contact-person list page
        } else {
            return NextResponse.redirect(new URL('/403', req.url));
        }
        return NextResponse.rewrite(url);                  // internal rewrite
    }

    /* ── detail pages (/disputes/[id]) ──────────────────────────── */
    if (pathname.startsWith('/disputes/')) {
        const url = req.nextUrl.clone();
        if (roles?.includes(DRIVER_ROLE)) {
            url.pathname = `/${locale}/driver${pathname}`;             // /driver/disputes/[id]
        } else if (roles?.some(r => CONTACT_PERSON_ROLES.includes(r))) {
            url.pathname = `/${locale}/contact-person${pathname}`;     // /contact-person/disputes/[id]
        } else {
            return NextResponse.redirect(new URL('/403', req.url));
        }
        return NextResponse.rewrite(url);
    }

    return NextResponse.next();                          // fallback
}