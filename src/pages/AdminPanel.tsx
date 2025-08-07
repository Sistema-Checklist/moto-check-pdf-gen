import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Users, CheckCircle, XCircle, Snowflake, Search, LogOut, UserCheck, UserX, ArrowLeft, UserPlus, Trash2 } from "lucide-react";
import CreateUserModal from "@/components/CreateUserModal";
import DeleteUserModal from "@/components/DeleteUserModal";
import { useToast } from "@/hooks/use-toast";

interface UserProfile {
  id: number;
  user_id: string;
  name: string;
  email: string;
  phone: string;
  whatsapp: string;
  company_name: string;
  company_logo: string;
  is_approved: boolean;
  is_frozen: boolean;
  created_at: string;
}

export default function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [editingCompany, setEditingCompany] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [companyLogo, setCompanyLogo] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [savingCompany, setSavingCompany] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showErrorMessage, setShowErrorMessage] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserProfile | null>(null);

  const navigate = useNavigate();
  const { toast } = useToast();

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
      setLoading(true);
      
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erro ao buscar usuários:', error);
        toast({
          title: "Erro ao carregar usuários",
          description: error.message || "Erro desconhecido",
          variant: "destructive",
        });
        setUsers([]);
        return;
      }

      console.log('Usuários encontrados:', data);
      const usersData = data || [];
      setUsers(usersData);
      
      if (usersData.length > 0) {
        toast({
          title: "Lista atualizada",
          description: `${usersData.length} usuários encontrados`,
        });
      } else {
        toast({
          title: "Lista vazia",
          description: "Nenhum usuário encontrado",
        });
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
      toast({
        title: "Erro inesperado",
        description: "Erro ao buscar usuários",
        variant: "destructive",
      });
      setUsers([]);
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
        toast({
          title: "Erro",
          description: "Erro ao descongelar usuário",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Usuário descongelado",
        description: "O usuário foi descongelado com sucesso",
      });

      fetchUsers();
    } catch (error) {
      console.error('Erro ao descongelar usuário:', error);
    }
  };

  const handleDeleteUser = (user: UserProfile) => {
    // Verificar se não é o admin
    if (user.email === 'kauankg@hotmail.com') {
      toast({
        title: "Operação não permitida",
        description: "O administrador principal não pode ser deletado",
        variant: "destructive",
      });
      return;
    }
    
    setUserToDelete(user);
    setShowDeleteModal(true);
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
          // Criar perfil automaticamente (NUNCA aprovado automaticamente)
          const { error: insertError } = await supabase
            .from('user_profiles')
            .insert([{
              user_id: authUser.id,
              name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuário',
              email: authUser.email,
              phone: authUser.phone || '',
              is_approved: authUser.email === 'kauankg@hotmail.com', // Apenas admin é aprovado automaticamente
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

  const handleSetupAdmin = async () => {
    try {
      console.log('Configurando conta admin...');
      
      // Tentar fazer login com as credenciais fornecidas
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'kauankg@hotmail.com',
        password: 'Kauan134778@'
      });

      if (loginError) {
        console.error('Erro ao fazer login admin:', loginError);
        alert('Erro ao fazer login admin: ' + loginError.message);
        return;
      }

      if (loginData.user) {
        // Verificar se o perfil admin existe
        const { data: profile, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', loginData.user.id)
          .single();

        if (!profile || profileError) {
          // Criar perfil admin
          const { error: createError } = await supabase
            .from('user_profiles')
            .insert([{
              user_id: loginData.user.id,
              name: 'Admin Geral',
              email: 'kauankg@hotmail.com',
              phone: '(11) 99999-9999',
              is_approved: true,
              is_frozen: false,
              created_at: new Date().toISOString(),
            }]);

          if (createError) {
            console.error('Erro ao criar perfil admin:', createError);
            alert('Erro ao criar perfil admin: ' + createError.message);
          } else {
            console.log('Perfil admin criado com sucesso!');
            alert('Conta admin configurada com sucesso!\nEmail: kauankg@hotmail.com\nSenha: Kauan134778@');
          }
        } else {
          console.log('Perfil admin já existe!');
          alert('Conta admin já está configurada!\nEmail: kauankg@hotmail.com\nSenha: Kauan134778@');
        }

        // Fazer logout
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error('Erro ao configurar admin:', error);
      alert('Erro ao configurar admin: ' + error);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const handleVoltar = () => {
    navigate('/');
  };

  // Funções para gerenciar empresa
  const handleEditCompany = (user: UserProfile) => {
    setEditingCompany(user.user_id);
    setCompanyName(user.company_name || '');
    setCompanyLogo(user.company_logo || '');
    setWhatsapp(user.whatsapp || '');
  };

  const handleSaveCompany = async (userId: string) => {
    if (!companyName.trim()) {
      setErrorMessage("Nome da empresa é obrigatório");
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 3000);
      return;
    }

    setSavingCompany(true);
    try {
      // Verificar se os campos existem
      const fieldsExist = await checkCompanyFields();
      if (!fieldsExist) {
        setErrorMessage("Campos de empresa não encontrados. Execute o script SQL primeiro.");
        setShowErrorMessage(true);
        setTimeout(() => setShowErrorMessage(false), 5000);
        return;
      }

      console.log('Tentando salvar dados da empresa:', {
        userId,
        companyName: companyName.trim(),
        hasLogo: !!companyLogo
      });

      // Tentar salvar apenas o nome primeiro
      const { data, error } = await supabase
        .from('user_profiles')
        .update({ 
          company_name: companyName.trim()
        })
        .eq('user_id', userId)
        .select();

      if (error) {
        console.error('Erro ao salvar nome da empresa:', error);
        setErrorMessage(`Erro ao salvar nome: ${error.message || error.details || 'Campo não encontrado'}`);
        setShowErrorMessage(true);
        setTimeout(() => setShowErrorMessage(false), 5000);
        return;
      }

      // Se tem logo, salvar separadamente
      if (companyLogo) {
        const { error: logoError } = await supabase
          .from('user_profiles')
          .update({ company_logo: companyLogo })
          .eq('user_id', userId);

        if (logoError) {
          console.error('Erro ao salvar logo:', logoError);
          setErrorMessage(`Erro ao salvar logo: ${logoError.message || logoError.details}`);
          setShowErrorMessage(true);
          setTimeout(() => setShowErrorMessage(false), 5000);
          return;
        }
      }

      // Se tem WhatsApp, tentar salvar separadamente
      if (whatsapp.trim()) {
        try {
          const { error: whatsappError } = await supabase
            .from('user_profiles')
            .update({ whatsapp: whatsapp.trim() })
            .eq('user_id', userId);

          if (whatsappError) {
            console.error('Erro ao salvar WhatsApp:', whatsappError);
            // Não mostrar erro para o usuário, apenas log
          }
        } catch (error) {
          console.error('Erro ao tentar salvar WhatsApp:', error);
          // Não mostrar erro para o usuário, apenas log
        }
      }

      console.log('Dados salvos com sucesso:', data);
      setEditingCompany(null);
      setCompanyName("");
      setCompanyLogo("");
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 3000);
      fetchUsers();
    } catch (error) {
      console.error('Erro inesperado ao salvar dados da empresa:', error);
      setErrorMessage(`Erro inesperado: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setShowErrorMessage(true);
      setTimeout(() => setShowErrorMessage(false), 5000);
    } finally {
      setSavingCompany(false);
    }
  };

  const handleCancelEditCompany = () => {
    setEditingCompany(null);
    setCompanyName("");
    setCompanyLogo("");
    setWhatsapp("");
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validar tipo de arquivo
      if (!file.type.startsWith('image/')) {
        setErrorMessage("Por favor, selecione apenas arquivos de imagem.");
        setShowErrorMessage(true);
        setTimeout(() => setShowErrorMessage(false), 3000);
        return;
      }

      // Validar tamanho (máximo 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setErrorMessage("A imagem deve ter no máximo 2MB.");
        setShowErrorMessage(true);
        setTimeout(() => setShowErrorMessage(false), 3000);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCompanyLogo(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // Função para verificar se os campos de empresa existem
  const checkCompanyFields = async () => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('company_name, company_logo')
        .limit(1);

      if (error) {
        console.error('Erro ao verificar campos de empresa:', error);
        return false;
      }

      console.log('Campos de empresa verificados:', data);
      return true;
    } catch (error) {
      console.error('Erro ao verificar campos de empresa:', error);
      return false;
    }
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
      {/* Pop-ups de Feedback */}
      {showSuccessMessage && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <CheckCircle className="h-5 w-5" />
          <span>Dados da empresa salvos com sucesso!</span>
        </div>
      )}
      
      {showErrorMessage && (
        <div className="fixed top-4 right-4 z-50 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
          <XCircle className="h-5 w-5" />
          <span>{errorMessage}</span>
        </div>
      )}
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
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Criar Nova Conta</span>
                </Button>
                <Button
                  variant="outline"
                  onClick={handleRefreshUsers}
                  className="flex items-center space-x-2"
                >
                  <Search className="h-4 w-4" />
                  <span>Atualizar Lista</span>
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
                          <p className="text-xs text-gray-400">
                            Criado em: {new Date(user.created_at).toLocaleDateString('pt-BR')}
                          </p>
                          
                          {/* Informações da Empresa */}
                          <div className="mt-2">
                            {editingCompany === user.user_id ? (
                              <div className="space-y-2 p-3 bg-gray-50 rounded-lg">
                                <div>
                                  <Label className="text-xs font-medium text-gray-700">Nome da Empresa</Label>
                                  <Input
                                    value={companyName}
                                    onChange={(e) => setCompanyName(e.target.value)}
                                    placeholder="Digite o nome da empresa"
                                    className="text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-gray-700">WhatsApp para Agendamentos</Label>
                                  <Input
                                    value={whatsapp}
                                    onChange={(e) => setWhatsapp(e.target.value)}
                                    placeholder="(XX) XXXXX-XXXX"
                                    className="text-sm"
                                  />
                                </div>
                                <div>
                                  <Label className="text-xs font-medium text-gray-700">Logo da Empresa</Label>
                                  <div className="flex items-center space-x-2">
                                    <Input
                                      type="file"
                                      accept="image/*"
                                      onChange={handleLogoUpload}
                                      className="text-sm"
                                    />
                                    {companyLogo && (
                                      <img 
                                        src={companyLogo} 
                                        alt="Logo preview" 
                                        className="w-8 h-8 rounded object-cover"
                                      />
                                    )}
                                  </div>
                                </div>
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    onClick={() => handleSaveCompany(user.user_id)}
                                    disabled={savingCompany}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                  >
                                    {savingCompany ? (
                                      <>
                                        <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2"></div>
                                        Salvando...
                                      </>
                                    ) : (
                                      'Salvar'
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={handleCancelEditCompany}
                                    disabled={savingCompany}
                                  >
                                    Cancelar
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-center space-x-2">
                                {user.company_logo && (
                                  <img 
                                    src={user.company_logo} 
                                    alt="Logo da empresa" 
                                    className="w-6 h-6 rounded object-cover"
                                  />
                                )}
                                <div className="flex flex-col">
                                  <span className="text-sm text-gray-600">
                                    {user.company_name || 'Empresa não configurada'}
                                  </span>
                                  {user.whatsapp && (
                                    <span className="text-xs text-gray-500">
                                      WhatsApp: {user.whatsapp}
                                    </span>
                                  )}
                                </div>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleEditCompany(user)}
                                  className="text-xs"
                                >
                                  {user.company_name ? 'Editar' : 'Configurar'} Empresa
                                </Button>
                              </div>
                            )}
                          </div>
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

                        {/* Botão de deletar usuário - apenas se não for o admin */}
                        {user.email !== 'kauankg@hotmail.com' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteUser(user)}
                            className="border-red-300 text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Deletar
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

      {/* Modals */}
      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onUserCreated={fetchUsers}
      />

      <DeleteUserModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onUserDeleted={fetchUsers}
        user={userToDelete}
      />
    </div>
  );
}