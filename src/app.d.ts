// src/app.d.ts
declare global {
	namespace App {
		interface Locals {
			user: {
				id: string;
				email: string;
				picture?: string;
			} | null;
		}
	}

	namespace svelteHTML {
        interface HTMLAttributes<T> {
            'on:click_outside'?: (event: CustomEvent<any>) => void;
        }
    }
}
export {};
