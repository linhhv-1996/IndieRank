// src/routes/api/session/+server.ts
import { json } from '@sveltejs/kit';
import { adminAuth } from '$lib/server/firebase';
import type { RequestHandler } from './$types';

// Login: Nhận idToken -> Trả về Session Cookie
export const POST: RequestHandler = async ({ request, cookies }) => {
    const { idToken } = await request.json();
    const expiresIn = 60 * 60 * 24 * 5 * 1000; // 5 ngày

    try {
        // Tạo Session Cookie từ Firebase Admin
        const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn });
        
        // Set Cookie httpOnly an toàn
        cookies.set('session', sessionCookie, {
            maxAge: expiresIn / 1000,
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            sameSite: 'lax',
        });

        return json({ status: 'success' });
    } catch (error) {
        return json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
    }
};

// Logout: Xóa Cookie
export const DELETE: RequestHandler = async ({ cookies }) => {
    cookies.delete('session', { path: '/' });
    return json({ status: 'success' });
};
