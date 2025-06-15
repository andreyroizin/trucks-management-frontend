import { NextResponse, type NextRequest } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import {
    CONTACT_PERSON_ROLES,
    DRIVER_ROLE,
    SHARED_ROLES
} from "@/utils/constants/roles";

// --- helper to read roles from auth cookie ---
function getRoles(req: NextRequest): string[] | null {
    const jwt = req.cookies.get('auth')?.value;
    if (!jwt) return null;
    try {
        const decoded = jwtDecode(jwt) as any;
        const roleClaim = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';

        if (decoded[roleClaim]) {
            const raw = decoded[roleClaim];
            return Array.isArray(raw) ? raw : [raw]; // handle both string and array cases
        }

        return null;
    } catch {
        return null;
    }
}

// --- main middleware handler ---
export function middleware(req: NextRequest) {
    const roles = getRoles(req);

    // 1 ▸ No token at all → redirect to login
    if (!roles) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    const path = req.nextUrl.pathname;

    // 2 ▸ Shared pages: /partrides/create and /partrides/edit
    const isCreate = path === '/partrides/create';
    const isEdit = path === '/partrides/edit';

    if (isCreate || isEdit) {
        if (roles.some(role => SHARED_ROLES.includes(role))) {
            return NextResponse.next(); // Access granted
        }
        return NextResponse.redirect(new URL('/403', req.url)); // Forbidden
    }

    // 3 ▸ Detail pages: rewrite /partrides/[id] → /driver/... or /contact-person/...
    if (path.startsWith('/partrides/')) {
        const url = req.nextUrl.clone();

        if (roles.includes(DRIVER_ROLE)) {
            url.pathname = `/driver${path}`;
        } else if (roles.some(role => CONTACT_PERSON_ROLES.includes(role))) {
            url.pathname = `/contact-person${path}`;
        } else {
            return NextResponse.redirect(new URL('/403', req.url));
        }

        return NextResponse.rewrite(url); // Internal rewrite only
    }

    return NextResponse.next(); // All other routes untouched
}

// 4 ▸ Only run middleware on these route patterns
export const config = {
    matcher: [
        '/partrides/:path*',  // includes create/edit/detail
    ],
};