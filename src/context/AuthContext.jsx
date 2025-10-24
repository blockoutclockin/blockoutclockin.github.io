import { createContext, useEffect, useState, useContext } from "react";
import { supabase } from "../supabaseClient";

const AuthContext = createContext();

export const AuthContextProvider = ({ children }) => {
  // session: null when logged out, object when logged in
  // initializing: true while we're fetching the initial session
  const [session, setSession] = useState(null);
  const [initializing, setInitializing] = useState(true);

  // Sign up
  const signUpNewUser = async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    return { data, error };
  };

  // Sign in
  const signInUser = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { data, error };
  };

  // Sign out
  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    // Immediately clear local session so guarded routes react right away
    setSession(null);
    return { error };
  };

  useEffect(() => {
    let mounted = true;

    // Get initial session
    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data?.session ?? null);
      setInitializing(false);
      if (error) console.error("getSession error:", error);
    })();

    // Subscribe to auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, newSession) => {
      if (!mounted) return;
      setSession(newSession ?? null);
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider
      value={{ session, initializing, signUpNewUser, signInUser, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const UserAuth = () => useContext(AuthContext);
