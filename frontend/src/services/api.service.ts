import { supabase } from '../supabaseClient';
import { Row } from '../hooks/useFetchData/useFetchData';

export const StatisticsService = {
    async fetchStatistics() {
        const { data, error } = await supabase
            .from('statistics')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;
        return data as Row[];
    }
};

export const AuthService = {
    async getCurrentUser() {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    },

    async fetchProfile(uid: string) {
        const { data, error } = await supabase
            .from('profiles')
            .select('is_approved')
            .eq('id', uid)
            .maybeSingle();

        if (error) throw error;
        return data;
    }
}
