import { NextRequest, NextResponse } from 'next/server';
import { jwtDecode } from 'jwt-decode';
import { handlePartridesRoutes } from '@/utils/middleware/partrides';
import {handleDisputesRoutes} from "@/utils/middleware/disputes";

/* helper – get roles from JWT cookie */
function getRoles(req: NextRequest): string[] | null {
    const jwt = req.cookies.get('auth')?.value;
    if (!jwt) return null;
    try {
        const decoded = jwtDecode(jwt) as any;
        const claim = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
        const raw = decoded[claim];
        return raw ? (Array.isArray(raw) ? raw : [raw]) : null;
    } catch {
        return null;
    }
}

/* main middleware */
export function middleware(req: NextRequest) {
    const roles = getRoles(req);

    // no token at all → login
    if (!roles) {
        return NextResponse.redirect(new URL('/auth/login', req.url));
    }

    /* delegate /partrides sub-router */
    const partrides = handlePartridesRoutes(req, roles);
    if (partrides) return partrides;

    const disputes  = handleDisputesRoutes(req, roles);
    if (disputes)  return disputes;

    // ── add other route groups here (e.g. expenses, reports) ──

    return NextResponse.next();            // default allow
}

/* run only on patterns we care about */
export const config = {
    matcher: [
        '/partrides/:path*',
        '/disputes/:path*',
        // '/expenses/:path*', … add more groups later
    ],
};