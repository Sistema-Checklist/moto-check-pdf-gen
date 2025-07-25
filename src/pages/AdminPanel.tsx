import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Users, CheckCircle, XCircle, Snowflake, Search, LogOut, UserCheck, UserX, ArrowLeft } from "lucide-react";

interface UserProfile {
  id: number;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  is_approved: boolean;
  is_frozen: boolean;
  created_at: string;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editingWhatsapp, setEditingWhatsapp] = useState<string | null>(null);
  const [whatsappValue, setWhatsappValue] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
    fetchUsers();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    // Verificar se é o admin geral
    if (user.email !== 'kauankg@hotmail.com') {
      navigate('/');
      return;
    }

    setCurrentUser(user);
  };

  const fetchUsers = async () => {
    try {
      console.log('Buscando usuários...');
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        return;
      }

      console.log('Usuários encontrados:', data);
      setUsers(data || []);
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_approved: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Erro ao aprovar usuário:', error);
        return;
      }

      fetchUsers();
    } catch (error) {
      console.error('Erro ao aprovar usuário:', error);
    }
  };

  const handleFreezeUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_frozen: true })
        .eq('user_id', userId);

      if (error) {
        console.error('Erro ao congelar usuário:', error);
        return;
      }

      fetchUsers();
    } catch (error) {
      console.error('Erro ao congelar usuário:', error);
    }
  };

  const handleUnfreezeUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ is_frozen: false })
        .eq('user_id', userId);

      if (error) {
        console.error('Erro ao descongelar usuário:', error);
        return;
      }

      fetchUsers();
    } catch (error) {
      console.error('Erro ao descongelar usuário:', error);
    }
  };

  const handleEditWhatsapp = (userId: string, currentWhatsapp: string) => {
    setEditingWhatsapp(userId);
    setWhatsappValue(currentWhatsapp || "");
  };

  const handleSaveWhatsapp = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ whatsapp: whatsappValue })
        .eq('user_id', userId);

      if (error) {
        console.error('Erro ao salvar WhatsApp:', error);
        return;
      }

      setEditingWhatsapp(null);
      setWhatsappValue("");
      fetchUsers();
    } catch (error) {
      console.error('Erro ao salvar WhatsApp:', error);
    }
  };

  const handleCancelEditWhatsapp = () => {
    setEditingWhatsapp(null);
    setWhatsappValue("");
  };

  const handleRefreshUsers = async () => {
    console.log('Forçando atualização da lista de usuários...');
    await fetchUsers();
  };

  const handleCheckMissingUsers = async () => {
    try {
      console.log('Verificando usuários ausentes...');
      // Buscar todos os usuários da tabela auth
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) {
        console.error('Erro ao buscar usuários auth:', authError);
        return;
      }

      console.log('Usuários na tabela auth:', authUsers.users);

      // Verificar quais não estão na tabela user_profiles
      for (const authUser of authUsers.users) {
        const { data: profileExists } = await supabase
          .from('user_profiles')
          .select('id')
          .eq('user_id', authUser.id)
          .single();

        if (!profileExists) {
          console.log('Usuário sem perfil encontrado:', authUser.email);
          // Criar perfil automaticamente
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert([{
              user_id: authUser.id,
              name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuário',
              email: authUser.email,
              phone: authUser.phone || '',
              whatsapp: '',
              is_approved: false,
              is_frozen: false
            }]);

          if (insertError) {
            console.error('Erro ao criar perfil:', insertError);
          } else {
            console.log('Perfil criado para:', authUser.email);
          }
        }
      }

      // Recarregar a lista
      await fetchUsers();
    } catch (error) {
      console.error('Erro ao verificar usuários ausentes:', error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleVoltar = () => {
    navigate('/');
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.phone.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-violet-600" />
              <h1 className="text-2xl font-bold text-gray-900">Painel de Administração</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                Admin: {currentUser?.email}
              </span>
              <Button
                variant="outline"
                onClick={handleVoltar}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-6 w-6" />
              <span>Controle de Usuários</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {/* Search and Actions */}
            <div className="mb-6 space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar por nome, email ou telefone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={handleRefreshUsers}
                  className="flex items-center space-x-2"
                >
                  <Search className="h-4 w-4" />
                  <span>Atualizar Lista</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleCheckMissingUsers}
                  className="flex items-center space-x-2"
                >
                  <Users className="h-4 w-4" />
                  <span>Verificar Usuários Ausentes</span>
                </Button>
              </div>
            </div>

            {/* Users List */}
            <div className="space-y-4">
              {filteredUsers.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  Nenhum usuário encontrado.
                </div>
              ) : (
                filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="bg-white border rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 bg-violet-100 rounded-full flex items-center justify-center">
                            <span className="text-violet-600 font-semibold">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {user.name}
                          </h3>
                          <p className="text-sm text-gray-500">{user.email}</p>
                          <p className="text-sm text-gray-500">{user.phone}</p>
                          {editingWhatsapp === user.user_id ? (
                            <div className="flex items-center space-x-2 mt-2">
                              <Input
                                value={whatsappValue}
                                onChange={(e) => setWhatsappValue(e.target.value)}
                                placeholder="WhatsApp (ex: 11999999999)"
                                className="text-sm"
                                size={20}
                              />
                              <Button
                                size="sm"
                                onClick={() => handleSaveWhatsapp(user.user_id)}
                                className="bg-green-600 hover:bg-green-700"
                              >
                                Salvar
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={handleCancelEditWhatsapp}
                              >
                                Cancelar
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center space-x-2 mt-2">
                              <p className="text-sm text-gray-500">
                                WhatsApp: {user.whatsapp || "Não configurado"}
                              </p>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleEditWhatsapp(user.user_id, user.whatsapp)}
                                className="text-xs"
                              >
                                Editar
                              </Button>
                            </div>
                          )}
                          <p className="text-xs text-gray-400">
                            Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      {/* Status Indicators */}
                      <div className="flex items-center space-x-2">
                        {user.is_approved ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Aprovado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            <XCircle className="h-3 w-3 mr-1" />
                            Pendente
                          </span>
                        )}

                        {user.is_frozen && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <Snowflake className="h-3 w-3 mr-1" />
                            Congelado
                          </span>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        {!user.is_approved && (
                          <Button
                            size="sm"
                            onClick={() => handleApproveUser(user.user_id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Aprovar
                          </Button>
                        )}

                        {user.is_approved && !user.is_frozen && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleFreezeUser(user.user_id)}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <Snowflake className="h-4 w-4 mr-1" />
                            Congelar
                          </Button>
                        )}

                        {user.is_frozen && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUnfreezeUser(user.user_id)}
                            className="border-green-300 text-green-700 hover:bg-green-50"
                          >
                            <UserCheck className="h-4 w-4 mr-1" />
                            Descongelar
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Statistics */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {users.length}
                </div>
                <div className="text-sm text-blue-600">Total de Usuários</div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.is_approved && !u.is_frozen).length}
                </div>
                <div className="text-sm text-green-600">Usuários Ativos</div>
              </div>
              <div className="bg-yellow-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {users.filter(u => !u.is_approved).length}
                </div>
                <div className="text-sm text-yellow-600">Aguardando Aprovação</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 