import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { CalendarIcon, BikeIcon, Wrench, CalendarDays, Clock, MessageSquare, PhoneIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const tipoManutencaoOptions = [
  { value: "corretiva", label: "Corretiva" },
  { value: "preventiva", label: "Preventiva" },
  { value: "troca_oleo", label: "Troca de Óleo" },
];

// Simulação de locatários (em produção, buscar do backend)
const mockLocatarios = [
  { nome: "Alessandro De Souza Velozo", rg: "563105057" },
  { nome: "Maison Henrique", rg: "632886997" },
];

export default function AgendarPublico() {
  const location = useLocation();
  const [form, setForm] = useState({
    nome: "",
    telefone: "",
    placa: "",
    tipo: "",
    data: "",
    horario: "",
    obs: "",
    locatario_rg: "",
  });
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState("");

  // Removido a dependência do parâmetro locatario - agora é um link único para todos

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setErro("");
    
    console.log('=== INÍCIO DO PROCESSAMENTO ===');
    console.log('Formulário recebido:', form);
    
    // Validar campos obrigatórios
    if (!form.nome || !form.telefone || !form.placa || !form.tipo) {
      setErro("Por favor, preencha todos os campos obrigatórios.");
      console.log('Erro: Campos obrigatórios não preenchidos');
      return;
    }
    
    console.log('Validação passou - processando agendamento...');
    
    try {
      // 1. PROCESSAR DADOS DO AGENDAMENTO
      const agendamentoData = {
        id: Date.now(),
        nome: form.nome,
        telefone: form.telefone,
        placa: form.placa,
        tipo: form.tipo,
        status: "pendente",
        data: form.data,
        horario: form.horario,
        obs: form.obs,
        locatario_rg: form.locatario_rg,
        created_at: new Date().toISOString()
      };

      console.log('Dados do agendamento processados:', agendamentoData);
      
      // 2. BUSCAR USUÁRIO LOGADO E SEU WHATSAPP
      console.log('Buscando usuário logado...');
      
      let whatsappNumber = null;
      
      try {
        // Primeiro, buscar o usuário logado
        const { data: { user }, error: userAuthError } = await supabase.auth.getUser();
        
        if (userAuthError) {
          console.error('Erro ao buscar usuário:', userAuthError);
          // Se não conseguir buscar usuário, tentar buscar admin como fallback
          console.log('Tentando buscar admin como fallback...');
          const { data: adminProfile } = await supabase
            .from('user_profiles')
            .select('whatsapp')
            .eq('email', 'kauankg@hotmail.com')
            .single();
          
          if (adminProfile?.whatsapp) {
            console.log('WhatsApp do admin encontrado (fallback):', adminProfile.whatsapp);
            whatsappNumber = adminProfile.whatsapp.replace(/\D/g, '');
          }
        } else if (user) {
          console.log('Usuário logado encontrado:', user.email);
          
          // Buscar o perfil do usuário logado
          const { data: userProfile, error: profileError } = await supabase
            .from('user_profiles')
            .select('whatsapp')
            .eq('user_id', user.id)
            .single();
          
          console.log('Resultado da busca do perfil:', { userProfile, profileError });
          
          if (userProfile?.whatsapp) {
            console.log('WhatsApp do usuário encontrado:', userProfile.whatsapp);
            whatsappNumber = userProfile.whatsapp.replace(/\D/g, '');
            console.log('WhatsApp limpo:', whatsappNumber);
          } else {
            console.log('WhatsApp não encontrado no perfil do usuário');
            
            // Tentar buscar por email como fallback
            const { data: fallbackProfile } = await supabase
              .from('user_profiles')
              .select('whatsapp')
              .eq('email', user.email)
              .single();
            
            if (fallbackProfile?.whatsapp) {
              console.log('WhatsApp encontrado por email:', fallbackProfile.whatsapp);
              whatsappNumber = fallbackProfile.whatsapp.replace(/\D/g, '');
            } else {
              console.log('WhatsApp não encontrado por email também');
              
              // Último fallback: buscar admin
              const { data: adminProfile } = await supabase
                .from('user_profiles')
                .select('whatsapp')
                .eq('email', 'kauankg@hotmail.com')
                .single();
              
              if (adminProfile?.whatsapp) {
                console.log('WhatsApp do admin encontrado (último fallback):', adminProfile.whatsapp);
                whatsappNumber = adminProfile.whatsapp.replace(/\D/g, '');
              }
            }
          }
        } else {
          console.log('Usuário não está logado');
          // Se não estiver logado, tentar buscar admin
          const { data: adminProfile } = await supabase
            .from('user_profiles')
            .select('whatsapp')
            .eq('email', 'kauankg@hotmail.com')
            .single();
          
          if (adminProfile?.whatsapp) {
            console.log('WhatsApp do admin encontrado (usuário não logado):', adminProfile.whatsapp);
            whatsappNumber = adminProfile.whatsapp.replace(/\D/g, '');
          }
        }
      } catch (error) {
        console.error('Erro ao buscar WhatsApp:', error);
      }
      
      // 5. PREPARAR DADOS
      const tipoLabel = tipoManutencaoOptions.find(opt => opt.value === form.tipo)?.label || form.tipo;
      
      console.log('Tipo de manutenção:', tipoLabel);
      
      // 6. ABRIR WHATSAPP AUTOMATICAMENTE
      if (whatsappNumber) {
        // Formatar mensagem para WhatsApp
        const mensagem = `🛵 *NOVO AGENDAMENTO DE MANUTENÇÃO*

👤 *Nome:* ${form.nome}
📱 *Telefone:* ${form.telefone}
🏍️ *Placa:* ${form.placa}
🔧 *Tipo:* ${tipoLabel}
${form.data ? `📅 *Data:* ${form.data}` : ''}
${form.horario ? `⏰ *Horário:* ${form.horario}` : ''}
${form.obs ? `📝 *Observações:* ${form.obs}` : ''}

✅ *Agendamento solicitado com sucesso!*
📞 *Entre em contato para confirmar.*`;

        console.log('Mensagem formatada para WhatsApp:', mensagem);
        
        // Limpar e formatar número do WhatsApp
        const numeroLimpo = whatsappNumber.replace(/\D/g, '');
        console.log('Número do WhatsApp limpo:', numeroLimpo);
        
        // Garantir que o número tenha código do país (Brasil = 55)
        const numeroCompleto = numeroLimpo.startsWith('55') ? numeroLimpo : `55${numeroLimpo}`;
        console.log('Número completo com código do país:', numeroCompleto);
        
        // Codificar mensagem para URL
        const mensagemCodificada = encodeURIComponent(mensagem);
        const whatsappUrl = `https://wa.me/${numeroCompleto}?text=${mensagemCodificada}`;
        
        console.log('URL do WhatsApp gerada:', whatsappUrl);
        console.log('Abrindo WhatsApp automaticamente...');
        
        // ESTRATÉGIA ROBUSTA PARA ABRIR WHATSAPP
        console.log('🚀 Iniciando abertura do WhatsApp...');
        
        // Método 1: Tentar abrir em nova aba/janela
        let whatsappAberto = false;
        
        try {
          // Configurações para nova janela
          const windowFeatures = 'width=600,height=700,scrollbars=yes,resizable=yes,status=yes';
          
          // Tentar abrir em nova janela
          const newWindow = window.open(whatsappUrl, '_blank', windowFeatures);
          
          if (newWindow && !newWindow.closed) {
            console.log('✅ WhatsApp aberto em nova janela');
            newWindow.focus();
            whatsappAberto = true;
          } else {
            console.log('⚠️ Nova janela falhou, tentando nova aba');
            
            // Tentar abrir em nova aba
            const newTab = window.open(whatsappUrl, '_blank');
            
            if (newTab) {
              console.log('✅ WhatsApp aberto em nova aba');
              whatsappAberto = true;
            }
          }
        } catch (error) {
          console.log('⚠️ Erro ao abrir nova janela/aba:', error);
        }
        
        // Método 2: Se não abriu, tentar redirecionar
        if (!whatsappAberto) {
          console.log('🔄 Tentando redirecionamento...');
          
          try {
            // Verificar se é mobile
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (isMobile) {
              console.log('📱 Dispositivo móvel detectado');
              // Em mobile, redirecionar diretamente
              window.location.href = whatsappUrl;
            } else {
              console.log('💻 Desktop detectado');
              // Em desktop, tentar abrir em nova aba
              const link = document.createElement('a');
              link.href = whatsappUrl;
              link.target = '_blank';
              link.rel = 'noopener noreferrer';
              document.body.appendChild(link);
              link.click();
              document.body.removeChild(link);
            }
            
            whatsappAberto = true;
          } catch (error) {
            console.log('⚠️ Erro no redirecionamento:', error);
          }
        }
        
        // Método 3: Se ainda não abriu, mostrar instruções
        if (!whatsappAberto) {
          console.log('❌ Todos os métodos falharam, mostrando instruções');
          
          // Criar modal com instruções
          const modal = document.createElement('div');
          modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
          `;
          
          modal.innerHTML = `
            <div style="
              background: white;
              padding: 30px;
              border-radius: 15px;
              max-width: 500px;
              text-align: center;
              box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            ">
              <h3 style="color: #25D366; margin-bottom: 20px;">📱 Abrir WhatsApp</h3>
              <p style="margin-bottom: 20px;">Clique no botão abaixo para abrir o WhatsApp automaticamente:</p>
              <button onclick="window.open('${whatsappUrl}', '_blank')" style="
                background: #25D366;
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 25px;
                font-size: 16px;
                cursor: pointer;
                margin: 10px;
              ">🔗 Abrir WhatsApp</button>
              <button onclick="this.parentElement.parentElement.remove()" style="
                background: #666;
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 25px;
                font-size: 16px;
                cursor: pointer;
                margin: 10px;
              ">❌ Fechar</button>
              <p style="margin-top: 20px; font-size: 14px; color: #666;">
                Se não abrir automaticamente, copie este link:<br>
                <code style="background: #f5f5f5; padding: 5px; border-radius: 3px;">${whatsappUrl}</code>
              </p>
            </div>
          `;
          
          document.body.appendChild(modal);
          
          // Remover modal após 10 segundos
          setTimeout(() => {
            if (document.body.contains(modal)) {
              document.body.removeChild(modal);
            }
          }, 10000);
        }
        
        // Aguardar e verificar se abriu
        setTimeout(() => {
          console.log('✅ Verificação final: WhatsApp deve estar aberto');
        }, 2000);
        
        // Mostrar sucesso para o usuário
        setEnviado(true);
        
      } else {
        console.log('❌ Nenhum WhatsApp encontrado - usando número padrão');
        
        // Usar número padrão para teste (substitua pelo número real)
        const numeroPadrao = '5515991653601'; // Número do exemplo da imagem
        console.log('Usando número padrão:', numeroPadrao);
        
        // Formatar mensagem para WhatsApp
        const mensagem = `🛵 *NOVO AGENDAMENTO DE MANUTENÇÃO*

👤 *Nome:* ${form.nome}
📱 *Telefone:* ${form.telefone}
🏍️ *Placa:* ${form.placa}
🔧 *Tipo:* ${tipoLabel}
${form.data ? `📅 *Data:* ${form.data}` : ''}
${form.horario ? `⏰ *Horário:* ${form.horario}` : ''}
${form.obs ? `📝 *Observações:* ${form.obs}` : ''}

✅ *Agendamento solicitado com sucesso!*
📞 *Entre em contato para confirmar.*`;

        console.log('Mensagem formatada para WhatsApp:', mensagem);
        
        // Codificar mensagem para URL
        const mensagemCodificada = encodeURIComponent(mensagem);
        const whatsappUrl = `https://wa.me/${numeroPadrao}?text=${mensagemCodificada}`;
        
        console.log('URL do WhatsApp gerada:', whatsappUrl);
        console.log('🚀 Forçando abertura do WhatsApp...');
        
        // FORÇAR ABERTURA DO WHATSAPP
        try {
          // Método 1: Abrir em nova janela
          const newWindow = window.open(whatsappUrl, '_blank', 'width=600,height=700');
          
          if (newWindow) {
            console.log('✅ WhatsApp aberto em nova janela');
            newWindow.focus();
          } else {
            console.log('⚠️ Nova janela falhou, tentando nova aba');
            
            // Método 2: Abrir em nova aba
            const newTab = window.open(whatsappUrl, '_blank');
            
            if (newTab) {
              console.log('✅ WhatsApp aberto em nova aba');
            } else {
              console.log('⚠️ Nova aba falhou, tentando redirecionamento');
              
              // Método 3: Redirecionar
              window.location.href = whatsappUrl;
            }
          }
          
          // Mostrar sucesso
          setEnviado(true);
          
        } catch (error) {
          console.error('❌ Erro ao abrir WhatsApp:', error);
          
          // Fallback: mostrar modal com link
          const modal = document.createElement('div');
          modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.8);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 9999;
          `;
          
          modal.innerHTML = `
            <div style="
              background: white;
              padding: 30px;
              border-radius: 15px;
              max-width: 500px;
              text-align: center;
              box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            ">
              <h3 style="color: #25D366; margin-bottom: 20px;">📱 Abrir WhatsApp</h3>
              <p style="margin-bottom: 20px;">Clique no botão abaixo para abrir o WhatsApp:</p>
              <button onclick="window.open('${whatsappUrl}', '_blank')" style="
                background: #25D366;
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 25px;
                font-size: 16px;
                cursor: pointer;
                margin: 10px;
              ">🔗 Abrir WhatsApp</button>
              <button onclick="this.parentElement.parentElement.remove()" style="
                background: #666;
                color: white;
                border: none;
                padding: 15px 30px;
                border-radius: 25px;
                font-size: 16px;
                cursor: pointer;
                margin: 10px;
              ">❌ Fechar</button>
            </div>
          `;
          
          document.body.appendChild(modal);
          
          // Remover modal após 10 segundos
          setTimeout(() => {
            if (document.body.contains(modal)) {
              document.body.removeChild(modal);
            }
          }, 10000);
          
          setEnviado(true);
        }
        
        return;
      }
      
      // 7. FINALIZAR
      console.log('Agendamento processado com sucesso!');
      setEnviado(true);
      
    } catch (error) {
      console.error('Erro durante o processamento:', error);
      setErro(`Erro inesperado: ${error.message || 'Tente novamente.'}`);
    }
    
    console.log('=== FIM DO PROCESSAMENTO ===');
  }

  if (enviado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-violet-50">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-violet-700 mb-4">Solicitação enviada!</h2>
          <p className="mb-4">Seu pedido de agendamento foi enviado com sucesso. Aguarde o contato da equipe.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-violet-50">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-2xl font-bold text-violet-700 mb-4 flex items-center gap-2"><CalendarIcon className="w-6 h-6" /> Agendamento de manutenção</div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="nome">Seu Nome Completo <span className="text-red-500">*</span></Label>
            <Input id="nome" name="nome" required placeholder="Digite seu nome completo" value={form.nome} onChange={handleChange} />
          </div>
          <div>
            <Label htmlFor="telefone">Telefone para Contato (WhatsApp) <span className="text-red-500">*</span></Label>
            <div className="flex items-center gap-2">
              <span><PhoneIcon className="w-4 h-4 text-gray-400" /></span>
              <Input id="telefone" name="telefone" required placeholder="(XX) XXXXX-XXXX" value={form.telefone} onChange={handleChange} />
            </div>
          </div>
          <div>
            <Label htmlFor="placa">Placa da Moto <span className="text-red-500">*</span></Label>
            <div className="flex items-center gap-2">
              <span><BikeIcon className="w-4 h-4 text-gray-400" /></span>
              <Input id="placa" name="placa" required placeholder="ABC-1234 ou ABC1D23" value={form.placa} onChange={handleChange} />
            </div>
          </div>
          <div>
            <Label htmlFor="tipo">Tipo de Manutenção <span className="text-red-500">*</span></Label>
            <div className="flex items-center gap-2">
              <span><Wrench className="w-4 h-4 text-gray-400" /></span>
              <select id="tipo" name="tipo" required value={form.tipo} onChange={handleChange} className="w-full rounded border p-2 text-sm">
                <option value="">Selecione o tipo de serviço</option>
                {tipoManutencaoOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <Label htmlFor="data">Data Desejada <span className="text-red-500">*</span></Label>
            <div className="flex items-center gap-2">
              <span><CalendarDays className="w-4 h-4 text-gray-400" /></span>
              <Input id="data" name="data" type="date" required value={form.data} onChange={handleChange} />
            </div>
          </div>
          <div>
            <Label htmlFor="horario">Horário Desejado <span className="text-red-500">*</span></Label>
            <div className="flex items-center gap-2">
              <span><Clock className="w-4 h-4 text-gray-400" /></span>
              <Input id="horario" name="horario" type="time" required value={form.horario} onChange={handleChange} />
            </div>
          </div>
          <div>
            <Label htmlFor="obs">Observações (opcional)</Label>
            <div className="flex items-center gap-2">
              <span><MessageSquare className="w-4 h-4 text-gray-400" /></span>
              <textarea id="obs" name="obs" placeholder="Descreva o problema ou detalhes adicionais aqui..." className="w-full rounded border p-2 text-sm" value={form.obs} onChange={handleChange} />
            </div>
          </div>
          {erro && <div className="text-red-500 text-sm text-center">{erro}</div>}
          <div className="pt-2">
            <Button type="submit" className="w-full bg-gradient-to-r from-violet-500 to-blue-500 text-white text-lg font-semibold flex items-center justify-center gap-2 py-3">
              <span>Enviar Solicitação</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
} 