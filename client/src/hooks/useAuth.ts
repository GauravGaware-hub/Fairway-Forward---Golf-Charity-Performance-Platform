import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { apiFetch, ApiError } from "../lib/api";

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: "SUBSCRIBER" | "ADMIN";
  selectedCharityId?: string | null;
  selectedCharity?: {
    id: string;
    name: string;
    description: string;
  } | null;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery<UserProfile | null>({
    queryKey: ["authMe"],
    queryFn: async () => {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (!sessionData.session) return null;

        const res = await apiFetch("/api/v1/me");
        return res.user || res.data || res;
      } catch (err: unknown) {
        if (err instanceof ApiError && (err.status === 401 || err.status === 403)) {
          return null;
        }
        return null;
      }
    },
    retry: false,
  });

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      throw new Error(error.message || "Invalid email or password");
    }

    await queryClient.invalidateQueries({ queryKey: ["authMe"] });

    // Fetch user profile after auth sign in
    try {
      const meRes = await apiFetch("/api/v1/me");
      const appUser = meRes.user || meRes.data || meRes;
      return { user: appUser, session: data.session };
    } catch {
      return { user: null, session: data.session };
    }
  };

  const signup = async (payload: { email: string; password: string; fullName: string }) => {
    const { data, error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: {
          full_name: payload.fullName,
        },
      },
    });

    if (error) {
      throw new Error(error.message || "Registration failed");
    }

    await queryClient.invalidateQueries({ queryKey: ["authMe"] });
    return data;
  };

  const logout = async () => {
    await supabase.auth.signOut();
    queryClient.setQueryData(["authMe"], null);
    queryClient.clear();
  };

  const refreshUser = async () => {
    await queryClient.invalidateQueries({ queryKey: ["authMe"] });
  };

  return {
    user: user || null,
    isLoading,
    isError: !!error,
    login,
    signup,
    logout,
    refreshUser,
  };
}
