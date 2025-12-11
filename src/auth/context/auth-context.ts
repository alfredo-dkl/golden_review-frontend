import { createContext, useContext } from 'react';
import { AuthModel, UserModel } from '@/auth/lib/models';

// Create AuthContext with types
export const AuthContext = createContext<{
  loading: boolean;
  setLoading: React.Dispatch<React.SetStateAction<boolean>>;
  auth?: AuthModel;
  saveAuth: (auth: AuthModel | undefined) => void;
  user?: UserModel;
  setUser: React.Dispatch<React.SetStateAction<UserModel | undefined>>;
  login: (email: string) => Promise<void>;
  getUser: () => Promise<UserModel | null>;
  updateProfile: (userData: Partial<UserModel>) => Promise<UserModel>;
  logout: () => Promise<void>;
  verify: () => Promise<void>;
  handleCallback: () => Promise<{ success: boolean; user: UserModel }>;
  isAdmin: boolean;
}>({
  loading: false,
  setLoading: () => { },
  saveAuth: () => { },
  setUser: () => { },
  login: async () => { },
  getUser: async () => null,
  updateProfile: async () => ({}) as UserModel,
  logout: async () => { },
  verify: async () => { },
  handleCallback: async () => ({ success: false, user: {} as UserModel }),
  isAdmin: false,
});

// Hook definition
export function useAuth() {
  return useContext(AuthContext);
}
