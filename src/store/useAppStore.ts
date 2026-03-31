import { create } from 'zustand';
import type { User } from '../types';
import { supabase } from '../lib/supabase';

interface AppState {
    user: User | null;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    initializeUser: () => Promise<void>;
    updateUser: (updates: Partial<Pick<User, 'medication_tracking' | 'timezone'>>) => Promise<void>;
    signOut: () => Promise<void>;
}

export const useAppStore = create<AppState>((set) => ({
    user: null,
    isLoading: true,
    setUser: (user) => set({ user }),
    initializeUser: async () => {
        try {
            set({ isLoading: true });
            const { data: { session } } = await supabase.auth.getSession();

            if (session?.user) {
                // Fetch custom user data from users table
                const { data: userData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (userData) {
                    set({ user: userData as User });
                } else {
                    // Fallback just auth user if record doesn't exist yet
                    set({
                        user: {
                            id: session.user.id,
                            email: session.user.email || '',
                            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                            medication_tracking: false
                        }
                    });
                }
            } else {
                set({ user: null });
            }
        } catch (error) {
            console.error('Error initializing user:', error);
            set({ user: null });
        } finally {
            set({ isLoading: false });
        }
    },
    updateUser: async (updates) => {
        const user = (useAppStore.getState()).user;
        if (!user) return;
        const { data, error } = await supabase
            .from('users')
            .update(updates)
            .eq('id', user.id)
            .select()
            .single();
        if (!error && data) set({ user: data as User });
    },
    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null });
    }
}));
