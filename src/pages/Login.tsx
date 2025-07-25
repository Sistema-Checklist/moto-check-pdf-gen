import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, User, Phone } from "lucide-react";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: ""
  });
  
  const [registerForm, setRegisterForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });

  const navigate = useNavigate();

  const handleLoginChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setLoginForm({ ...loginForm, [e.target.name]: e.target.value });
    setError("");
  };

  const handleRegisterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setRegisterForm({ ...registerForm, [e.target.name]: e.target.value });
    setError("");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: loginForm.email,
        password: loginForm.password,
      });

      if (error) {
        // Se for email não confirmado e for o admin geral, tentar confirmar automaticamente
        if (error.message.includes('Email not confirmed') && loginForm.email === 'kauankg@hotmail.com') {
          try {
            // Tentar confirmar o email automaticamente
            const { data: confirmData, error: confirmError } = await supabase.auth.updateUser({
              data: { email_confirmed: true }
            });

            if (!confirmError) {
              // Tentar login novamente
              const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
                email: loginForm.email,
                password: loginForm.password,
              });

              if (!retryError && retryData.user) {
                // Criar/atualizar perfil do admin se não existir (APENAS para o admin)
                if (retryData.user.email === 'kauankg@hotmail.com') {
                  const { error: profileError } = await supabase
                    .from('user_profiles')
                    .upsert([
                      {
                        user_id: retryData.user.id,
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
                    navigate('/');
                    return;
                  }
                }
              }
            }
          } catch (confirmError) {
            console.error('Erro ao confirmar email:', confirmError);
          }
        }
        
        setError(error.message);
        return;
      }

      if (data.user) {
        // Verificar se o usuário está aprovado
        const { data: profile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', data.user.id)
          .single();

        // Se não há perfil ou há erro (exceto para admin)
        if ((error || !profile) && data.user.email !== 'kauankg@hotmail.com') {
          setError("Perfil de usuário não encontrado. Entre em contato com o administrador.");
          await supabase.auth.signOut();
          return;
        }

        // Se é admin e não tem perfil, criar automaticamente
        if (data.user.email === 'kauankg@hotmail.com' && (!profile || error)) {
          const { error: createError } = await supabase
            .from('user_profiles')
            .upsert([{
              user_id: data.user.id,
              name: 'Admin Geral',
              email: 'kauankg@hotmail.com',
              phone: '(11) 99999-9999',
              whatsapp: '',
              is_approved: true,
              is_frozen: false,
              created_at: new Date().toISOString(),
            }], {
              onConflict: 'email'
            });

          if (createError) {
            console.error('Erro ao criar perfil admin:', createError);
            setError("Erro ao configurar perfil de administrador.");
            await supabase.auth.signOut();
            return;
          }

          // Se criou o perfil com sucesso, navegar direto
          navigate('/');
          return;
        }

        // Se não é admin e não tem perfil, erro
        if (!profile) {
          setError("Perfil de usuário não encontrado. Entre em contato com o administrador.");
          await supabase.auth.signOut();
          return;
        }

        // Verificar se o usuário está aprovado (exceto admin)
        if (data.user.email !== 'kauankg@hotmail.com' && !profile.is_approved) {
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

        navigate('/');
      }
    } catch (error) {
      setError("Erro ao fazer login. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (registerForm.password !== registerForm.confirmPassword) {
      setError("As senhas não coincidem.");
      setLoading(false);
      return;
    }

    if (registerForm.password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres.");
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: registerForm.email,
        password: registerForm.password,
        options: {
          data: {
            name: registerForm.name,
            phone: registerForm.phone,
          }
        }
      });

      if (error) {
        setError(error.message);
        return;
      }

      if (data.user) {
        // Criar perfil do usuário
        const { error: profileError } = await supabase
          .from('user_profiles')
          .insert([
            {
              user_id: data.user.id,
              name: registerForm.name,
              email: registerForm.email,
              phone: registerForm.phone,
              is_approved: false,
              is_frozen: false,
              created_at: new Date().toISOString(),
            }
          ]);

        if (profileError) {
          console.error('Erro ao criar perfil:', profileError);
        }

        setSuccess("Conta criada com sucesso! Aguarde a aprovação do administrador.");
        setRegisterForm({
          name: "",
          email: "",
          phone: "",
          password: "",
          confirmPassword: ""
        });
      }
    } catch (error) {
      setError("Erro ao criar conta. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-blue-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-violet-700">
            Sistema de Checklist
          </CardTitle>
          <p className="text-gray-600">Faça login ou crie sua conta</p>
        </CardHeader>
        <CardContent>
          <Tabs value={isLogin ? "login" : "register"} onValueChange={(value) => setIsLogin(value === "login")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Login</TabsTrigger>
              <TabsTrigger value="register">Registro</TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4">
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
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="name">Nome Completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="name"
                      name="name"
                      type="text"
                      placeholder="Seu nome completo"
                      value={registerForm.name}
                      onChange={handleRegisterChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="seu@email.com"
                      value={registerForm.email}
                      onChange={handleRegisterChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="(11) 99999-9999"
                      value={registerForm.phone}
                      onChange={handleRegisterChange}
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
                      placeholder="Mínimo 6 caracteres"
                      value={registerForm.password}
                      onChange={handleRegisterChange}
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

                <div>
                  <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      placeholder="Confirme sua senha"
                      value={registerForm.confirmPassword}
                      onChange={handleRegisterChange}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <div className="text-red-500 text-sm text-center">{error}</div>
                )}

                {success && (
                  <div className="text-green-500 text-sm text-center">{success}</div>
                )}

                <Button
                  type="submit"
                  className="w-full bg-violet-600 hover:bg-violet-700"
                  disabled={loading}
                >
                  {loading ? "Criando conta..." : "Criar Conta"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
} 