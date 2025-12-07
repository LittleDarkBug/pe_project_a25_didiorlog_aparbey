import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { LoginRequest, RegisterRequest, authService } from '@/app/services/authService';
import { useToastStore } from '@/app/store/useToastStore';
import { signIn, signOut, useSession } from 'next-auth/react';

export const useAuth = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, status, update } = useSession();
  const { addToast } = useToastStore();

  const login = useMutation({
    mutationFn: async (credentials: LoginRequest) => {
        const result = await signIn('credentials', {
            redirect: false,
            email: credentials.email,
            password: credentials.password,
        });
        
        if (result?.error) {
            throw new Error("Email ou mot de passe incorrect");
        }
        return result;
    },
    onSuccess: () => {
      addToast('Connexion réussie', 'success');
      router.push('/dashboard');
      router.refresh();
    },
    onError: (error: any) => {
      addToast(error.message || 'Erreur de connexion', 'error');
    },
  });

  const register = useMutation({
    mutationFn: (data: RegisterRequest) => authService.register(data),
    onSuccess: () => {
      addToast('Compte créé avec succès. Veuillez vous connecter.', 'success');
      router.push('/login');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.detail || "Erreur d'inscription", 'error');
    },
  });

  const logout = useMutation({
    mutationFn: async () => {
      await signOut({ redirect: false });
    },
    onSuccess: () => {
      queryClient.clear();
      router.push('/login');
      addToast('Déconnexion réussie', 'info');
      router.refresh();
    },
  });

  return {
    user: session?.user,
    isAuthenticated: status === 'authenticated',
    isLoading: status === 'loading',
    login,
    register,
    logout,
    fetchUser: update // Alias update to fetchUser to refresh session
  };
};
