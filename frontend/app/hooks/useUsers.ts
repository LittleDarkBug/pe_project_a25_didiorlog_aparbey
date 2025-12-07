import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { userService, User } from '@/app/services/userService';
import { useToastStore } from '@/app/store/useToastStore';
import { QUERY_KEYS } from '@/app/config/api';

export const useCurrentUser = () => {
  return useQuery({
    queryKey: QUERY_KEYS.AUTH.USER,
    queryFn: () => userService.getMe(),
    retry: false,
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: (data: Partial<User>) => userService.updateMe(data),
    onSuccess: (data) => {
      queryClient.setQueryData(QUERY_KEYS.AUTH.USER, data);
      addToast('Profil mis à jour avec succès', 'success');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.detail || 'Erreur lors de la mise à jour', 'error');
    },
  });
};

export const useUsersList = () => {
  return useQuery({
    queryKey: QUERY_KEYS.USERS.ALL,
    queryFn: () => userService.getAll(),
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  const { addToast } = useToastStore();

  return useMutation({
    mutationFn: (id: string) => userService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS.ALL });
      addToast('Utilisateur supprimé', 'success');
    },
    onError: (error: any) => {
      addToast(error.response?.data?.detail || 'Erreur lors de la suppression', 'error');
    },
  });
};

