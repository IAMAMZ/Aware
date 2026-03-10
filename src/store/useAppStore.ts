import { create } from 'zustand';
import type { User } from '../types';
import { supabase } from '../lib/supabase';

interface AppState {
    user: User | null;
    isLoading: boolean;
    setUser: (user: User | null) => void;
    initializeUser: () => Promise<void>;
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
    signOut: async () => {
        await supabase.auth.signOut();
        set({ user: null });
    }
}));
