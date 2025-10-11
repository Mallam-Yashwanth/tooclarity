"use client";

import { create } from "zustand";
import { authAPI } from "./api";

// Keep this in sync with existing app expectations
export interface User {
  id: string;
  name: string;
  email: string;
  admin: string;
  phone?: string;
  designation?: string;
  linkedin?: string;
  verified: boolean;
  institution?: string;
  isPaymentDone?: boolean;
  isProfileCompleted?: boolean;
  role: string;
  googleId?: string;
}

interface UserStoreState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  // Actions
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  setPaymentStatus: (isPaymentDone: boolean) => void;
  setProfileCompleted: (isProfileCompleted: boolean) => void;
  login: (email: string, password: string, type?: "admin" | "institution") => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

export const useUserStore = create<UserStoreState>((set, get) => ({
  user: null,
  loading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set(() => ({
      user,
      isAuthenticated: !!user,
    })),

  updateUser: (updates) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...updates } : state.user,
      isAuthenticated: !!(state.user || updates),
    })),

  setPaymentStatus: (isPaymentDone) =>
    set((state) => ({
      user: state.user ? { ...state.user, isPaymentDone } : state.user,
    })),

  setProfileCompleted: (isProfileCompleted) =>
    set((state) => ({
      user: state.user ? { ...state.user, isProfileCompleted } : state.user,
    })),

  login: async (email: string, password: string, type?: "admin" | "institution") => {
    try {
      const response = await authAPI.login({ email, password, type });
      if (response.success) {
        const data = response.data?.user || response.data;
        if (data && (data.id || data.email)) {
          // Normalize to User shape using available fields
          const user: User = {
            id: data.id || "",
            email: data.email,
            admin: data.admin || "",
            phone: data.contactNumber,
            designation: data.designation || "",
            linkedin: data.linkedin || "",
            verified: data.verified ?? true,
            name: data.name,
            institution: data.institution || ",",
            isPaymentDone: data.isPaymentDone ?? false,
            isProfileCompleted: data.isProfileCompleted ?? false,
            role: data.role || "",
            googleId: data.googleId,
          };
          get().setUser(user);
          return true;
        }
        await get().refreshUser();
        return true;
      }
      return false;
    } catch (e) {
      console.error("Login error:", e);
      return false;
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      get().setUser(null);
    }
  },

  refreshUser: async () => {
    try {
      set({ loading: true });
      const response = await authAPI.getProfile();
      if (response.success && response.data) {
        const u: User = {
          id: "",
          email: response.data.email,
          admin: "",
          phone: response.data.contactNumber,
          designation: response.data.designation || "",
          linkedin: response.data.linkedin || "",
          verified: true,
          name: response.data.name,
          institution: response.data.institution || ",",
          isPaymentDone: response.data.isPaymentDone || false,
          isProfileCompleted: response.data.isProfileCompleted || false,
          role: response.data.role || "",
          googleId: response.data.googleId,
        };
        set({ user: u, isAuthenticated: true });
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch (e) {
      console.error("Refresh user error:", e);
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ loading: false });
    }
  },
}));