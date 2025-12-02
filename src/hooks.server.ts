// src/hooks.server.ts
import { adminAuth } from '$lib/server/firebase';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
    const sessionCookie = event.cookies.get('session');

    event.locals.user = null;

    if (sessionCookie) {
        try {
            // Verify cookie
            const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
            event.locals.user = {
                id: decodedClaims.uid,
                email: decodedClaims.email || '',
                picture: decodedClaims.picture || '',
            };
        } catch (e) {
            // Cookie hết hạn hoặc fake -> clear luôn
            event.locals.user = null;
        }
    }

    return resolve(event);
};
