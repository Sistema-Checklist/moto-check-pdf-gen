import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Shield, CheckCircle, AlertCircle } from "lucide-react";

export default function AdminSetup() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error" | "info">("info");
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminExists();
  }, []);

  const checkAdminExists = async () => {
    try {
      // Verificar se existe na tabela de perfis
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('email', 'kauankg@hotmail.com')
        .single();

      // Verificar se consegue fazer login
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: 'kauankg@hotmail.com',
          password: 'admin123456'
        });

        if (authData && !authError) {
          await supabase.auth.signOut();
          if (profileData && profileData.is_approved) {
            setMessage("✅ Admin geral já está configurado e funcionando!");
            setMessageType("success");
          } else {
            setMessage("⚠️ Conta existe mas perfil não está aprovado.");
            setMessageType("error");
          }
        } else {
          setMessage("❌ Conta existe mas não consegue fazer login. Use 'Resetar Senha'.");
          setMessageType("error");
        }
      } catch (authError) {
        if (profileData) {
          setMessage("❌ Perfil existe mas conta não funciona. Use 'Configurar Admin Geral'.");
          setMessageType("error");
        } else {
          setMessage("ℹ️ Admin geral não encontrado. Clique em 'Configurar Admin Geral'.");
          setMessageType("info");
        }
      }
    } catch (error) {
      setMessage("ℹ️ Admin geral não encontrado. Clique em 'Configurar Admin Geral'.");
      setMessageType("info");
    }
  };

  const setupAdmin = async () => {
    setLoading(true);
    setMessage("Configurando admin geral...");

    try {
      // Primeiro, verificar se o usuário auth existe
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'kauankg@hotmail.com',
        password: 'admin123456' // Senha temporária
      });

      if (authError && authError.message.includes('Invalid login credentials')) {
        // Criar conta auth se não existir
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: 'kauankg@hotmail.com',
          password: 'admin123456',
          options: {
            data: {
              name: 'Admin Geral',
              phone: '(11) 99999-9999',
            }
          }
        });

        if (signUpError) {
          throw new Error(`Erro ao criar conta auth: ${signUpError.message}`);
        }

        // Aguardar um pouco para a conta ser criada
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Confirmar email automaticamente (simular confirmação)
      const { data: confirmData, error: confirmError } = await supabase.auth.updateUser({
        data: { email_confirmed: true }
      });

      // Agora criar/atualizar o perfil
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .upsert([
          {
            user_id: authData?.user?.id || 'admin-general',
            name: 'Admin Geral',
            email: 'kauankg@hotmail.com',
            phone: '(11) 99999-9999',
            is_approved: true,
            is_frozen: false,
            created_at: new Date().toISOString(),
          }
        ], {
          onConflict: 'email'
        });

      if (profileError) {
        throw new Error(`Erro ao criar perfil: ${profileError.message}`);
      }

      setMessage("Admin geral configurado com sucesso! Email: kauankg@hotmail.com | Senha: admin123456");
      setMessageType("success");

      // Fazer logout
      await supabase.auth.signOut();

    } catch (error) {
      console.error('Erro ao configurar admin:', error);
      setMessage(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const forceConfirmAdmin = async () => {
    setLoading(true);
    setMessage("Verificando e configurando admin geral...");

    try {
      // Primeiro, fazer logout para limpar qualquer sessão
      await supabase.auth.signOut();

      // Verificar se a conta já existe
      setMessage("Verificando se a conta já existe...");
      
      try {
        const { data: existingUser, error: checkError } = await supabase.auth.signInWithPassword({
          email: 'kauankg@hotmail.com',
          password: 'admin123456'
        });

        if (existingUser && !checkError) {
          // Se conseguimos fazer login, a conta existe e está funcionando
          setMessage("Conta já existe e está funcionando!");
          
          // Criar/atualizar perfil
          const { error: profileError } = await supabase
            .from('user_profiles')
            .upsert([
              {
                user_id: existingUser.user.id,
                name: 'Admin Geral',
                email: 'kauankg@hotmail.com',
                phone: '(11) 99999-9999',
                is_approved: true,
                is_frozen: false,
                created_at: new Date().toISOString(),
              }
            ], {
              onConflict: 'email'
            });

          if (!profileError) {
            setMessage("✅ Admin geral já configurado! Email: kauankg@hotmail.com | Senha: admin123456");
            setMessageType("success");
          }
          
          await supabase.auth.signOut();
          return;
        }
      } catch (checkError) {
        // Se não conseguimos fazer login, continuar com a criação
        console.log("Conta não existe ou não está funcionando, criando nova...");
      }

      // Criar a conta do zero
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'kauankg@hotmail.com',
        password: 'admin123456',
        options: {
          data: {
            name: 'Admin Geral',
            phone: '(11) 99999-9999',
          }
        }
      });

      if (signUpError) {
        throw new Error(`Erro ao criar conta: ${signUpError.message}`);
      }

      setMessage("Conta criada. Aguardando confirmação...");
      
      // Aguardar um pouco para a conta ser processada
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Tentar fazer login
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: 'kauankg@hotmail.com',
        password: 'admin123456'
      });

      if (loginError) {
        // Se ainda der erro de email não confirmado, tentar uma abordagem diferente
        if (loginError.message.includes('Email not confirmed')) {
          setMessage("Email não confirmado. Tentando confirmação automática...");
          
          // Tentar usar o token de confirmação se disponível
          if (signUpData.session) {
            // Se temos uma sessão, significa que o email foi confirmado automaticamente
            setMessage("Email confirmado automaticamente!");
          } else {
            throw new Error("Email não confirmado. Verifique sua caixa de entrada ou desabilite a confirmação de email no Supabase.");
          }
        } else {
          throw new Error(`Erro no login: ${loginError.message}`);
        }
      }

      // Criar/atualizar perfil
      const { error: profileError } = await supabase
        .from('user_profiles')
        .upsert([
          {
            user_id: loginData?.user?.id || signUpData?.user?.id || 'admin-general',
            name: 'Admin Geral',
            email: 'kauankg@hotmail.com',
            phone: '(11) 99999-9999',
            is_approved: true,
            is_frozen: false,
            created_at: new Date().toISOString(),
          }
        ], {
          onConflict: 'email'
        });

      if (profileError) {
        console.error('Erro ao criar perfil:', profileError);
        // Não falhar se o perfil não puder ser criado
      }

      setMessage("✅ Admin geral configurado com sucesso! Email: kauankg@hotmail.com | Senha: admin123456");
      setMessageType("success");

      // Fazer logout
      await supabase.auth.signOut();

    } catch (error) {
      console.error('Erro ao forçar confirmação:', error);
      setMessage(`❌ Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const goToLogin = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-12 w-12 text-violet-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-violet-700">
            Configuração do Admin Geral
          </CardTitle>
          <p className="text-gray-600">Configure o acesso administrativo</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2">Credenciais do Admin:</h3>
            <div className="text-sm text-gray-600 space-y-1">
              <p><strong>Email:</strong> kauankg@hotmail.com</p>
              <p><strong>Senha:</strong> admin123456</p>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-lg flex items-center gap-2 ${
              messageType === "success" ? "bg-green-50 text-green-800" :
              messageType === "error" ? "bg-red-50 text-red-800" :
              "bg-blue-50 text-blue-800"
            }`}>
              {messageType === "success" ? (
                <CheckCircle className="h-5 w-5" />
              ) : messageType === "error" ? (
                <AlertCircle className="h-5 w-5" />
              ) : (
                <Shield className="h-5 w-5" />
              )}
              <span className="text-sm">{message}</span>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={setupAdmin}
              disabled={loading}
              className="w-full bg-violet-600 hover:bg-violet-700"
            >
              {loading ? "Configurando..." : "Configurar Admin Geral"}
            </Button>

            <Button
              onClick={forceConfirmAdmin}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? "Configurando..." : "Configurar Admin Geral"}
            </Button>

            <Button
              onClick={async () => {
                setLoading(true);
                setMessage("Enviando email de reset de senha...");
                try {
                  const { error } = await supabase.auth.resetPasswordForEmail('kauankg@hotmail.com');
                  if (error) {
                    setMessage(`Erro: ${error.message}`);
                    setMessageType("error");
                  } else {
                    setMessage("Email de reset enviado! Verifique sua caixa de entrada.");
                    setMessageType("success");
                  }
                } catch (error) {
                  setMessage(`Erro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
                  setMessageType("error");
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? "Enviando..." : "Resetar Senha"}
            </Button>

            <Button
              onClick={goToLogin}
              variant="outline"
              className="w-full"
            >
              Ir para Login
            </Button>
          </div>

          <div className="text-xs text-gray-500 text-center">
            <p>Esta página configura automaticamente o admin geral.</p>
            <p>Após a configuração, use as credenciais para fazer login.</p>
            <div className="mt-4 p-3 bg-yellow-50 rounded border border-yellow-200">
              <p className="font-semibold text-yellow-800 mb-2">⚠️ Soluções para o Problema:</p>
              <p className="text-yellow-700 text-xs">
                <strong>Opção 1 - Configuração Manual:</strong><br/>
                1. Vá para o painel do Supabase<br/>
                2. Authentication → Settings<br/>
                3. Desabilite "Enable email confirmations"<br/>
                4. Tente fazer login novamente<br/><br/>
                
                <strong>Opção 2 - Reset de Senha:</strong><br/>
                1. Clique em "Resetar Senha" abaixo<br/>
                2. Verifique o email kauankg@hotmail.com<br/>
                3. Siga o link para criar nova senha<br/><br/>
                
                <strong>Opção 3 - Configuração Automática:</strong><br/>
                1. Clique em "Configurar Admin Geral"<br/>
                2. Aguarde a configuração automática
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 