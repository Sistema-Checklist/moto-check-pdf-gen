import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Check, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [credentialsSaved, setCredentialsSaved] = useState(false);
  
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });

  const navigate = useNavigate();
  const { toast } = useToast();

  // Funções para gerenciar credenciais salvas
  const saveCredentials = (email: string, password: string) => {
    try {
      console.log('💾 Salvando credenciais para:', email);
      
      const credentials = {
        email,
        password: btoa(password), // Base64 encoding simples
        expiry: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 dias
      };
      
      localStorage.setItem('checkSystem_savedCredentials', JSON.stringify(credentials));
      localStorage.setItem('checkSystem_rememberMe', 'true');
      
      setCredentialsSaved(true);
      console.log('✅ Credenciais salvas com sucesso');
      
      toast({
        title: "Acesso salvo",
        description: "Suas credenciais foram salvas por 30 dias",
        duration: 3000,
      });
    } catch (error) {
      console.error('❌ Erro ao salvar credenciais:', error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar suas credenciais",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const loadSavedCredentials = () => {
    try {
      console.log('🔄 Carregando credenciais salvas...');
      
      const savedRememberMe = localStorage.getItem('checkSystem_rememberMe');
      if (savedRememberMe === 'true') {
        console.log('📱 RememberMe está ativo');
        setRememberMe(true);
        
        const savedCredentials = localStorage.getItem('checkSystem_savedCredentials');
        if (savedCredentials) {
          const credentials = JSON.parse(savedCredentials);
          
          // Verificar se não expirou
          if (credentials.expiry && Date.now() < credentials.expiry) {
            console.log('✅ Credenciais válidas encontradas para:', credentials.email);
            setLoginForm({
              email: credentials.email || "",
              password: credentials.password ? atob(credentials.password) : ""
            });
            setCredentialsSaved(true);
            
            const daysLeft = Math.ceil((credentials.expiry - Date.now()) / (24 * 60 * 60 * 1000));
            toast({
              title: "Credenciais carregadas",
              description: `Suas credenciais foram carregadas (${daysLeft} dias restantes)`,
              duration: 3000,
            });
          } else {
            console.log('⏰ Credenciais expiradas, limpando...');
            clearSavedCredentials();
          }
        }
      } else {
        console.log('📱 RememberMe não está ativo');
      }
    } catch (error) {
      console.error('❌ Erro ao carregar credenciais:', error);
      clearSavedCredentials();
      toast({
        title: "Erro ao carregar",
        description: "Erro ao carregar credenciais salvas",
        variant: "destructive",
        duration: 3000,
      });
    }
  };

  const clearSavedCredentials = () => {
    console.log('🗑️ Limpando credenciais salvas...');
    localStorage.removeItem('checkSystem_savedCredentials');
    localStorage.removeItem('checkSystem_rememberMe');
    setRememberMe(false);
    setCredentialsSaved(false);
    
    toast({
      title: "Credenciais removidas",
      description: "Suas credenciais salvas foram removidas",
      duration: 3000,
    });
  };

  // Carregar credenciais ao montar o componente
  useEffect(() => {
    loadSavedCredentials();
  }, []);

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      console.log('Tentando fazer login com:', loginForm.email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (error) {
        console.error('Erro de autenticação:', error);
        setError(error.message);
        return;
      }

      if (data.user) {
        console.log('Login bem-sucedido para:', data.user.email);
        
        // Se é o admin, não precisa verificar perfil - pode prosseguir direto
        if (data.user.email === 'kauankg@hotmail.com') {
          console.log('Admin logado com sucesso');
          
          // Salvar credenciais se marcado
          if (rememberMe) {
            saveCredentials(loginForm.email, loginForm.password);
          } else if (credentialsSaved) {
            clearSavedCredentials();
          }
          
          navigate('/');
          return;
        }

        // Para usuários normais, verificar se o perfil existe e está aprovado
        try {
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single();

          if (profileError || !profile) {
            console.error('Perfil não encontrado:', profileError);
            setError("Perfil de usuário não encontrado. Entre em contato com o administrador.");
            await supabase.auth.signOut();
            return;
          }

          // Verificar se o usuário está aprovado
          if (!profile.is_approved) {
            setError("Sua conta ainda não foi aprovada pelo administrador.");
            await supabase.auth.signOut();
            return;
          }

          // Verificar se o usuário está congelado
          if (profile.is_frozen) {
            setError("Sua conta foi congelada. Entre em contato com o administrador.");
            await supabase.auth.signOut();
            return;
          }

          console.log('Usuário comum logado e verificado');
          
          // Salvar credenciais se marcado
          if (rememberMe) {
            saveCredentials(loginForm.email, loginForm.password);
          } else if (credentialsSaved) {
            clearSavedCredentials();
          }

          navigate('/');
        } catch (profileCheckError) {
          console.error('Erro ao verificar perfil:', profileCheckError);
          setError("Erro ao verificar perfil do usuário.");
          await supabase.auth.signOut();
        }
      }
    } catch (error) {
      console.error('Erro inesperado no login:', error);
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-violet-700">
            CheckSystem
          </CardTitle>
          <p className="text-gray-600">Sistema eficiente para checklists de motos</p>
          <p className="text-sm text-gray-500 mt-2">Acesso restrito a usuários autorizados</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={loginForm.email}
                  onChange={handleLoginChange}
                  className="pl-10"
                  required
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Sua senha"
                  value={loginForm.password}
                  onChange={handleLoginChange}
                  className="pl-10 pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="rememberMe"
                  checked={rememberMe}
                  onCheckedChange={(checked) => {
                    const isChecked = checked as boolean;
                    setRememberMe(isChecked);
                    console.log('📱 RememberMe alterado para:', isChecked);
                    
                    // Se desmarcou e tinha credenciais salvas, limpar
                    if (!isChecked && credentialsSaved) {
                      clearSavedCredentials();
                    }
                  }}
                />
                <Label htmlFor="rememberMe" className="text-sm text-gray-600 cursor-pointer">
                  Salvar acesso (30 dias)
                </Label>
              </div>
              
              {credentialsSaved && (
                <div className="flex items-center space-x-1 text-green-600">
                  <Check className="h-3 w-3" />
                  <span className="text-xs">Salvo</span>
                </div>
              )}
              
              {credentialsSaved && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearSavedCredentials}
                  className="h-6 px-2 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-3 w-3 mr-1" />
                  Limpar
                </Button>
              )}
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">{error}</div>
            )}

            <Button
              type="submit"
              className="w-full bg-violet-600 hover:bg-violet-700"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
          
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Apenas usuários autorizados pelo administrador podem acessar o sistema.
            </p>
          </div>
        </CardContent>
      </Card>
      <Toaster />
    </div>
  );
}
