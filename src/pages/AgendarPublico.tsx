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
    
    try {
      console.log('Tentando enviar agendamento:', form);
      
      // Enviar para Supabase - versão simplificada para debug
      const agendamentoData: any = {
        nome: form.nome,
        telefone: form.telefone,
        placa: form.placa,
        tipo: form.tipo,
        status: "pendente",
        locatario_rg: ""
      };

      // Adicionar campos opcionais se existirem
      if (form.data) agendamentoData.data = form.data;
      if (form.horario) agendamentoData.horario = form.horario;
      if (form.obs) agendamentoData.obs = form.obs;

      console.log('Dados a serem enviados:', agendamentoData);
      
      const { data, error } = await supabase.from("agendamentos").insert([agendamentoData]);
      
      if (error) {
        console.error('Erro do Supabase:', error);
        setErro(`Erro ao enviar solicitação: ${error.message || 'Tente novamente.'}`);
        return;
      }
      
      console.log('Agendamento enviado com sucesso:', data);
      
      // Buscar o WhatsApp do admin para redirecionar
      const { data: adminData } = await supabase
        .from('user_profiles')
        .select('whatsapp')
        .eq('email', 'kauankg@hotmail.com')
        .single();
      
      if (adminData?.whatsapp) {
        // Formatar mensagem para WhatsApp
        const mensagem = `Olá! Recebi uma nova solicitação de agendamento:

Nome: ${form.nome}
Telefone: ${form.telefone}
Placa: ${form.placa}
Tipo: ${tipoManutencaoOptions.find(opt => opt.value === form.tipo)?.label}
Data: ${form.data}
Horário: ${form.horario}
${form.obs ? `Observações: ${form.obs}` : ''}

Por favor, entre em contato para confirmar o agendamento.`;

        // Codificar a mensagem para URL
        const mensagemCodificada = encodeURIComponent(mensagem);
        const whatsappUrl = `https://wa.me/55${adminData.whatsapp}?text=${mensagemCodificada}`;
        
        // Abrir WhatsApp
        window.open(whatsappUrl, '_blank');
      }
      
      setEnviado(true);
    } catch (error) {
      console.error('Erro inesperado:', error);
      setErro(`Erro inesperado: ${error.message || 'Tente novamente.'}`);
    }
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