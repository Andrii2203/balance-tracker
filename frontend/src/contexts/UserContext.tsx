import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";
import { AuthService } from "../services/api.service";
import { CONFIG } from "../config/config";
import { db } from "../services/db";
import { logger } from '../utils/logger';

interface UserContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  sendOtp: (email: string) => Promise<{ error: any }>;
  verifyOtp: (email: string, token: string) => Promise<{ data: any; error: any }>;
  signOut: () => Promise<void>;
  role: "admin" | "user" | null;
  isApproved: boolean;
  refreshUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [role, setRole] = useState<"admin" | "user" | null>(null);
  const [isApproved, setIsApproved] = useState(false);
  const FORCE_APPROVE = process.env.REACT_APP_FORCE_APPROVE === 'true' || (typeof window !== 'undefined' && localStorage.getItem('bt:dev_user') === 'true');
  const DISABLE_EMAILS = process.env.REACT_APP_DISABLE_EMAILS === 'true' || (typeof window !== 'undefined' && localStorage.getItem('bt:disable_emails') === 'true');

  const fetchProfile = async (uid: string, email: string) => {
    try {
      const profile = await AuthService.fetchProfile(uid);
      const isAdminByEmail = email === CONFIG.AUTH.ADMIN_EMAIL;

      if (!profile) {
        // Use direct insert and select to ensure it's created
        const { data: newProfile, error: insertError } = await supabase
          .from('profiles')
          .upsert([{ id: uid, email: email || 'unknown', is_approved: isAdminByEmail }], { onConflict: 'id' })
          .select('is_approved')
          .single();

        if (insertError) {
          logger.error('❌ [UserContext] upsert profile error', insertError);
        } else {
          const approved = newProfile?.is_approved ?? false;
          setIsApproved(approved || FORCE_APPROVE);
          setRole(isAdminByEmail ? "admin" : "user");
          try { localStorage.setItem('bt:isApproved', String(approved || FORCE_APPROVE)); localStorage.setItem('bt:role', isAdminByEmail ? 'admin' : 'user'); } catch(e) {}
        }
      } else {
        const approved = profile.is_approved || isAdminByEmail;
        setIsApproved(approved || FORCE_APPROVE);
        setRole(isAdminByEmail ? "admin" : "user");
        try { localStorage.setItem('bt:isApproved', String(approved || FORCE_APPROVE)); localStorage.setItem('bt:role', isAdminByEmail ? 'admin' : 'user'); } catch(e) {}
      }
    } catch (error) {
      logger.error('❌ [UserContext] fetchProfile error', error);
      // On failure to reach server, restore cached approval/role if available
      try {
        const storedApproved = localStorage.getItem('bt:isApproved');
        const storedRole = localStorage.getItem('bt:role');
        if (storedApproved !== null) setIsApproved(storedApproved === 'true');
        if (storedRole === 'admin' || storedRole === 'user') setRole(storedRole as any);
        // If nothing cached but FORCE_APPROVE is enabled, apply it
        if (!storedApproved && FORCE_APPROVE) {
          setIsApproved(true);
          if (!storedRole) setRole('admin');
          try { localStorage.setItem('bt:isApproved', 'true'); localStorage.setItem('bt:role', 'admin'); } catch(e) {}
        }
      } catch (e) {
        logger.warn('[UserContext] fetchProfile fallback restore failed', e);
      }
    }
  };

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        // If system offline, skip network calls and restore cached values
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          logger.info('[UserContext] system offline at init — restoring cached state');
          try {
            const storedApproved = localStorage.getItem('bt:isApproved');
            const storedRole = localStorage.getItem('bt:role');
            const userName = localStorage.getItem('user_name');
            if (storedApproved !== null) setIsApproved(storedApproved === 'true');
            if (storedRole === 'admin' || storedRole === 'user') setRole(storedRole as any);
            // Respect FORCE_APPROVE in offline init so dev env bypass still works after reload
            if (!storedApproved && FORCE_APPROVE) {
              setIsApproved(true);
              if (!storedRole) setRole('admin');
              try { localStorage.setItem('bt:isApproved', 'true'); localStorage.setItem('bt:role', 'admin'); } catch(e) {}
            }
            if (userName) try { localStorage.setItem('user_name', userName); } catch (e) {}
          } catch (e) { logger.warn('[UserContext] failed to restore cached state', e); }
          // Ensure loader is cleared so app renders cached UI while offline
          if (mounted) setLoading(false);
          // retry init when back online
          const onOnline = () => {
            window.removeEventListener('online', onOnline);
            init();
          };
          window.addEventListener('online', onOnline);
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        logger.debug('[UserContext] supabase.getSession result', { session });
        if (!mounted) return;

        setSession(session);
        setUser(session?.user ?? null);

        // If offline or session missing, try to restore last known approval/role from localStorage
        try {
          if (!session) {
            const storedApproved = localStorage.getItem('bt:isApproved');
            const storedRole = localStorage.getItem('bt:role');
            if (storedApproved !== null) setIsApproved(storedApproved === 'true');
            if (storedRole === 'admin' || storedRole === 'user') setRole(storedRole as any);
          }
        } catch (e) { }

        if (session?.user) {
          if (typeof navigator !== 'undefined' && !navigator.onLine) {
            logger.info('[UserContext] offline — skipping remote profile fetch, restoring cached values');
            try {
              const storedApproved = localStorage.getItem('bt:isApproved');
              const storedRole = localStorage.getItem('bt:role');
              if (storedApproved !== null) setIsApproved(storedApproved === 'true');
              if (storedRole === 'admin' || storedRole === 'user') setRole(storedRole as any);
              // If cached approval missing but FORCE_APPROVE is enabled, apply it
              if (!storedApproved && FORCE_APPROVE) {
                setIsApproved(true);
                if (!storedRole) setRole('admin');
                try { localStorage.setItem('bt:isApproved','true'); localStorage.setItem('bt:role','admin'); } catch(e) {}
              }
            } catch (e) { }
          } else {
            fetchProfile(session.user.id, session.user.email ?? "");
          }
        } else {
          // Dev bypass: if FORCE_APPROVE and dev flag present, set a fake user for local development
          try {
            if (!session && FORCE_APPROVE && typeof window !== 'undefined' && localStorage.getItem('bt:dev_user') === 'true') {
              (async () => {
                try {
                  let devId = localStorage.getItem('bt:dev_user_id');
                  if (!devId) {
                    const gen = (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : '00000000-0000-4000-8000-000000000000';
                    localStorage.setItem('bt:dev_user_id', gen);
                    devId = gen;
                  }

                  const fakeUser = { id: devId, email: 'dev@local', user_metadata: { full_name: 'Dev User' } } as any;
                  setUser(fakeUser);
                  setIsApproved(true);
                  setRole('admin');
                  localStorage.setItem('user_name', 'Dev User');
                  try { localStorage.setItem('bt:isApproved','true'); localStorage.setItem('bt:role','admin'); } catch(e) {}

                  try {
                    await db.messages.where('user_id').equals('dev_user').modify({ user_id: devId });
                  } catch (mErr) {
                    logger.warn('[UserContext] dev pending migration failed', mErr);
                  }

                  try {
                    const cachedRaw = localStorage.getItem('chat_messages');
                    if (cachedRaw) {
                      const parsed = JSON.parse(cachedRaw);
                      let changed = false;
                      const updated = parsed.map((m: any) => {
                        if (m.user_id === 'dev_user') { m.user_id = devId; changed = true; }
                        return m;
                      });
                      if (changed) localStorage.setItem('chat_messages', JSON.stringify(updated));
                    }

                    const pendingRaw = localStorage.getItem('pending_msgs');
                    if (pendingRaw) {
                      const parsed = JSON.parse(pendingRaw);
                      let changed = false;
                      const updated = parsed.map((m: any) => {
                        if (m.user_id === 'dev_user') { m.user_id = devId; changed = true; }
                        return m;
                      });
                      if (changed) localStorage.setItem('pending_msgs', JSON.stringify(updated));
                    }
                  } catch (sErr) {
                    logger.warn('[UserContext] failed to update localStorage pending messages', sErr);
                  }
                } catch (err) {
                  logger.warn('[UserContext] dev bypass setup failed', err);
                }
              })();
            }
          } catch (err) {
            // ignore
          }
        }

        if (session?.user?.user_metadata?.full_name) {
          localStorage.setItem('user_name', session.user.user_metadata.full_name);
        }
      } catch (err) {
        logger.warn('[UserContext] supabase.getSession failed', err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        if (typeof navigator !== 'undefined' && !navigator.onLine) {
          logger.info('[UserContext] offline — skipping remote profile fetch on auth change');
        } else {
          fetchProfile(session.user.id, session.user.email ?? "");
        }
      } else {
        try {
          // If FORCE_APPROVE is enabled we want the app to behave as approved in dev,
          // even when no session exists (useful for system-offline reloads).
          if (FORCE_APPROVE) {
            setIsApproved(true);
            setRole('admin');
            try { localStorage.setItem('bt:isApproved','true'); localStorage.setItem('bt:role','admin'); } catch(e) {}
          } else if (typeof window !== 'undefined' && localStorage.getItem('bt:dev_user') === 'true') {
            (async () => {
              try {
                let devId = localStorage.getItem('bt:dev_user_id');
                if (!devId) {
                  const gen = (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : '00000000-0000-4000-8000-000000000000';
                  localStorage.setItem('bt:dev_user_id', gen);
                  devId = gen;
                }
                const fakeUser = { id: devId, email: 'dev@local', user_metadata: { full_name: 'Dev User' } } as any;
                setUser(fakeUser);
                setIsApproved(true);
                setRole('admin');
                try { localStorage.setItem('bt:isApproved','true'); localStorage.setItem('bt:role','admin'); } catch(e) {}
              } catch (err) {
                logger.warn('[UserContext] dev bypass check failed', err);
                setIsApproved(false);
                setRole(null);
              }
            })();
          } else {
            logger.info("👋 [UserContext] User logged out.");
            setIsApproved(false);
            setRole(null);
          }
        } catch (err) {
          logger.warn('[UserContext] dev bypass check failed', err);
          setIsApproved(false);
          setRole(null);
        }
      }
      setLoading(false);

      if (session?.user?.user_metadata?.full_name) {
        localStorage.setItem('user_name', session.user.user_metadata.full_name);
      }
    });

    return () => {
      mounted = false;
      try { subscription.unsubscribe(); } catch (e) { }
    };
  }, []);

  

  const sendOtp = async (email: string) => {
    try {
      if (DISABLE_EMAILS) {
        logger.info('[UserContext] sendOtp skipped (emails disabled)', { email });
        return { error: null } as any;
      }
      const { error } = await supabase.auth.signInWithOtp({ email });
      return { error };
    } catch (err) {
      logger.error('[UserContext] sendOtp failed', err);
      return { error: err } as any;
    }
  };

  const verifyOtp = async (email: string, token: string) => {
    try {
      if (DISABLE_EMAILS) {
        logger.info('[UserContext] verifyOtp skipped (emails disabled)', { email, token });
        // In disabled-emails/dev mode we don't create a server session here.
        // Upstream logic expects a { data, error } shape; return a success-like object.
        return { data: { user: null }, error: null } as any;
      }
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email'
      });
      return { data, error };
    } catch (err) {
      logger.error('[UserContext] verifyOtp failed', err);
      return { data: null, error: err } as any;
    }
  };

  const signOut = async () => {
    // Clear sensitive cache
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase_cache_')) {
        localStorage.removeItem(key);
      }
    });
    localStorage.removeItem('user_name');

    await supabase.auth.signOut();
  };

  const refreshUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) fetchProfile(user.id, user.email || "");
  };

  return (
    <UserContext.Provider value={{ user, session, loading, sendOtp, verifyOtp, signOut, role, isApproved, refreshUser }}>
      {!loading && children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) throw new Error("useUser must be used within UserProvider");
  return context;
};
