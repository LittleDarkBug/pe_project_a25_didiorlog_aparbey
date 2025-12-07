import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { authService, LoginRequest, RegisterRequest } from '@/app/services/authService';
import { useAuthStore } from '@/app/store/useAuthStore';
import { useToastStore } from '@/app/store/useToastStore';

export const useAuth = () => {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setTokens, setUser, logout: storeLogout, user, fetchUser } = useAuthStore();
  const { addToast } = useToastStore();

  const login = useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: async (data) => {
      setTokens(data.access_token, data.refresh_token);
      try {
        await fetchUser();
      } catch (e) {
        console.error("Failed to fetch user profile", e);
      }
      addToast('Connexion réussie', 'success');
      router.push('/dashboard');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.detail || 'Erreur de connexion', 'error');
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
      await storeLogout();
    },
    onSuccess: () => {
      queryClient.clear();
      router.push('/login');
      addToast('Déconnexion réussie', 'info');
    },
  });

  return {
    user,
    login,
    register,
    logout,
    fetchUser
  };
};
