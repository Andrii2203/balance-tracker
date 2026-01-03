import React, { createContext, useContext, useEffect, useState } from "react";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { supabase } from "../supabaseClient";
import { AuthService } from "../services/api.service";
import { CONFIG } from "../config/config";

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
          console.error("❌ [UserContext] upsert profile error:", insertError);
        } else {
          setIsApproved(newProfile?.is_approved ?? false);
          setRole(isAdminByEmail ? "admin" : "user");
        }
      } else {
        const approved = profile.is_approved || isAdminByEmail;
        setIsApproved(approved);
        setRole(isAdminByEmail ? "admin" : "user");
      }
    } catch (error) {
      console.error("❌ [UserContext] fetchProfile error:", error);
    }
  };

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email ?? "");
      }
      setLoading(false);
      if (session?.user?.user_metadata?.full_name) {
        localStorage.setItem('user_name', session.user.user_metadata.full_name);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id, session.user.email ?? "");
      } else {
        console.log("👋 [UserContext] User logged out.");
        setIsApproved(false);
        setRole(null);
      }
      setLoading(false);

      if (session?.user?.user_metadata?.full_name) {
        localStorage.setItem('user_name', session.user.user_metadata.full_name);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const sendOtp = async (email: string) => {
    const { error } = await supabase.auth.signInWithOtp({ email });
    return { error };
  };

  const verifyOtp = async (email: string, token: string) => {
    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token,
      type: 'email'
    });
    return { data, error };
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
