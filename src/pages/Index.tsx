import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { checklistSections } from "@/data/checklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalendarIcon, BikeIcon, UserIcon, HashIcon, ClipboardListIcon, PlusIcon, CheckCircle2, Edit2, Trash2, Fingerprint, ClipboardCopy, Wrench, CalendarDays, Clock, MessageSquare, PhoneIcon, Download } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import SignaturePad from "@/components/SignaturePad";
import PhotoCapture from "@/components/PhotoCapture";
import PhotoSection from "@/components/PhotoSection";
import InstallPrompt from "@/components/InstallPrompt";
import { supabase } from "@/integrations/supabase/client";
import { canInstallPWA, wasInstallPromptShown, markInstallPromptShown, markInstallPromptDismissed } from "@/utils/pwa";
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const TABS = [
  { key: "checklist", label: "Checklist", icon: <ClipboardListIcon className="w-5 h-5" /> },
  { key: "locatarios", label: "Locatários", icon: <UserIcon className="w-5 h-5" /> },
  { key: "motos", label: "Motos", icon: <BikeIcon className="w-5 h-5" /> },
];

const mockLocatarios = [
  {
    nome: "Alessandro De Souza Velozo",
    rg: "563105057",
    telefone: "(11) 973922036",
    selecionado: true,
  },
  {
    nome: "Maison Henrique",
    rg: "632886997",
    telefone: "(11) 999999999",
    selecionado: false,
  },
];

type Moto = {
  locatarioRg: string;
  modelo: string;
  placa: string;
  cor: string;
  ano: string;
  km: string;
  chassi: string;
  motor: string;
  obs: string;
};

// Tipo para motos no UI (com id e campos extras não persistidos)
type UIMoto = {
  id: string;
  locatarioRg?: string; // Apenas no UI (não persistido)
  modelo: string;
  placa: string;
  cor: string;
  ano?: string;        // Apenas no UI (não persistido)
  km: string;
  chassi: string;
  motor: string;
  obs?: string;        // Apenas no UI (não persistido)
};

// Tipo para criação/edição (sem id)
type NewMoto = Omit<UIMoto, 'id'>;

type UILocatario = {
  id: string;
  nome: string;
  rg: string;
  telefone: string | null;
  selecionado?: boolean;
};

const tipoManutencaoOptions = [
  { value: "corretiva", label: "Corretiva" },
  { value: "preventiva", label: "Preventiva" },
  { value: "troca_oleo", label: "Troca de Óleo" },
];

// Hook personalizado para mostrar prompt de instalação PWA
const usePWAPrompt = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const checkPWAPrompt = () => {
      console.log('Checking PWA prompt conditions...');
      
      // Usar as funções utilitárias do pwa.ts
      const canInstall = canInstallPWA();
      const wasShown = wasInstallPromptShown();
      
      console.log('PWA Prompt Check:', {
        canInstall,
        wasShown,
        willShow: canInstall && !wasShown
      });

      // Mostrar prompt apenas se pode instalar e ainda não foi mostrado
      if (canInstall && !wasShown) {
        setTimeout(() => {
          console.log('Showing PWA install prompt');
          setShowPrompt(true);
          markInstallPromptShown();
        }, 3000); // Aguardar 3 segundos
      }
    };

    checkPWAPrompt();
  }, []);

  const hidePrompt = () => {
    console.log('Hiding PWA prompt');
    setShowPrompt(false);
    markInstallPromptDismissed();
  };

  return { showPrompt, hidePrompt };
};

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [activeTab, setActiveTab] = useState("checklist");
  const [showForm, setShowForm] = useState(false);
  const [locatarios, setLocatarios] = useState<UILocatario[]>([]);
  const [novoLoc, setNovoLoc] = useState({ nome: "", rg: "", telefone: "" });
  const [formState, setFormState] = useState<Record<string, string>>({});
  // Função para obter a data atual no formato YYYY-MM-DD
  const getDataAtual = () => {
    const hoje = new Date();
    const ano = hoje.getFullYear();
    const mes = String(hoje.getMonth() + 1).padStart(2, '0');
    const dia = String(hoje.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  };

  const [clientData, setClientData] = useState({
    modelo: "",
    placa: "",
    cor: "",
    km: "",
    kmAtual: "",
    chassi: "",
    motor: "",
    cliente: "",
    rg: "",
    data: getDataAtual(), // Data atual no formato YYYY-MM-DD
  });
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [showMotoForm, setShowMotoForm] = useState(false);
  const [motos, setMotos] = useState<UIMoto[]>([]);
  const [novaMoto, setNovaMoto] = useState<NewMoto>({
    locatarioRg: "",
    modelo: "",
    placa: "",
    cor: "",
    ano: "",
    km: "",
    chassi: "",
    motor: "",
    obs: "",
  });
  const [editMotoIdx, setEditMotoIdx] = useState<number | null>(null);

  // Agendamento removido conforme solicitado

  const [vistoriadorSignature, setVistoriadorSignature] = useState("");
  const [locatarioSignature, setLocatarioSignature] = useState("");
  const [fotosGeraisFrontal, setFotosGeraisFrontal] = useState<string[]>([]);
  const [fotosGeraisTraseira, setFotosGeraisTraseira] = useState<string[]>([]);
  const [fotosGeraisLateralEsquerda, setFotosGeraisLateralEsquerda] = useState<string[]>([]);
  const [fotosGeraisLateralDireita, setFotosGeraisLateralDireita] = useState<string[]>([]);
  const [fotosPneuDianteiro, setFotosPneuDianteiro] = useState<string[]>([]);
  const [fotosPneuTraseiro, setFotosPneuTraseiro] = useState<string[]>([]);
  const [fotosFreios, setFotosFreios] = useState<string[]>([]);
  const [fotosFarolDianteiro, setFotosFarolDianteiro] = useState<string[]>([]);
  const [fotosLanternaTraseira, setFotosLanternaTraseira] = useState<string[]>([]);
  const [fotosSistemaSetas, setFotosSistemaSetas] = useState<string[]>([]);
  const [fotosSistemaBuzina, setFotosSistemaBuzina] = useState<string[]>([]);
  const [fotosMotor, setFotosMotor] = useState<string[]>([]);
  const [fotosTransmissao, setFotosTransmissao] = useState<string[]>([]);
  const [fotosSuspensaoDianteira, setFotosSuspensaoDianteira] = useState<string[]>([]);
  const [fotosSuspensaoTraseira, setFotosSuspensaoTraseira] = useState<string[]>([]);
  const [fotosCarroceria, setFotosCarroceria] = useState<string[]>([]);
  const [fotosObservacoesFinais, setFotosObservacoesFinais] = useState<string[]>([]);
  const [fotosKmAtual, setFotosKmAtual] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const pwa = usePWAPrompt();

  useEffect(() => {
    checkAuth();
  }, []);

  // Verificar permissões de admin via RPC segura, evitando piscar
  useEffect(() => {
    let active = true;

    const checkAdmin = async () => {
      setIsCheckingAdmin(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (active) {
          setIsAdmin(false);
          setIsCheckingAdmin(false);
        }
        return;
      }
      const { data, error } = await supabase.rpc('is_admin');
      if (active) {
        setIsAdmin(Boolean(data) && !error);
        setIsCheckingAdmin(false);
      }
    };

    checkAdmin();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      // Evitar chamadas diretas dentro do callback
      setTimeout(() => {
        checkAdmin();
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  // Definir data atual sempre que o componente for montado
  useEffect(() => {
    const dataAtual = getDataAtual();
    setClientData(prev => ({
      ...prev,
      data: dataAtual
    }));
  }, []);

  // Agendamento removido

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    console.log('✅ Usuário autenticado:', user.email);

    // Para o admin, pular verificação de perfil
    if (user.email === 'kauankg@hotmail.com') {
      console.log('👑 Admin detectado - acesso liberado sem verificação de perfil');
      setUser(user);
      setUserProfile({
        user_id: user.id,
        name: 'Admin Geral',
        email: 'kauankg@hotmail.com',
        phone: '(11) 99999-9999',
        company_name: 'CheckSystem',
        is_approved: true,
        is_frozen: false
      });
      setLoading(false);
      return;
    }

    // Para usuários normais, verificar perfil
    console.log('👤 Verificando perfil de usuário normal...');
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error || !profile) {
      console.log('❌ Usuário sem perfil encontrado, redirecionando para login');
      await supabase.auth.signOut();
      navigate('/login');
      return;
    }

    // Verificar se o usuário está aprovado
    if (!profile.is_approved) {
      console.log('⏳ Usuário não aprovado, redirecionando para login');
      await supabase.auth.signOut();
      navigate('/login');
      return;
    }

    // Verificar se o usuário está congelado
    if (profile.is_frozen) {
      console.log('🧊 Usuário congelado, redirecionando para login');
      await supabase.auth.signOut();
      navigate('/login');
      return;
    }

    console.log('✅ Usuário normal verificado e aprovado');
    setUser(user);
    setUserProfile(profile);
    setLoading(false);
  };

  // Carregar locatários do Supabase para o usuário logado
  const loadLocatarios = async () => {
    const { data, error } = await supabase
      .from('locatarios')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao carregar locatários:', error);
      return;
    }
    setLocatarios(
      data.map((d) => ({
        id: d.id,
        nome: d.nome_completo,
        rg: d.rg,
        telefone: d.telefone,
        selecionado: false,
      }))
    );
  };

  useEffect(() => {
    if (user) {
      loadLocatarios();
    }
  }, [user]);

  // Carregar motos do Supabase
  const loadMotos = async () => {
    const { data, error } = await supabase
      .from('motos')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Erro ao carregar motos:', error);
      return;
    }
    setMotos(
      data.map((d) => ({
        id: d.id,
        modelo: d.modelo,
        placa: d.placa,
        cor: d.cor,
        km: d.km_total !== null && d.km_total !== undefined ? String(d.km_total) : "",
        chassi: d.numero_chassi || "",
        motor: d.numero_motor || "",
        locatarioRg: "",
        ano: "",
        obs: "",
      }))
    );
  };

  useEffect(() => {
    if (user) {
      loadMotos();
    }
  }, [user]);

  const handleStateChange = (id: string, value: string) => {
    setFormState((prevState) => ({ ...prevState, [id]: value }));
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientData({ ...clientData, [e.target.name]: e.target.value });
  };

  function handleNovoLocChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNovoLoc({ ...novoLoc, [e.target.name]: e.target.value });
  }
  async function handleCadastrarLocatario(e: React.FormEvent) {
    e.preventDefault();
    if (!novoLoc.nome || !novoLoc.rg || !novoLoc.telefone || !user) return;

    const { data, error } = await supabase
      .from('locatarios')
      .insert({
        nome_completo: novoLoc.nome,
        rg: novoLoc.rg,
        telefone: novoLoc.telefone,
        user_id: user.id,
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Erro ao cadastrar locatário:', error);
      return;
    }

    setLocatarios([
      { id: data.id, nome: data.nome_completo, rg: data.rg, telefone: data.telefone, selecionado: false },
      ...locatarios,
    ]);
    setNovoLoc({ nome: "", rg: "", telefone: "" });
    setShowForm(false);
  }
  function handleCancelarForm() {
    setNovoLoc({ nome: "", rg: "", telefone: "" });
    setShowForm(false);
  }

  async function handleExcluirLocatario(idx: number) {
    const id = locatarios[idx]?.id;
    if (!id) return;

    const { error } = await supabase.from('locatarios').delete().eq('id', id);
    if (error) {
      console.error('Erro ao excluir locatário:', error);
      return;
    }

    setLocatarios(locatarios.filter((_, i) => i !== idx));
    if (editIdx === idx) {
      setEditIdx(null);
      setShowForm(false);
    }
  }

  function handleEditarLocatario(idx: number) {
    setEditIdx(idx);
    setNovoLoc({
      nome: locatarios[idx].nome,
      rg: locatarios[idx].rg,
      telefone: locatarios[idx].telefone,
    });
    setShowForm(true);
  }

  async function handleSalvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (editIdx === null) return;
    const current = locatarios[editIdx];
    if (!current?.id) return;

    const { data, error } = await supabase
      .from('locatarios')
      .update({
        nome_completo: novoLoc.nome,
        rg: novoLoc.rg,
        telefone: novoLoc.telefone,
      })
      .eq('id', current.id)
      .select('*')
      .single();

    if (error || !data) {
      console.error('Erro ao salvar edição do locatário:', error);
      return;
    }

    const novos = [...locatarios];
    novos[editIdx] = { ...novos[editIdx], nome: data.nome_completo, rg: data.rg, telefone: data.telefone };
    setLocatarios(novos);
    setEditIdx(null);
    setNovoLoc({ nome: "", rg: "", telefone: "" });
    setShowForm(false);
  }

  function handleSelecionarVistoria(idx: number) {
    // Selecionar o locatário e preencher dados automaticamente
    setLocatarios(locatarios.map((loc, i) => ({ ...loc, selecionado: i === idx })));
    
    // Preencher dados do checklist
    const loc = locatarios[idx];
    const dataAtual = getDataAtual(); // Data atual
    
    setClientData((prev) => ({
      ...prev,
      cliente: loc.nome,
      rg: loc.rg,
      data: dataAtual, // Sempre usar a data atual
    }));
    
    // Buscar moto vinculada
    const moto = motos.find((m) => m.locatarioRg === loc.rg);
    if (moto) {
      setClientData((prev) => ({
        ...prev,
        modelo: moto.modelo,
        placa: moto.placa,
        cor: moto.cor,
        km: moto.km,
        chassi: moto.chassi,
        motor: moto.motor,
      }));
    }
    
    // Trocar para a aba de checklist
    setActiveTab("checklist");
  }

  function handleNovaMotoChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setNovaMoto({ ...novaMoto, [e.target.name]: e.target.value });
  }
  async function handleCadastrarMoto(e: React.FormEvent) {
    e.preventDefault();
    if (!novaMoto.locatarioRg || !novaMoto.modelo || !novaMoto.placa || !novaMoto.cor || !novaMoto.km || !novaMoto.chassi || !novaMoto.motor || !user) return;

    const kmNumber = Number(novaMoto.km);

    const { data, error } = await supabase
      .from('motos')
      .insert({
        user_id: user.id,
        modelo: novaMoto.modelo,
        placa: novaMoto.placa,
        cor: novaMoto.cor,
        km_total: isNaN(kmNumber) ? null : kmNumber,
        numero_chassi: novaMoto.chassi,
        numero_motor: novaMoto.motor,
      })
      .select('*')
      .single();

    if (error || !data) {
      console.error('Erro ao cadastrar moto:', error);
      return;
    }

    setMotos([
      { id: data.id, modelo: data.modelo, placa: data.placa, cor: data.cor, km: data.km_total !== null && data.km_total !== undefined ? String(data.km_total) : "", chassi: data.numero_chassi || "", motor: data.numero_motor || "", locatarioRg: novaMoto.locatarioRg, ano: novaMoto.ano, obs: novaMoto.obs },
      ...motos,
    ]);
    setNovaMoto({ locatarioRg: "", modelo: "", placa: "", cor: "", ano: "", km: "", chassi: "", motor: "", obs: "" });
    setShowMotoForm(false);
  }
  function handleCancelarMoto() {
    setNovaMoto({ locatarioRg: "", modelo: "", placa: "", cor: "", ano: "", km: "", chassi: "", motor: "", obs: "" });
    setShowMotoForm(false);
  }

  async function handleExcluirMoto(idx: number) {
    const id = motos[idx]?.id;
    if (!id) return;

    const { error } = await supabase.from('motos').delete().eq('id', id);
    if (error) {
      console.error('Erro ao excluir moto:', error);
      return;
    }

    setMotos(motos.filter((_, i) => i !== idx));
  }

  function handleEditarMoto(idx: number) {
    setShowMotoForm(true);
    const moto = motos[idx];
    setNovaMoto({
      locatarioRg: moto.locatarioRg || "",
      modelo: moto.modelo || "",
      placa: moto.placa || "",
      cor: moto.cor || "",
      ano: moto.ano || "",
      km: moto.km || "",
      chassi: moto.chassi || "",
      motor: moto.motor || "",
      obs: moto.obs || "",
    });
    setEditMotoIdx(idx);
  }

  async function handleSalvarEdicaoMoto(e: React.FormEvent) {
    e.preventDefault();
    if (editMotoIdx === null) return;

    const current = motos[editMotoIdx];
    if (!current?.id) return;

    const kmNumber = Number(novaMoto.km);

    const { data, error } = await supabase
      .from('motos')
      .update({
        modelo: novaMoto.modelo,
        placa: novaMoto.placa,
        cor: novaMoto.cor,
        km_total: isNaN(kmNumber) ? null : kmNumber,
        numero_chassi: novaMoto.chassi,
        numero_motor: novaMoto.motor,
      })
      .eq('id', current.id)
      .select('*')
      .single();

    if (error || !data) {
      console.error('Erro ao salvar edição da moto:', error);
      return;
    }

    const novas = [...motos];
    novas[editMotoIdx] = {
      ...novas[editMotoIdx],
      modelo: data.modelo,
      placa: data.placa,
      cor: data.cor,
      km: data.km_total !== null && data.km_total !== undefined ? String(data.km_total) : "",
      chassi: data.numero_chassi || "",
      motor: data.numero_motor || "",
      locatarioRg: novaMoto.locatarioRg,
      ano: novaMoto.ano,
      obs: novaMoto.obs,
    };
    setMotos(novas);
    setEditMotoIdx(null);
    setNovaMoto({ locatarioRg: "", modelo: "", placa: "", cor: "", ano: "", km: "", chassi: "", motor: "", obs: "" });
    setShowMotoForm(false);
  }

  // Funções de agendamento removidas completamente

  // Função para gerar link público único
  function handleGerarLinkPublico() {
    const url = `${window.location.origin}/agendar-publico`;
    // Copia o link para a área de transferência
    navigator.clipboard.writeText(url).then(() => {
      // Mostra uma mensagem de confirmação (opcional)
      alert('Link copiado para a área de transferência!');
    }).catch(err => {
      console.error('Erro ao copiar link:', err);
      alert('Erro ao copiar link. Tente novamente.');
    });
  }

  const isFormValid = () => {
    const totalItems = checklistSections.flatMap((section) => section.items).length;
    return Object.keys(formState).length === totalItems;
  };

  // Função utilitária para radio group com caixinhas coloridas
  const RadioGroupCond = ({ name }: { name: string }) => (
    <div className="grid grid-cols-3 gap-3 mb-3">
      <label className="relative cursor-pointer group">
        <input 
          type="radio" 
          name={name} 
          value="bom"
          checked={formState[name] === 'bom'}
          onChange={() => handleStateChange(name, 'bom')}
          className="sr-only peer" 
        />
        <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-transparent bg-gradient-to-br from-green-50 to-emerald-50 peer-checked:border-green-300 peer-checked:bg-gradient-to-br peer-checked:from-green-100 peer-checked:to-emerald-100 hover:from-green-100 hover:to-emerald-100 transition-all duration-200 shadow-sm hover:shadow-md">
          <span className="text-sm font-medium text-green-700">Bom</span>
        </div>
      </label>
      
      <label className="relative cursor-pointer group">
        <input 
          type="radio" 
          name={name} 
          value="regular"
          checked={formState[name] === 'regular'}
          onChange={() => handleStateChange(name, 'regular')}
          className="sr-only peer" 
        />
        <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-transparent bg-gradient-to-br from-yellow-50 to-amber-50 peer-checked:border-yellow-300 peer-checked:bg-gradient-to-br peer-checked:from-yellow-100 peer-checked:to-amber-100 hover:from-yellow-100 hover:to-amber-100 transition-all duration-200 shadow-sm hover:shadow-md">
          <span className="text-sm font-medium text-yellow-700">Regular</span>
        </div>
      </label>
      
      <label className="relative cursor-pointer group">
        <input 
          type="radio" 
          name={name} 
          value="necessita_troca"
          checked={formState[name] === 'necessita_troca'}
          onChange={() => handleStateChange(name, 'necessita_troca')}
          className="sr-only peer" 
        />
        <div className="flex flex-col items-center justify-center p-4 rounded-xl border-2 border-transparent bg-gradient-to-br from-red-50 to-pink-50 peer-checked:border-red-300 peer-checked:bg-gradient-to-br peer-checked:from-red-100 peer-checked:to-pink-100 hover:from-red-100 hover:to-pink-100 transition-all duration-200 shadow-sm hover:shadow-md">
          <span className="text-sm font-medium text-red-700">Necessita Troca</span>
        </div>
      </label>
    </div>
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  // Funções para gerenciar fotos
  const handlePhotoCapture = (photoData: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    console.log('=== handlePhotoCapture chamado ===');
    console.log('Tamanho da foto:', photoData.length);
    console.log('Primeiros 100 caracteres da foto:', photoData.substring(0, 100));
    console.log('Setter recebido:', setter);
    
    setter(prev => {
      const newPhotos = [...prev, photoData];
      console.log('Novo array de fotos criado, total:', newPhotos.length);
      console.log('Fotos anteriores:', prev.length);
      console.log('Nova foto adicionada com sucesso');
      return newPhotos;
    });
  };

  const handlePhotoSelect = (photoData: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    console.log('=== handlePhotoSelect chamado ===');
    console.log('Tamanho da foto da galeria:', photoData.length);
    console.log('Primeiros 100 caracteres da foto:', photoData.substring(0, 100));
    
    setter(prev => {
      const newPhotos = [...prev, photoData];
      console.log('Nova foto da galeria adicionada, total:', newPhotos.length);
      return newPhotos;
    });
  };

  const handlePhotoDelete = (index: number, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    console.log('=== handlePhotoDelete chamado ===');
    console.log('Índice da foto a ser deletada:', index);
    
    setter(prev => {
      const newPhotos = prev.filter((_, i) => i !== index);
      console.log('Foto deletada, novo total:', newPhotos.length);
      return newPhotos;
    });
  };

  // Função para gerar PDF do checklist otimizada
  const handleGeneratePDF = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Criar PDF diretamente sem html2canvas para melhor qualidade
      const pdf = new jsPDF('p', 'mm', 'a4');
      let yPosition = 20;
      const pageWidth = 210;
      const pageHeight = 297;
      const margin = 15;
      const contentWidth = pageWidth - (2 * margin);
      
      // Função para adicionar uma nova página se necessário
      const checkNewPage = (neededHeight: number) => {
        if (yPosition + neededHeight > pageHeight - margin) {
          pdf.addPage();
          yPosition = 20;
        }
      };
      
      // Função para quebrar texto
      const splitText = (text: string, maxWidth: number, fontSize: number) => {
        pdf.setFontSize(fontSize);
        return pdf.splitTextToSize(text, maxWidth);
      };

      // Cabeçalho da empresa
      const companyName = userProfile?.company_name || 'CheckSystem';
      
      // Logo da empresa (se existir)
      if (userProfile?.company_logo) {
        try {
          checkNewPage(50);
          
          // Criar uma imagem temporária para obter dimensões reais
          const img = new Image();
          img.src = userProfile.company_logo;
          
          await new Promise((resolve, reject) => {
            img.onload = () => {
              const maxWidth = 80;
              const maxHeight = 40;
              
              // Calcular proporções mantendo aspect ratio
              let logoWidth = img.width;
              let logoHeight = img.height;
              
              if (logoWidth > maxWidth) {
                logoHeight = (logoHeight * maxWidth) / logoWidth;
                logoWidth = maxWidth;
              }
              
              if (logoHeight > maxHeight) {
                logoWidth = (logoWidth * maxHeight) / logoHeight;
                logoHeight = maxHeight;
              }
              
              // Centralizar logo
              const logoX = (pageWidth - logoWidth) / 2;
              
              pdf.addImage(userProfile.company_logo, 'JPEG', logoX, yPosition, logoWidth, logoHeight);
              yPosition += logoHeight + 10;
              resolve(null);
            };
            
            img.onerror = () => {
              console.warn('Erro ao carregar logo');
              reject();
            };
          }).catch(() => {
            // Fallback sem logo
            console.warn('Logo não pôde ser carregada');
          });
        } catch (error) {
          console.warn('Erro ao adicionar logo:', error);
        }
      }
      
      // Título da empresa
      pdf.setFillColor(124, 58, 237);
      pdf.rect(margin, yPosition, contentWidth, 15, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(20);
      pdf.setFont(undefined, 'bold');
      pdf.text(companyName, pageWidth / 2, yPosition + 10, { align: 'center' });
      yPosition += 20;
      
      // Subtítulo
      pdf.setTextColor(100, 100, 100);
      pdf.setFontSize(12);
      pdf.setFont(undefined, 'normal');
      pdf.text('Relatório de Vistoria de Motocicleta', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Reset cor do texto
      pdf.setTextColor(0, 0, 0);

      // Dados da moto e cliente
      checkNewPage(50);
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, yPosition, contentWidth, 8, 'F');
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Dados da Moto e Cliente', margin + 2, yPosition + 6);
      yPosition += 12;

      const clientInfo = [
        ['Modelo:', clientData.modelo || 'Não informado', 'Placa:', clientData.placa || 'Não informado'],
        ['Cor:', clientData.cor || 'Não informado', 'KM:', clientData.km || 'Não informado'],
        ['KM Atual:', clientData.kmAtual || 'Não informado', 'Chassi:', clientData.chassi || 'Não informado'],
        ['Motor:', clientData.motor || 'Não informado', 'Cliente:', clientData.cliente || 'Não informado'],
        ['RG:', clientData.rg || 'Não informado', 'Data da Vistoria:', clientData.data || 'Não informado']
      ];

      pdf.setFontSize(10);
      clientInfo.forEach((row, index) => {
        checkNewPage(8);
        const bgColor = index % 2 === 0 ? [248, 250, 252] as const : [255, 255, 255] as const;
        pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        pdf.rect(margin, yPosition, contentWidth, 6, 'F');
        
        pdf.setFont(undefined, 'bold');
        pdf.text(row[0], margin + 2, yPosition + 4);
        pdf.setFont(undefined, 'normal');
        pdf.text(row[1], margin + 45, yPosition + 4);
        pdf.setFont(undefined, 'bold');
        pdf.text(row[2], margin + 105, yPosition + 4);
        pdf.setFont(undefined, 'normal');
        pdf.text(row[3], margin + 145, yPosition + 4);
        yPosition += 6;
      });
      yPosition += 5;

      // Função para obter o valor selecionado de um radio group
      const getSelectedValue = (name: string) => {
        const selected = document.querySelector(`input[name="${name}"]:checked`) as HTMLInputElement;
        if (!selected) return 'Não verificado';
        
        switch (selected.value) {
          case 'bom': return 'Bom';
          case 'regular': return 'Regular';
          case 'necessita_troca': return 'Necessita Troca';
          default: return 'Não informado';
        }
      };

      // Função para obter observações
      const getObservation = (selector: string) => {
        const textarea = document.querySelector(selector) as HTMLTextAreaElement;
        return textarea?.value?.trim() || 'Nenhuma observação';
      };

      // Checklist de condições
      checkNewPage(15);
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, yPosition, contentWidth, 8, 'F');
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Checklist de Condições', margin + 2, yPosition + 6);
      yPosition += 12;

      const checklistItems = [
        { name: 'pneu_dianteiro', label: 'Pneu Dianteiro', observation: getObservation('textarea[placeholder*="pneu dianteiro"]') },
        { name: 'pneu_traseiro', label: 'Pneu Traseiro', observation: getObservation('textarea[placeholder*="pneu traseiro"]') },
        { name: 'freio', label: 'Sistema de Freio', observation: getObservation('textarea[placeholder*="sistema de freio"]') },
        { name: 'farol', label: 'Farol Dianteiro', observation: getObservation('textarea[placeholder*="farol dianteiro"]') },
        { name: 'lanterna', label: 'Lanterna Traseira', observation: getObservation('textarea[placeholder*="lanterna traseira"]') },
        { name: 'setas', label: 'Sistema de Setas', observation: getObservation('textarea[placeholder*="sistema de setas"]') },
        { name: 'bateria', label: 'Bateria', observation: getObservation('textarea[placeholder*="bateria"]') },
        { name: 'mecanica_motor', label: 'Motor', observation: getObservation('textarea[placeholder*="motor"]') },
        { name: 'mecanica_transmissao', label: 'Transmissão', observation: getObservation('textarea[placeholder*="transmissão"]') },
        { name: 'suspensao_dianteira', label: 'Suspensão Dianteira', observation: getObservation('textarea[placeholder*="suspensão dianteira"]') },
        { name: 'suspensao_traseira', label: 'Suspensão Traseira', observation: getObservation('textarea[placeholder*="suspensão traseira"]') },
        { name: 'carroceria_tanque_banco', label: 'Tanque e Banco', observation: getObservation('textarea[placeholder*="tanque e banco"]') }
      ];

      // Cabeçalho da tabela
      checkNewPage(8);
      pdf.setFillColor(124, 58, 237);
      pdf.rect(margin, yPosition, contentWidth, 6, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(10);
      pdf.setFont(undefined, 'bold');
      pdf.text('Item', margin + 2, yPosition + 4);
      pdf.text('Condição', margin + 70, yPosition + 4);
      pdf.text('Observação', margin + 110, yPosition + 4);
      yPosition += 6;

      pdf.setTextColor(0, 0, 0);
      checklistItems.forEach((item, index) => {
        checkNewPage(8);
        const condition = getSelectedValue(item.name);
        const bgColor = index % 2 === 0 ? [248, 250, 252] as const : [255, 255, 255] as const;
        pdf.setFillColor(bgColor[0], bgColor[1], bgColor[2]);
        pdf.rect(margin, yPosition, contentWidth, 6, 'F');
        
        pdf.setFont(undefined, 'bold');
        pdf.setFontSize(9);
        pdf.text(item.label, margin + 2, yPosition + 4);
        
        // Cor da condição baseada no status
        if (condition === 'Bom') pdf.setTextColor(34, 197, 94);
        else if (condition === 'Regular') pdf.setTextColor(234, 179, 8);
        else if (condition === 'Necessita Troca') pdf.setTextColor(239, 68, 68);
        else pdf.setTextColor(107, 114, 128);
        
        pdf.setFont(undefined, 'bold');
        pdf.text(condition, margin + 70, yPosition + 4);
        
        pdf.setTextColor(0, 0, 0);
        pdf.setFont(undefined, 'normal');
        const obsText = splitText(item.observation, 85, 8);
        pdf.setFontSize(8);
        pdf.text(obsText[0] || 'Nenhuma observação', margin + 110, yPosition + 4);
        yPosition += 6;
      });
      yPosition += 10;

      // Função para adicionar fotos de forma otimizada
      const addPhotoSection = (title: string, photos: string[]) => {
        if (photos.length === 0) return;
        
        checkNewPage(15);
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, yPosition, contentWidth, 6, 'F');
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(124, 58, 237);
        pdf.text(`${title} (${photos.length} foto${photos.length > 1 ? 's' : ''})`, margin + 2, yPosition + 4);
        pdf.setTextColor(0, 0, 0);
        yPosition += 10;

        const photosPerRow = 3;
        const photoWidth = (contentWidth - 10) / photosPerRow;
        const photoHeight = photoWidth * 0.75;
        
        photos.forEach((photo, index) => {
          const col = index % photosPerRow;
          const row = Math.floor(index / photosPerRow);
          
          if (col === 0) {
            checkNewPage(photoHeight + 10);
          }
          
          const x = margin + (col * (photoWidth + 5));
          const y = yPosition + (row * (photoHeight + 8));
          
          try {
            pdf.addImage(photo, 'JPEG', x, y, photoWidth, photoHeight);
          } catch (error) {
            console.warn(`Erro ao adicionar foto ${index + 1}:`, error);
            // Placeholder para foto com erro
            pdf.setFillColor(240, 240, 240);
            pdf.rect(x, y, photoWidth, photoHeight, 'F');
            pdf.setTextColor(107, 114, 128);
            pdf.setFontSize(8);
            pdf.text('Erro ao carregar foto', x + photoWidth/2, y + photoHeight/2, { align: 'center' });
            pdf.setTextColor(0, 0, 0);
          }
          
          if ((index + 1) % photosPerRow === 0 || index === photos.length - 1) {
            yPosition = y + photoHeight + 5;
          }
        });
        yPosition += 5;
      };

      // Seções de fotos
      checkNewPage(15);
      pdf.setFillColor(124, 58, 237);
      pdf.rect(margin, yPosition, contentWidth, 8, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.text('Fotos da Vistoria', margin + 2, yPosition + 6);
      pdf.setTextColor(0, 0, 0);
      yPosition += 12;

      addPhotoSection('KM Atual', fotosKmAtual);
      addPhotoSection('Fotos Gerais - Frontal', fotosGeraisFrontal);
      addPhotoSection('Fotos Gerais - Traseira', fotosGeraisTraseira);
      addPhotoSection('Fotos Gerais - Lateral Esquerda', fotosGeraisLateralEsquerda);
      addPhotoSection('Fotos Gerais - Lateral Direita', fotosGeraisLateralDireita);
      addPhotoSection('Pneu Dianteiro', fotosPneuDianteiro);
      addPhotoSection('Pneu Traseiro', fotosPneuTraseiro);
      addPhotoSection('Freios', fotosFreios);
      addPhotoSection('Farol Dianteiro', fotosFarolDianteiro);
      addPhotoSection('Lanterna Traseira', fotosLanternaTraseira);
      addPhotoSection('Sistema de Setas', fotosSistemaSetas);
      addPhotoSection('Sistema de Buzina', fotosSistemaBuzina);
      addPhotoSection('Motor', fotosMotor);
      addPhotoSection('Transmissão', fotosTransmissao);
      addPhotoSection('Suspensão Dianteira', fotosSuspensaoDianteira);
      addPhotoSection('Suspensão Traseira', fotosSuspensaoTraseira);
      addPhotoSection('Carroceria', fotosCarroceria);
      addPhotoSection('Observações Finais', fotosObservacoesFinais);

      // Observações finais
      const observacoes = document.querySelector('textarea[placeholder*="observações finais"]') as HTMLTextAreaElement;
      if (observacoes && observacoes.value.trim()) {
        checkNewPage(20);
        pdf.setFillColor(248, 250, 252);
        pdf.rect(margin, yPosition, contentWidth, 6, 'F');
        pdf.setFontSize(12);
        pdf.setFont(undefined, 'bold');
        pdf.setTextColor(124, 58, 237);
        pdf.text('Observações Finais', margin + 2, yPosition + 4);
        pdf.setTextColor(0, 0, 0);
        yPosition += 10;
        
        const obsText = splitText(observacoes.value, contentWidth - 10, 10);
        pdf.setFontSize(10);
        pdf.setFont(undefined, 'normal');
        obsText.forEach((line: string) => {
          checkNewPage(6);
          pdf.text(line, margin + 5, yPosition);
          yPosition += 5;
        });
        yPosition += 5;
      }

      // Assinaturas
      checkNewPage(60);
      pdf.setFillColor(248, 250, 252);
      pdf.rect(margin, yPosition, contentWidth, 8, 'F');
      pdf.setFontSize(14);
      pdf.setFont(undefined, 'bold');
      pdf.setTextColor(124, 58, 237);
      pdf.text('Assinaturas', margin + 2, yPosition + 6);
      pdf.setTextColor(0, 0, 0);
      yPosition += 15;

      const signatureWidth = (contentWidth - 20) / 2;
      const signatureHeight = 40;

      // Assinatura do Vistoriador
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(12);
      pdf.text('Assinatura do Vistoriador', margin + 2, yPosition);
      yPosition += 8;
      
      // Borda mais definida para área de assinatura
      pdf.setDrawColor(124, 58, 237);
      pdf.setLineWidth(0.5);
      pdf.rect(margin, yPosition, signatureWidth, signatureHeight);
      
      if (vistoriadorSignature) {
        try {
          pdf.addImage(vistoriadorSignature, 'PNG', margin + 2, yPosition + 2, signatureWidth - 4, signatureHeight - 4);
        } catch (error) {
          console.warn('Erro ao adicionar assinatura do vistoriador:', error);
          pdf.setFillColor(250, 250, 250);
          pdf.rect(margin + 2, yPosition + 2, signatureWidth - 4, signatureHeight - 4, 'F');
          pdf.setTextColor(107, 114, 128);
          pdf.setFontSize(10);
          pdf.text('Erro ao carregar assinatura', margin + signatureWidth/2, yPosition + signatureHeight/2, { align: 'center' });
          pdf.setTextColor(0, 0, 0);
        }
      } else {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin + 2, yPosition + 2, signatureWidth - 4, signatureHeight - 4, 'F');
        pdf.setTextColor(107, 114, 128);
        pdf.setFont(undefined, 'italic');
        pdf.setFontSize(10);
        pdf.text('Aguardando assinatura...', margin + signatureWidth/2, yPosition + signatureHeight/2, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
      }
      

      // Assinatura do Locatário
      pdf.setFont(undefined, 'bold');
      pdf.setFontSize(12);
      pdf.text('Assinatura do Locatário', margin + signatureWidth + 20, yPosition - 8);
      
      // Borda mais definida para área de assinatura
      pdf.setDrawColor(124, 58, 237);
      pdf.setLineWidth(0.5);
      pdf.rect(margin + signatureWidth + 20, yPosition, signatureWidth, signatureHeight);
      
      if (locatarioSignature) {
        try {
          pdf.addImage(locatarioSignature, 'PNG', margin + signatureWidth + 22, yPosition + 2, signatureWidth - 4, signatureHeight - 4);
        } catch (error) {
          console.warn('Erro ao adicionar assinatura do locatário:', error);
          pdf.setFillColor(250, 250, 250);
          pdf.rect(margin + signatureWidth + 22, yPosition + 2, signatureWidth - 4, signatureHeight - 4, 'F');
          pdf.setTextColor(107, 114, 128);
          pdf.setFontSize(10);
          pdf.text('Erro ao carregar assinatura', margin + signatureWidth + 20 + signatureWidth/2, yPosition + signatureHeight/2, { align: 'center' });
          pdf.setTextColor(0, 0, 0);
        }
      } else {
        pdf.setFillColor(250, 250, 250);
        pdf.rect(margin + signatureWidth + 22, yPosition + 2, signatureWidth - 4, signatureHeight - 4, 'F');
        pdf.setTextColor(107, 114, 128);
        pdf.setFont(undefined, 'italic');
        pdf.setFontSize(10);
        pdf.text('Aguardando assinatura...', margin + signatureWidth + 20 + signatureWidth/2, yPosition + signatureHeight/2, { align: 'center' });
        pdf.setTextColor(0, 0, 0);
      }
      

      yPosition += signatureHeight + 10;

      // Rodapé
      checkNewPage(15);
      pdf.setDrawColor(124, 58, 237);
      pdf.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 5;
      
      pdf.setTextColor(107, 114, 128);
      pdf.setFontSize(8);
      pdf.setFont(undefined, 'normal');
      pdf.text(`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 4;
      pdf.setFont(undefined, 'bold');
      pdf.text(`${companyName} - Sistema de Vistorias`, pageWidth / 2, yPosition, { align: 'center' });

      // Nome do arquivo
      const fileName = `vistoria_${clientData.placa || 'sem_placa'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Download do PDF
      pdf.save(fileName);

      // Limpar as condições selecionadas e dados após download
      setTimeout(() => {
        // Limpar os radio buttons do DOM
        const radioButtons = document.querySelectorAll('input[type="radio"]');
        radioButtons.forEach(radio => {
          (radio as HTMLInputElement).checked = false;
        });
        
        // Limpar estados
        setFormState({});
        setVistoriadorSignature("");
        setLocatarioSignature("");
        setFotosGeraisFrontal([]);
        setFotosGeraisTraseira([]);
        setFotosGeraisLateralEsquerda([]);
        setFotosGeraisLateralDireita([]);
        setFotosPneuDianteiro([]);
        setFotosPneuTraseiro([]);
        setFotosFreios([]);
        setFotosFarolDianteiro([]);
        setFotosLanternaTraseira([]);
        setFotosSistemaSetas([]);
        setFotosSistemaBuzina([]);
        setFotosMotor([]);
        setFotosTransmissao([]);
        setFotosSuspensaoDianteira([]);
        setFotosSuspensaoTraseira([]);
        setFotosCarroceria([]);
        setFotosObservacoesFinais([]);
        setFotosKmAtual([]);
        
        // Limpar observações
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(textarea => {
          (textarea as HTMLTextAreaElement).value = '';
        });
        
        alert('Vistoria gerada com sucesso! Todos os dados foram limpos para uma nova vistoria.');
      }, 500);

    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      alert('Erro ao gerar o PDF. Tente novamente.');
    }
  };

  // Função para limpar todos os dados da vistoria
  const handleLimparVistoria = () => {
    if (confirm('Tem certeza que deseja limpar todos os dados da vistoria? Esta ação não pode ser desfeita.')) {
      // Limpar os radio buttons do DOM
      const radioButtons = document.querySelectorAll('input[type="radio"]');
      radioButtons.forEach(radio => {
        (radio as HTMLInputElement).checked = false;
      });
      
      // Limpar estados
      setFormState({});
      setVistoriadorSignature("");
      setLocatarioSignature("");
      setFotosGeraisFrontal([]);
      setFotosGeraisTraseira([]);
      setFotosGeraisLateralEsquerda([]);
      setFotosGeraisLateralDireita([]);
      setFotosPneuDianteiro([]);
      setFotosPneuTraseiro([]);
      setFotosFreios([]);
      setFotosFarolDianteiro([]);
      setFotosLanternaTraseira([]);
      setFotosSistemaSetas([]);
      setFotosSistemaBuzina([]);
      setFotosMotor([]);
      setFotosTransmissao([]);
      setFotosSuspensaoDianteira([]);
      setFotosSuspensaoTraseira([]);
      setFotosCarroceria([]);
      setFotosObservacoesFinais([]);
      setFotosKmAtual([]);
      
      // Limpar observações
      const textareas = document.querySelectorAll('textarea');
      textareas.forEach(textarea => {
        (textarea as HTMLTextAreaElement).value = '';
      });
      
      alert('Todos os dados da vistoria foram limpos com sucesso!');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-blue-50">
      <div className="container mx-auto p-4 max-w-4xl">
        {/* Header com logout */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm border border-violet-100">
          <div className="flex flex-col items-center justify-center gap-2">
            {userProfile?.company_logo && (
              <img 
                src={userProfile.company_logo} 
                alt="Logo da empresa" 
                className="w-20 h-20 rounded object-cover mb-2 shadow"
              />
            )}
            <h1 className="text-3xl font-extrabold text-violet-700 text-center">
              {userProfile?.company_name || 'CheckSystem'}
            </h1>
            <p className="text-base text-gray-600 text-center mt-1">Sistema eficiente para checklists de motos</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 mt-4">
            <span className="text-sm text-gray-600 hidden sm:block">Bem-Vindo {userProfile?.company_name || 'CheckSystem'}</span>
            <div className="flex gap-2">
              {!isCheckingAdmin && isAdmin && (
                <Button variant="outline" onClick={() => navigate('/admin')} size="sm" className="text-xs">
                  Admin
                </Button>
              )}
              <Button variant="outline" onClick={handleLogout} size="sm" className="text-xs">
                Sair
              </Button>
            </div>
          </div>
        </div>

        {/* Pop-up de instalação PWA */}
        {pwa.showPrompt && (
          <InstallPrompt onClose={pwa.hidePrompt} />
        )}

        {/* Abas responsivas */}
        <nav className="bg-white rounded-xl p-2 mb-6 shadow-sm border border-violet-100">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] items-center gap-2">
            <div className="justify-self-center">
              <div className="flex flex-wrap items-center justify-center gap-2">
                {TABS.map(tab => (
                  <button
                    key={tab.key}
                    className={`flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 px-3 py-3 rounded-lg font-medium transition-all duration-200 text-sm ${
                      activeTab === tab.key 
                        ? 'bg-violet-600 text-white shadow-md' 
                        : 'text-gray-600 hover:bg-violet-50 hover:text-violet-700'
                    }`}
                    onClick={() => setActiveTab(tab.key)}
                    type="button"
                  >
                    {tab.icon}
                    <span className="text-xs sm:text-sm">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="justify-self-center sm:justify-self-end w-full sm:w-auto">
              <Button asChild variant="outline" size="sm" aria-label="Acessar CF Motos" className="w-full sm:w-auto">
                <a href="https://pix-zap-cobran.lovable.app/" target="_blank" rel="noopener noreferrer">acessar CF Motos</a>
              </Button>
            </div>
          </div>
        </nav>
        
        {/* Conteúdo das abas */}
        {activeTab === "checklist" && (
        <form className="space-y-8" onSubmit={handleGeneratePDF}>
          {/* Dados da Moto e Cliente */}
          <Card className="bg-violet-50">
            <CardHeader className="flex flex-row items-center gap-2 pb-2">
              <BikeIcon className="text-violet-500" />
              <CardTitle className="text-violet-700">Dados da Moto e Cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="modelo">Modelo da Moto</Label>
                  <Input name="modelo" id="modelo" placeholder="Ex: Honda CB 600F" value={clientData.modelo} onChange={handleClientChange} disabled={!!clientData.cliente} />
                </div>
                <div>
                  <Label htmlFor="placa">Placa</Label>
                  <Input name="placa" id="placa" placeholder="Ex: ABC-1234" value={clientData.placa} onChange={handleClientChange} disabled={!!clientData.cliente} />
                </div>
                <div>
                  <Label htmlFor="cor">Cor</Label>
                  <Input name="cor" id="cor" placeholder="Ex: Vermelha" value={clientData.cor} onChange={handleClientChange} disabled={!!clientData.cliente} />
                </div>
                <div>
                  <Label htmlFor="km">KM Total (Painel)</Label>
                  <Input name="km" id="km" placeholder="Ex: 15000" value={clientData.km} onChange={handleClientChange} disabled={!!clientData.cliente} />
                </div>
                <div>
                  <Label htmlFor="chassi">Número do Chassi</Label>
                  <Input name="chassi" id="chassi" placeholder="Digite o número do chassi" value={clientData.chassi} onChange={handleClientChange} disabled={!!clientData.cliente} />
                </div>
                <div>
                  <Label htmlFor="motor">Número do Motor</Label>
                  <Input name="motor" id="motor" placeholder="Digite o número do motor" value={clientData.motor} onChange={handleClientChange} disabled={!!clientData.cliente} />
                </div>
                <div>
                  <Label htmlFor="cliente">Nome do Cliente</Label>
                  <Input name="cliente" id="cliente" placeholder="Digite o nome completo do cliente" value={clientData.cliente} onChange={handleClientChange} disabled={!!clientData.cliente} />
                </div>
                <div>
                  <Label htmlFor="rg">RG do Locatário</Label>
                  <Input name="rg" id="rg" placeholder="00.000.000-0" value={clientData.rg} onChange={handleClientChange} disabled={!!clientData.cliente} />
                </div>
              </div>
              <div className="mb-2">
                <Label htmlFor="data">Data da Vistoria</Label>
                <Input 
                  name="data" 
                  id="data" 
                  type="date" 
                  value={clientData.data} 
                  onChange={handleClientChange}
                  className="bg-white border-violet-200 focus:border-violet-400"
                />
              </div>
            </CardContent>
          </Card>
          {/* KM Atual */}
          <Card className="bg-violet-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-violet-700">KM Atual</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="kmAtual">KM Atual (Painel)</Label>
                  <Input name="kmAtual" id="kmAtual" placeholder="Ex: 15250" value={clientData.kmAtual || ''} onChange={handleClientChange} />
                </div>
                <div>
                  <Label className="block mb-2 text-sm font-medium text-gray-700">Foto do Painel</Label>
                          <PhotoCapture
          onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosKmAtual)}
          onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosKmAtual)}
          onPhotoDelete={(index) => handlePhotoDelete(index, setFotosKmAtual)}
          photos={fotosKmAtual}
          currentCount={fotosKmAtual.length}
          label="KM Atual"
        />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Fotos Gerais da Moto */}
          <Card className="bg-violet-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-violet-700">Fotos Gerais da Moto</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <PhotoSection
                  title="Foto Frontal"
                  photos={fotosGeraisFrontal}
                  onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosGeraisFrontal)}
                  onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosGeraisFrontal)}
                  onPhotoDelete={(index) => handlePhotoDelete(index, setFotosGeraisFrontal)}
                  placeholder="Escreva uma observação sobre a foto frontal..."
                />
                <PhotoSection
                  title="Foto Traseira"
                  photos={fotosGeraisTraseira}
                  onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosGeraisTraseira)}
                  onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosGeraisTraseira)}
                  onPhotoDelete={(index) => handlePhotoDelete(index, setFotosGeraisTraseira)}
                  placeholder="Escreva uma observação sobre a foto traseira..."
                />
                <PhotoSection
                  title="Foto Lateral Esquerda"
                  photos={fotosGeraisLateralEsquerda}
                  onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosGeraisLateralEsquerda)}
                  onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosGeraisLateralEsquerda)}
                  onPhotoDelete={(index) => handlePhotoDelete(index, setFotosGeraisLateralEsquerda)}
                  placeholder="Escreva uma observação sobre a foto lateral esquerda..."
                />
                <PhotoSection
                  title="Foto Lateral Direita"
                  photos={fotosGeraisLateralDireita}
                  onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosGeraisLateralDireita)}
                  onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosGeraisLateralDireita)}
                  onPhotoDelete={(index) => handlePhotoDelete(index, setFotosGeraisLateralDireita)}
                  placeholder="Escreva uma observação sobre a foto lateral direita..."
                />
              </div>
            </CardContent>
          </Card>
          {/* Pneus */}
          <Card className="bg-violet-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-violet-700">Pneus</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Pneu Dianteiro */}
                <div className="bg-blue-50 rounded p-4 mb-2">
                  <Label className="mb-1 block">Pneu Dianteiro</Label>
                  <RadioGroupCond name="pneu_dianteiro" />
                  <PhotoCapture
                    onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosPneuDianteiro)}
                    onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosPneuDianteiro)}
                    onPhotoDelete={(index) => handlePhotoDelete(index, setFotosPneuDianteiro)}
                    photos={fotosPneuDianteiro}
                    currentCount={fotosPneuDianteiro.length}
                    label="Pneu Dianteiro"
                  />
                  <div>
                    <Label className="block mb-1">Observação</Label>
                    <textarea className="w-full rounded border p-2 text-sm" placeholder="Escreva uma observação sobre o pneu dianteiro..." rows={2}></textarea>
                  </div>
                </div>
                {/* Pneu Traseiro */}
                <div className="bg-blue-50 rounded p-4 mb-2">
                  <Label className="mb-1 block">Pneu Traseiro</Label>
                  <RadioGroupCond name="pneu_traseiro" />
                  <PhotoCapture
                    onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosPneuTraseiro)}
                    onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosPneuTraseiro)}
                    onPhotoDelete={(index) => handlePhotoDelete(index, setFotosPneuTraseiro)}
                    photos={fotosPneuTraseiro}
                    currentCount={fotosPneuTraseiro.length}
                    label="Pneu Traseiro"
                  />
                  <div>
                    <Label className="block mb-1">Observação</Label>
                    <textarea className="w-full rounded border p-2 text-sm" placeholder="Escreva uma observação sobre o pneu traseiro..." rows={2}></textarea>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Sistema de Freios */}
          <Card className="bg-violet-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-violet-700">Sistema de Freios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {/* Sistema de Freio Dianteiro/Traseiro */}
                <div className="bg-blue-50 rounded p-4 mb-2">
                  <Label className="mb-1 block">Sistema de Freio Dianteiro/Traseiro</Label>
                  <RadioGroupCond name="freio" />
                  <PhotoCapture
                    onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosFreios)}
                    onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosFreios)}
                    onPhotoDelete={(index) => handlePhotoDelete(index, setFotosFreios)}
                    photos={fotosFreios}
                    currentCount={fotosFreios.length}
                    label="Sistema de Freio"
                  />
                  <div>
                    <Label className="block mb-1">Observação</Label>
                    <textarea className="w-full rounded border p-2 text-sm" placeholder="Escreva uma observação sobre o sistema de freio..." rows={2}></textarea>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Sistema Elétrico */}
          <Card className="bg-violet-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-violet-700">Sistema Elétrico</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Farol Dianteiro */}
                <div className="bg-blue-50 rounded p-4 mb-2">
                  <Label className="mb-1 block">Farol Dianteiro</Label>
                  <RadioGroupCond name="farol" />
                  <PhotoCapture
                    onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosFarolDianteiro)}
                    onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosFarolDianteiro)}
                    onPhotoDelete={(index) => handlePhotoDelete(index, setFotosFarolDianteiro)}
                    photos={fotosFarolDianteiro}
                    currentCount={fotosFarolDianteiro.length}
                    label="Farol Dianteiro"
                  />
                  <div>
                    <Label className="block mb-1">Observação</Label>
                    <textarea className="w-full rounded border p-2 text-sm" placeholder="Escreva uma observação sobre o farol dianteiro..." rows={2}></textarea>
                  </div>
                </div>
                {/* Lanterna Traseira */}
                <div className="bg-blue-50 rounded p-4 mb-2">
                  <Label className="mb-1 block">Lanterna Traseira</Label>
                  <RadioGroupCond name="lanterna" />
                  <PhotoCapture
                    onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosLanternaTraseira)}
                    onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosLanternaTraseira)}
                    onPhotoDelete={(index) => handlePhotoDelete(index, setFotosLanternaTraseira)}
                    photos={fotosLanternaTraseira}
                    currentCount={fotosLanternaTraseira.length}
                    label="Lanterna Traseira"
                  />
                  <div>
                    <Label className="block mb-1">Observação</Label>
                    <textarea className="w-full rounded border p-2 text-sm" placeholder="Escreva uma observação sobre a lanterna traseira..." rows={2}></textarea>
                  </div>
                </div>
                {/* Sistema de Setas */}
                <div className="bg-blue-50 rounded p-4 mb-2">
                  <Label className="mb-1 block">Sistema de Setas (Dianteiro/Traseiro)</Label>
                  <RadioGroupCond name="setas" />
                  <PhotoCapture
                    onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosSistemaSetas)}
                    onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosSistemaSetas)}
                    onPhotoDelete={(index) => handlePhotoDelete(index, setFotosSistemaSetas)}
                    photos={fotosSistemaSetas}
                    currentCount={fotosSistemaSetas.length}
                    label="Sistema de Setas"
                  />
                  <div>
                    <Label className="block mb-1">Observação</Label>
                    <textarea className="w-full rounded border p-2 text-sm" placeholder="Escreva uma observação sobre o sistema de setas..." rows={2}></textarea>
                  </div>
                </div>
                {/* Bateria */}
                <div className="bg-blue-50 rounded p-4 mb-2">
                  <Label className="mb-1 block">Bateria</Label>
                  <RadioGroupCond name="bateria" />
                  <PhotoCapture
                    onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosSistemaBuzina)}
                    onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosSistemaBuzina)}
                    onPhotoDelete={(index) => handlePhotoDelete(index, setFotosSistemaBuzina)}
                    photos={fotosSistemaBuzina}
                    currentCount={fotosSistemaBuzina.length}
                    label="Bateria"
                  />
                  <div>
                    <Label className="block mb-1">Observação</Label>
                    <textarea className="w-full rounded border p-2 text-sm" placeholder="Escreva uma observação sobre a bateria..." rows={2}></textarea>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Mecânica */}
          <Card className="bg-violet-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-violet-700">Mecânica</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Motor */}
                <div className="bg-blue-50 rounded p-4 mb-2">
                  <Label className="mb-1 block">Motor</Label>
                  <RadioGroupCond name="mecanica_motor" />
                  <PhotoCapture
                    onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosMotor)}
                    onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosMotor)}
                    onPhotoDelete={(index) => handlePhotoDelete(index, setFotosMotor)}
                    photos={fotosMotor}
                    currentCount={fotosMotor.length}
                    label="Motor"
                  />
                  <div>
                    <Label className="block mb-1">Observação</Label>
                    <textarea className="w-full rounded border p-2 text-sm" placeholder="Escreva uma observação sobre o motor..." rows={2}></textarea>
                  </div>
                </div>
                {/* Transmissão */}
                <div className="bg-blue-50 rounded p-4 mb-2">
                  <Label className="mb-1 block">Transmissão</Label>
                  <RadioGroupCond name="mecanica_transmissao" />
                  <PhotoCapture
                    onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosTransmissao)}
                    onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosTransmissao)}
                    onPhotoDelete={(index) => handlePhotoDelete(index, setFotosTransmissao)}
                    photos={fotosTransmissao}
                    currentCount={fotosTransmissao.length}
                    label="Transmissão"
                  />
                  <div>
                    <Label className="block mb-1">Observação</Label>
                    <textarea className="w-full rounded border p-2 text-sm" placeholder="Escreva uma observação sobre a transmissão..." rows={2}></textarea>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Suspensão */}
          <Card className="bg-violet-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-violet-700">Suspensão</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Suspensão Dianteira */}
                <div className="bg-blue-50 rounded p-4 mb-2">
                  <Label className="mb-1 block">Suspensão Dianteira</Label>
                  <RadioGroupCond name="suspensao_dianteira" />
                  <PhotoCapture
                    onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosSuspensaoDianteira)}
                    onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosSuspensaoDianteira)}
                    onPhotoDelete={(index) => handlePhotoDelete(index, setFotosSuspensaoDianteira)}
                    photos={fotosSuspensaoDianteira}
                    currentCount={fotosSuspensaoDianteira.length}
                    label="Suspensão Dianteira"
                  />
                  <div>
                    <Label className="block mb-1">Observação</Label>
                    <textarea className="w-full rounded border p-2 text-sm" placeholder="Escreva uma observação sobre a suspensão dianteira..." rows={2}></textarea>
                  </div>
                </div>
                {/* Suspensão Traseira */}
                <div className="bg-blue-50 rounded p-4 mb-2">
                  <Label className="mb-1 block">Suspensão Traseira</Label>
                  <RadioGroupCond name="suspensao_traseira" />
                  <PhotoCapture
                    onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosSuspensaoTraseira)}
                    onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosSuspensaoTraseira)}
                    onPhotoDelete={(index) => handlePhotoDelete(index, setFotosSuspensaoTraseira)}
                    photos={fotosSuspensaoTraseira}
                    currentCount={fotosSuspensaoTraseira.length}
                    label="Suspensão Traseira"
                  />
                  <div>
                    <Label className="block mb-1">Observação</Label>
                    <textarea className="w-full rounded border p-2 text-sm" placeholder="Escreva uma observação sobre a suspensão traseira..." rows={2}></textarea>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Carroceria e Acessórios */}
          <Card className="bg-violet-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-violet-700">Carroceria e Acessórios</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4">
                {/* Tanque e Banco */}
                <div className="bg-blue-50 rounded p-4 mb-2">
                  <Label className="mb-1 block">Tanque e Banco</Label>
                  <RadioGroupCond name="carroceria_tanque_banco" />
                  <div className="mt-3">
                    <Label className="block mb-2 text-sm font-medium text-gray-700">Fotos</Label>
                    <PhotoCapture
                      onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosCarroceria)}
                      onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosCarroceria)}
                      onPhotoDelete={(index) => handlePhotoDelete(index, setFotosCarroceria)}
                      photos={fotosCarroceria}
                      currentCount={fotosCarroceria.length}
                      label="Tanque e Banco"
                    />
                  </div>
                  <div className="mt-3">
                    <Label className="block mb-1">Observação</Label>
                    <textarea className="w-full rounded border p-2 text-sm" placeholder="Escreva uma observação sobre tanque e banco..." rows={2}></textarea>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Observações Finais */}
          <Card className="bg-gradient-to-br from-violet-50 to-blue-50 rounded-xl border border-violet-100 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-violet-500 rounded-full"></div>
                <CardTitle className="text-lg font-semibold text-violet-800">Observações Finais (Opcional)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="block mb-2 text-sm font-medium text-gray-700">Observações</Label>
                <textarea 
                  className="w-full rounded-lg border border-gray-200 p-3 text-sm bg-white focus:border-violet-300 focus:ring-2 focus:ring-violet-100 transition-all duration-200 resize-none" 
                  placeholder="Digite suas observações finais aqui..." 
                  rows={4}
                />
              </div>
              
              <div>
                <Label className="block mb-2 text-sm font-medium text-gray-700">Fotos das Observações</Label>
                <PhotoCapture
                  onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosObservacoesFinais)}
                  onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosObservacoesFinais)}
                  currentCount={fotosObservacoesFinais.length}
                  label="Observações Finais"
                />
              </div>
            </CardContent>
          </Card>
                  {/* Assinaturas */}
        <Card className="bg-violet-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-violet-700">Assinaturas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <SignaturePad
                  label="Assinatura do Vistoriador"
                  onSave={(signature) => setVistoriadorSignature(signature)}
                  onClear={() => setVistoriadorSignature("")}
                  value={vistoriadorSignature}
                />
              </div>
              <div>
                <SignaturePad
                  label="Assinatura do Locatário"
                  onSave={(signature) => setLocatarioSignature(signature)}
                  onClear={() => setLocatarioSignature("")}
                  value={locatarioSignature}
                />
              </div>
            </div>

          </CardContent>
        </Card>
          {/* Checklist virá aqui nas próximas etapas */}
          <div className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button type="submit" className="bg-gradient-to-r from-violet-600 to-blue-600 hover:from-violet-700 hover:to-blue-700 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                <Download className="w-5 h-5 mr-2" />
                Download Vistoria
              </Button>
              <Button 
                type="button" 
                onClick={handleLimparVistoria}
                variant="outline"
                className="border-red-500 text-red-500 hover:bg-red-50 hover:border-red-600 hover:text-red-600 px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200"
              >
                <Trash2 className="w-5 h-5 mr-2" />
                Limpar Vistoria
              </Button>
            </div>
          </div>
        </form>
      )}
      {activeTab === "locatarios" && (
        <div>
          {/* Gerenciar Locatários */}
          <Card className="mb-4">
            <CardContent className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <UserIcon className="text-violet-600 w-7 h-7" /> Gerenciar Locatários
              </div>
              {!showForm ? (
                <Button variant="ghost" className="text-violet-600 flex items-center gap-1 font-semibold" onClick={() => setShowForm(true)}>
                  <PlusIcon className="w-5 h-5" /> Novo Locatário
                </Button>
              ) : (
                <Button variant="ghost" className="text-violet-600 flex items-center gap-1 font-semibold" onClick={handleCancelarForm}>
                  <PlusIcon className="w-5 h-5" /> Fechar Formulário
                </Button>
              )}
            </CardContent>
          </Card>
          {/* Formulário de novo locatário ou edição */}
          {showForm && (
            <Card className="mb-4">
              <CardContent className="py-6">
                <form onSubmit={editIdx !== null ? handleSalvarEdicao : handleCadastrarLocatario} className="space-y-4">
                  <div>
                    <Label htmlFor="nome" className="font-medium">Nome Completo <span className="text-red-500">*</span></Label>
                    <Input id="nome" name="nome" required placeholder="João da Silva" value={novoLoc.nome} onChange={handleNovoLocChange} />
                  </div>
                  <div>
                    <Label htmlFor="rg" className="font-medium">RG <span className="text-red-500">*</span></Label>
                    <Input id="rg" name="rg" required placeholder="00.000.000-0" value={novoLoc.rg} onChange={handleNovoLocChange} />
                  </div>
                  <div>
                    <Label htmlFor="telefone" className="font-medium">Telefone (WhatsApp) <span className="text-red-500">*</span></Label>
                    <Input id="telefone" name="telefone" required placeholder="(XX) XXXXX-XXXX" value={novoLoc.telefone} onChange={handleNovoLocChange} />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button type="button" variant="outline" className="flex-1" onClick={handleCancelarForm}>Cancelar</Button>
                    <Button type="submit" className="flex-1 bg-green-500 hover:bg-green-600 text-white">
                      {editIdx !== null ? "Salvar" : "Cadastrar Locatário"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
          {/* Lista de Locatários */}
          <Card className="mb-4">
            <CardContent className="py-4">
              <div className="mb-4">
                <Input placeholder="Buscar por nome, RG ou telefone..." className="bg-gray-50" />
              </div>
              <div className="space-y-4">
                {locatarios.map((loc, idx) => (
                  <div key={loc.rg + idx} className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-gray-100">
                    <div className="flex items-center gap-3">
                      <UserIcon className="text-violet-600 w-7 h-7" />
                      <div>
                        <div className="font-semibold text-lg text-gray-800">{loc.nome}</div>
                        <div className="text-sm text-gray-500">RG: {loc.rg} | Tel: {loc.telefone}</div>
                      </div>
                    </div>
                    <div className="flex flex-col md:flex-row gap-2 md:items-center">
                      <Button className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white" size="sm" onClick={() => handleSelecionarVistoria(idx)}>
                        <CheckCircle2 className="w-4 h-4" /> Sel. p/ Vistoria
                      </Button>
                      <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50 flex items-center gap-1" size="sm" onClick={() => handleEditarLocatario(idx)}>
                        <Edit2 className="w-4 h-4" /> Editar
                      </Button>
                      <Button variant="outline" className="border-red-500 text-red-600 hover:bg-red-50 flex items-center gap-1" size="sm" onClick={() => handleExcluirLocatario(idx)}>
                        <Trash2 className="w-4 h-4" /> Excluir
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {activeTab === "motos" && (
        <div>
          {/* Gerenciar Motos */}
          <Card className="mb-4">
            <CardContent className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <BikeIcon className="text-violet-600 w-7 h-7" /> Gerenciar Motos
              </div>
              {!showMotoForm ? (
                <Button variant="ghost" className="text-violet-600 flex items-center gap-1 font-semibold" onClick={() => setShowMotoForm(true)}>
                  <PlusIcon className="w-5 h-5" /> Nova Moto
                </Button>
              ) : (
                <Button variant="ghost" className="text-violet-600 flex items-center gap-1 font-semibold" onClick={handleCancelarMoto}>
                  <PlusIcon className="w-5 h-5" /> Fechar Formulário
                </Button>
              )}
            </CardContent>
          </Card>
          {/* Formulário de novo moto ou edição */}
          {showMotoForm && (
            <Card className="mb-4">
              <CardContent className="py-6">
                <form onSubmit={editMotoIdx !== null ? handleSalvarEdicaoMoto : handleCadastrarMoto} className="space-y-4">
                  <div>
                    <Label htmlFor="locatarioRg" className="font-medium">Locatário Vinculado <span className="text-red-500">*</span></Label>
                    <select id="locatarioRg" name="locatarioRg" required value={novaMoto.locatarioRg} onChange={handleNovaMotoChange} className="w-full rounded border p-2 text-sm">
                      <option value="">Selecione um locatário</option>
                      {locatarios.map((loc) => (
                        <option key={loc.rg} value={loc.rg}>{loc.nome}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <Label htmlFor="modelo" className="font-medium">Modelo da Moto <span className="text-red-500">*</span></Label>
                    <Input id="modelo" name="modelo" required placeholder="Honda CG 160 Titan" value={novaMoto.modelo} onChange={handleNovaMotoChange} />
                  </div>
                  <div>
                    <Label htmlFor="placa" className="font-medium">Placa <span className="text-red-500">*</span></Label>
                    <Input id="placa" name="placa" required placeholder="ABC-1234 ou ABC1D23" value={novaMoto.placa} onChange={handleNovaMotoChange} />
                  </div>
                  <div>
                    <Label htmlFor="cor" className="font-medium">Cor <span className="text-red-500">*</span></Label>
                    <Input id="cor" name="cor" required placeholder="Preta" value={novaMoto.cor} onChange={handleNovaMotoChange} />
                  </div>
                  <div>
                    <Label htmlFor="ano" className="font-medium">Ano de Fabricação <span className="text-red-500">*</span></Label>
                    <Input id="ano" name="ano" required placeholder="2023" value={novaMoto.ano} onChange={handleNovaMotoChange} />
                  </div>
                  <div>
                    <Label htmlFor="km" className="font-medium">KM Atual <span className="text-red-500">*</span></Label>
                    <Input id="km" name="km" required placeholder="15000" value={novaMoto.km} onChange={handleNovaMotoChange} />
                  </div>
                  <div>
                    <Label htmlFor="chassi" className="font-medium flex items-center gap-1"><Fingerprint className="w-4 h-4" /> Número do Chassi <span className="text-red-500">*</span></Label>
                    <Input id="chassi" name="chassi" required placeholder="Digite o número do chassi" value={novaMoto.chassi} onChange={handleNovaMotoChange} />
                  </div>
                  <div>
                    <Label htmlFor="motor" className="font-medium flex items-center gap-1"><Fingerprint className="w-4 h-4" /> Número do Motor <span className="text-red-500">*</span></Label>
                    <Input id="motor" name="motor" required placeholder="Digite o número do motor" value={novaMoto.motor} onChange={handleNovaMotoChange} />
                  </div>
                  <div>
                    <Label htmlFor="obs" className="font-medium">Observações</Label>
                    <textarea id="obs" name="obs" placeholder="Detalhes adicionais sobre a moto" className="w-full rounded border p-2 text-sm" value={novaMoto.obs} onChange={handleNovaMotoChange} />
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Button type="button" variant="outline" className="flex-1" onClick={handleCancelarMoto}>Cancelar</Button>
                    <Button type="submit" className="flex-1 bg-green-500 hover:bg-green-600 text-white">
                      {editMotoIdx !== null ? "Salvar" : "Cadastrar Moto"}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          )}
          {/* Lista de Motos */}
          <Card className="mb-4">
            <CardContent className="py-4">
              <div className="mb-4">
                <Input placeholder="Buscar por modelo, placa, chassi ou motor..." className="bg-gray-50" />
              </div>
              <div className="space-y-4">
                {motos.map((moto, idx) => {
                  const loc = locatarios.find(l => l.rg === moto.locatarioRg);
                  return (
                    <div key={moto.chassi + idx} className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-gray-100">
                      <div className="flex items-center gap-3">
                        <BikeIcon className="text-violet-600 w-7 h-7" />
                        <div>
                          <div className="font-semibold text-lg text-gray-800">{moto.modelo} - {moto.placa}</div>
                          <div className="text-sm text-gray-500">Locatário: {loc ? loc.nome : "-"} (RG: {moto.locatarioRg}) | KM: {moto.km}</div>
                          <div className="text-xs text-gray-400">Chassi: {moto.chassi} | Motor: {moto.motor}</div>
                          {moto.obs && <div className="text-xs text-gray-500 mt-1">Obs: {moto.obs}</div>}
                        </div>
                      </div>
                      <div className="flex flex-col md:flex-row gap-2 md:items-center">
                        <Button variant="outline" className="border-blue-500 text-blue-600 hover:bg-blue-50 flex items-center gap-1" size="sm" onClick={() => handleEditarMoto(idx)}>
                          <Edit2 className="w-4 h-4" /> Editar
                        </Button>
                        <Button variant="outline" className="border-red-500 text-red-600 hover:bg-red-50 flex items-center gap-1" size="sm" onClick={() => handleExcluirMoto(idx)}>
                          <Trash2 className="w-4 h-4" /> Excluir
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
      {/* Aba de agendamento removida conforme solicitado */}
      </div>
    </div>
  );
}
