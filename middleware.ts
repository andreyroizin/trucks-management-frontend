import {NextRequest, NextResponse} from 'next/server';
import {handlePartridesRoutes} from '@/utils/middleware/partrides';
import {handleDisputesRoutes} from '@/utils/middleware/disputes';
import {jwtDecode} from 'jwt-decode';
import {intlMiddleware} from "@/i18n/intl-middleware";
import {SUPPORTED_LOCALES} from "@/utils/constants/supportedLocales";

/* -------- helper -------- */
function getRoles(req: NextRequest): string[] | null {
    const jwt = req.cookies.get('auth')?.value;
    if (!jwt) return null;
    try {
        const roleClaim = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
        const raw = (jwtDecode(jwt) as any)[roleClaim];
        return raw ? (Array.isArray(raw) ? raw : [raw]) : null;
    } catch {
        return null;
    }
}

/* -------- middleware -------- */
export function middleware(req: NextRequest) {
    /* 1️⃣  next-intl */
    const res: NextResponse = intlMiddleware(req);

    // If intl issued a redirect (Location header) → return immediately
    if (res.headers.has('location')) return res;

    /* 2️⃣  Your auth / role logic continues */
    const {pathname} = req.nextUrl;            // e.g. "/en/partrides/123"
    const [, locale, ...segments] = pathname.split('/');
    const path = '/' + segments.join('/');       // "/partrides/123"

    if (!SUPPORTED_LOCALES.includes(locale as any)) {
        const newUrl = new URL(`/${SUPPORTED_LOCALES[0]}${pathname}`, origin); // default 'en'
        return NextResponse.redirect(newUrl);
    }

    const roles = getRoles(req);

    if (!roles && !path.startsWith('/auth/login')) return NextResponse.redirect(new URL(`/${locale}/auth/login`, req.url));

    /* 3️⃣  Delegate to route-group helpers              */
    let routed: NextResponse | null = null;

    if (path.startsWith('/partrides')) routed = handlePartridesRoutes(req, roles, locale, path);

    if (path.startsWith('/disputes')) routed = handleDisputesRoutes(req, roles, locale, path);

    /* 4️⃣  Return whichever response we got first
           – routed one, otherwise the intl response         */
    return routed ?? res;
}

/* -------- matcher (same as next-intl example) -------- */
export const config = {
    matcher: '/((?!api|trpc|_next|_vercel|.*\\..*).*)'
};