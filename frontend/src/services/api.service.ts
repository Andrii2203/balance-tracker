import { supabase } from '../supabaseClient';

export const StatisticsService = {
    async fetchStatistics(since?: string) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            return [] as any[];
        }
        let q = supabase.from('statistics').select('*');
        if (since) q = q.gt('updated_at', since);
        const { data, error } = await q.order('id', { ascending: true });
        if (error) throw error;
        return data;
    }
};

export const NewsService = {
    async fetchNews(since?: string) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            return [] as any[];
        }
        let q = supabase.from('news').select('*');
        if (since) q = q.gt('updated_at', since);
        const { data, error } = await q.order('created_at', { ascending: false });
        if (error) throw error;
        return data;
    },
    async insertNews(record: any) {
        const { data, error } = await supabase.from('news').insert([record]).select().single();
        if (error) throw error;
        return data;
    },
    async updateNews(id: number | string, record: any) {
        const { data, error } = await supabase.from('news').update(record).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },
    async deleteNews(id: number | string) {
        const { error } = await supabase.from('news').delete().eq('id', id);
        if (error) throw error;
    }
};

export const QuotesService = {
    async fetchQuotes(since?: string) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            return [] as any[];
        }
        let q = supabase.from('quotes').select('*');
        if (since) q = q.gt('updated_at', since);
        const { data, error } = await q.order('id', { ascending: true });
        if (error) throw error;
        return data;
    },
    async insertQuote(record: any) {
        const { data, error } = await supabase.from('quotes').insert([record]).select().single();
        if (error) throw error;
        return data;
    },
    async updateQuote(id: number | string, record: any) {
        const { data, error } = await supabase.from('quotes').update(record).eq('id', id).select().single();
        if (error) throw error;
        return data;
    },
    async deleteQuote(id: number | string) {
        const { error } = await supabase.from('quotes').delete().eq('id', id);
        if (error) throw error;
    }
};

export const AuthService = {
    async getCurrentUser() {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        return user;
    },

    async fetchProfile(uid: string) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
            return null;
        }
        const { data, error } = await supabase
            .from('profiles')
            .select('*, is_approved')
            .eq('id', uid)
            .maybeSingle();

        if (error) throw error;
        return data;
    },

    async fetchAllProfiles() {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .order('id', { ascending: true });

        if (error) throw error;
        return data;
    }
}
