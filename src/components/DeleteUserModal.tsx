import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription 
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserDeleted: () => void;
  user: {
    id: number;
    user_id: string;
    name: string;
    email: string;
  } | null;
}

export default function DeleteUserModal({ isOpen, onClose, onUserDeleted, user }: DeleteUserModalProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleDelete = async () => {
    if (!user) return;

    // Verificar se não é o admin
    if (user.email === 'kauankg@hotmail.com') {
      toast({
        title: "Operação não permitida",
        description: "O administrador principal não pode ser deletado",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Chamar Edge Function para deletar usuário
      const { data, error } = await supabase.functions.invoke('delete-user', {
        body: {
          user_id: user.user_id,
          email: user.email
        }
      });

      if (error) {
        console.error('Erro ao chamar function:', error);
        toast({
          title: "Erro ao deletar usuário",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (!data.success) {
        toast({
          title: "Erro ao deletar usuário",
          description: data.error || "Erro desconhecido",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Usuário deletado",
        description: `${user.name} foi removido do sistema`,
      });

      onUserDeleted();
      onClose();
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro inesperado",
        description: "Ocorreu um erro ao deletar o usuário",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Deletar Usuário
          </DialogTitle>
          <DialogDescription>
            Esta ação não pode ser desfeita. O usuário será removido permanentemente do sistema.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-sm text-red-800">
              <strong>Nome:</strong> {user.name}
            </p>
            <p className="text-sm text-red-800">
              <strong>Email:</strong> {user.email}
            </p>
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleDelete} 
            disabled={loading}
          >
            {loading ? "Deletando..." : "Deletar Usuário"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}