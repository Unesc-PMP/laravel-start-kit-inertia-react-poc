import type { Auth } from '@/types/auth';

declare module '@inertiajs/core' {
    export interface InertiaConfig {
        flashDataType: {
            toast?: {
                type: 'success' | 'error' | 'warning' | 'info';
                title: string;
                message?: string | null;
                description?: string | null;
                details?: Record<string, unknown>;
            };
        };
        sharedPageProps: {
            name: string;
            auth: Auth;
            sidebarOpen: boolean;
            impersonating: boolean;
            impersonator: import('@/types/auth').User | null;
            [key: string]: unknown;
        };
    }
}
