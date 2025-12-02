import { writable } from 'svelte/store';

// Interface cho User
export interface User {
    id: string;
    username: string;
    credits: number;
    avatarUrl?: string;
}

// Store quản lý User (Auth)
// Mặc định là null (chưa login)
export const userStore = writable<User | null>(null);

// Hàm giả lập Login
export const login = () => {
    userStore.set({
        id: 'u1',
        username: 'you',
        credits: 98,
    });
};

// Hàm giả lập Logout
export const logout = () => {
    userStore.set(null);
};

// Store quản lý Search
export const searchStore = writable({
    keyword: 'Time tracking app for personal use',
    country: 'us'
});
