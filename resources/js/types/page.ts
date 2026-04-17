import type { Auth, User } from '@/types/auth';

export type SharedData = {
    name: string;
    auth: Auth;
    sidebarOpen: boolean;
    impersonating: boolean;
    impersonator: User | null;
    matricula_error?: string | null;
    matricula_success?: string | null;
};
