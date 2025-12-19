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
    onSuccess: async () => {
      addToast('Connexion réussie', 'success');
      
      // Force session refresh to get the latest user data including role
      const newSession = await update();
      
      if ((newSession?.user as any)?.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
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
      const errorMessage = error.data?.detail || error.message || "Erreur d'inscription";
      addToast(errorMessage, 'error');
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
