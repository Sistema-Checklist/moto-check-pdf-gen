import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { checklistSections } from "@/data/checklist";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { CalendarIcon, BikeIcon, UserIcon, HashIcon, ClipboardListIcon, PlusIcon, CheckCircle2, Edit2, Trash2, Fingerprint, ClipboardCopy, Wrench, CalendarDays, Clock, MessageSquare, PhoneIcon } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import SignaturePad from "@/components/SignaturePad";
import PhotoCapture from "@/components/PhotoCapture";
import PhotoSection from "@/components/PhotoSection";
import { supabase } from "@/integrations/supabase/client";

const TABS = [
  { key: "checklist", label: "Checklist", icon: <ClipboardListIcon className="w-5 h-5" /> },
  { key: "locatarios", label: "Locatários", icon: <UserIcon className="w-5 h-5" /> },
  { key: "motos", label: "Motos", icon: <BikeIcon className="w-5 h-5" /> },
  { key: "agendamento", label: "Agendamento", icon: <CalendarIcon className="w-5 h-5" /> },
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

const mockMotos: Moto[] = [
  {
    modelo: "Honda CB 600F",
    placa: "ABC-1234",
    cor: "Vermelha",
    km: "15000",
    chassi: "9C6RG3150L0032664",
    motor: "MTR123456789",
    locatarioRg: "563105057",
    ano: "2020",
    obs: "",
  },
  {
    modelo: "Factor 150 ED",
    placa: "DVL-9C29",
    cor: "Preta",
    km: "57309",
    chassi: "9C6RG3150L0012488",
    motor: "MTR987654321",
    locatarioRg: "632886997",
    ano: "2023",
    obs: "",
  },
];

const tipoManutencaoOptions = [
  { value: "corretiva", label: "Corretiva" },
  { value: "preventiva", label: "Preventiva" },
  { value: "troca_oleo", label: "Troca de Óleo" },
];

export default function Index() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("checklist");
  const [showForm, setShowForm] = useState(false);
  const [locatarios, setLocatarios] = useState(mockLocatarios);
  const [novoLoc, setNovoLoc] = useState({ nome: "", rg: "", telefone: "" });
  const [formState, setFormState] = useState<Record<string, string>>({});
  const [clientData, setClientData] = useState({
    modelo: "",
    placa: "",
    cor: "",
    km: "",
    chassi: "",
    motor: "",
    cliente: "",
    rg: "",
    data: "",
  });
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [showMotoForm, setShowMotoForm] = useState(false);
  const [motos, setMotos] = useState<Moto[]>(mockMotos);
  const [novaMoto, setNovaMoto] = useState<Moto>({
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

  const [agendamentos, setAgendamentos] = useState([]);
  const [showAgendamentoForm, setShowAgendamentoForm] = useState(false);
  const [agendamentoForm, setAgendamentoForm] = useState({
    nome: "",
    telefone: "",
    placa: "",
    tipo: "",
    data: "",
    horario: "",
    obs: "",
    status: "pendente",
  });
  const [filtroStatus, setFiltroStatus] = useState("");
  const [filtroData, setFiltroData] = useState("");

  const [vistoriadorSignature, setVistoriadorSignature] = useState("");
  const [locatarioSignature, setLocatarioSignature] = useState("");
  const [fotosGerais, setFotosGerais] = useState<string[]>([]);
  const [fotosPneus, setFotosPneus] = useState<string[]>([]);
  const [fotosFreios, setFotosFreios] = useState<string[]>([]);
  const [fotosEletrico, setFotosEletrico] = useState<string[]>([]);
  const [fotosMecanica, setFotosMecanica] = useState<string[]>([]);
  const [fotosSuspensao, setFotosSuspensao] = useState<string[]>([]);
  const [fotosCarroceria, setFotosCarroceria] = useState<string[]>([]);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const locRg = params.get("locatario");
    if (params.get("agendamento") === "1" && locRg) {
      const loc = locatarios.find(l => l.rg === locRg);
      if (loc) {
        setAgendamentoForm(f => ({ ...f, nome: loc.nome }));
      }
    }
  }, [location.search, locatarios]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }

    // Verificar se o usuário está aprovado
    const { data: profile, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    // Se não há perfil ou há erro (exceto para admin)
    if ((error || !profile) && user.email !== 'kauankg@hotmail.com') {
      console.log('Usuário sem perfil encontrado, redirecionando para login');
      await supabase.auth.signOut();
      navigate('/login');
      return;
    }

    // Se é admin e não tem perfil, criar automaticamente
    if (user.email === 'kauankg@hotmail.com' && (!profile || error)) {
      const { error: createError } = await supabase
        .from('user_profiles')
        .upsert([{
          user_id: user.id,
          name: 'Admin Geral',
          email: 'kauankg@hotmail.com',
          phone: '(11) 99999-9999',
          is_approved: true,
          is_frozen: false,
          created_at: new Date().toISOString(),
        }], {
          onConflict: 'email'
        });

      if (createError) {
        console.error('Erro ao criar perfil admin:', createError);
        await supabase.auth.signOut();
        navigate('/login');
        return;
      }
    }

    // Verificar se o usuário está aprovado (exceto admin)
    if (user.email !== 'kauankg@hotmail.com' && !profile.is_approved) {
      console.log('Usuário não aprovado, redirecionando para login');
      await supabase.auth.signOut();
      navigate('/login');
      return;
    }

    // Verificar se o usuário está congelado
    if (profile.is_frozen) {
      console.log('Usuário congelado, redirecionando para login');
      await supabase.auth.signOut();
      navigate('/login');
      return;
    }

    setUser(user);
    setLoading(false);
  };

  const handleStateChange = (id: string, value: string) => {
    setFormState((prevState) => ({ ...prevState, [id]: value }));
  };

  const handleClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setClientData({ ...clientData, [e.target.name]: e.target.value });
  };

  function handleNovoLocChange(e: React.ChangeEvent<HTMLInputElement>) {
    setNovoLoc({ ...novoLoc, [e.target.name]: e.target.value });
  }
  function handleCadastrarLocatario(e: React.FormEvent) {
    e.preventDefault();
    if (!novoLoc.nome || !novoLoc.rg || !novoLoc.telefone) return;
    setLocatarios([
      ...locatarios,
      { ...novoLoc, selecionado: false },
    ]);
    setNovoLoc({ nome: "", rg: "", telefone: "" });
    setShowForm(false);
  }
  function handleCancelarForm() {
    setNovoLoc({ nome: "", rg: "", telefone: "" });
    setShowForm(false);
  }

  function handleExcluirLocatario(idx: number) {
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

  function handleSalvarEdicao(e: React.FormEvent) {
    e.preventDefault();
    if (editIdx === null) return;
    const novos = [...locatarios];
    novos[editIdx] = { ...novos[editIdx], ...novoLoc };
    setLocatarios(novos);
    setEditIdx(null);
    setNovoLoc({ nome: "", rg: "", telefone: "" });
    setShowForm(false);
  }

  function handleSelecionarVistoria(idx: number) {
    setLocatarios(locatarios.map((loc, i) => i === idx ? { ...loc, selecionado: !loc.selecionado } : { ...loc, selecionado: false }));
    // Preencher dados do checklist
    const loc = locatarios[idx];
    if (!loc.selecionado) {
      setClientData((prev) => ({
        ...prev,
        cliente: loc.nome,
        rg: loc.rg,
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
      setActiveTab("checklist"); // Troca para a aba de checklist
    }
  }

  function handleNovaMotoChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setNovaMoto({ ...novaMoto, [e.target.name]: e.target.value });
  }
  function handleCadastrarMoto(e: React.FormEvent) {
    e.preventDefault();
    if (!novaMoto.locatarioRg || !novaMoto.modelo || !novaMoto.placa || !novaMoto.cor || !novaMoto.ano || !novaMoto.km || !novaMoto.chassi || !novaMoto.motor) return;
    setMotos([
      ...motos,
      { ...novaMoto, ano: novaMoto.ano || "", obs: novaMoto.obs || "" },
    ]);
    setNovaMoto({ locatarioRg: "", modelo: "", placa: "", cor: "", ano: "", km: "", chassi: "", motor: "", obs: "" });
    setShowMotoForm(false);
  }
  function handleCancelarMoto() {
    setNovaMoto({ locatarioRg: "", modelo: "", placa: "", cor: "", ano: "", km: "", chassi: "", motor: "", obs: "" });
    setShowMotoForm(false);
  }

  function handleExcluirMoto(idx: number) {
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

  function handleSalvarEdicaoMoto(e: React.FormEvent) {
    e.preventDefault();
    if (editMotoIdx === null) return;
    const novas = [...motos];
    novas[editMotoIdx] = { ...novaMoto };
    setMotos(novas);
    setEditMotoIdx(null);
    setNovaMoto({ locatarioRg: "", modelo: "", placa: "", cor: "", ano: "", km: "", chassi: "", motor: "", obs: "" });
    setShowMotoForm(false);
  }

  function handleAgendamentoChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setAgendamentoForm({ ...agendamentoForm, [e.target.name]: e.target.value });
  }
  function handleEnviarAgendamento(e: React.FormEvent) {
    e.preventDefault();
    setAgendamentos([
      ...agendamentos,
      { ...agendamentoForm, status: "pendente" },
    ]);

    setShowAgendamentoForm(false);
    setAgendamentoForm({ nome: "", telefone: "", placa: "", tipo: "", data: "", horario: "", obs: "", status: "pendente" });
  }

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

  // Função utilitária para radio group
  const RadioGroupCond = ({ name }: { name: string }) => (
    <div className="flex gap-4 mb-2">
      <label className="flex items-center gap-1">
        <input type="radio" name={name} className="accent-violet-600" /> Bom
      </label>
      <label className="flex items-center gap-1">
        <input type="radio" name={name} className="accent-violet-600" /> Regular
      </label>
      <label className="flex items-center gap-1">
        <input type="radio" name={name} className="accent-violet-600" /> Necessita Troca
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
    setter(prev => [...prev, photoData]);
  };

  const handlePhotoSelect = (photoData: string, setter: React.Dispatch<React.SetStateAction<string[]>>) => {
    setter(prev => [...prev, photoData]);
  };

  return (
    <div className="container mx-auto p-4">
      {/* Header com logout */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-violet-700">Sistema de Checklist de Motos</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Usuário: {user?.email}</span>
          {user?.email === 'kauankg@hotmail.com' && (
            <Button variant="outline" onClick={() => navigate('/admin')} size="sm">
              Painel Admin
            </Button>
          )}
          <Button variant="outline" onClick={handleLogout} size="sm">
            Sair
          </Button>
        </div>
      </div>
      {/* Abas horizontais */}
      <nav className="flex gap-2 mb-6 border-b border-gray-200">
        {TABS.map(tab => (
          <button
            key={tab.key}
            className={`flex items-center gap-2 px-4 py-2 rounded-t-md font-medium transition-colors duration-150 ${activeTab === tab.key ? 'bg-white text-violet-700 border-x border-t border-b-0 border-violet-200 shadow-sm' : 'text-gray-500 hover:text-violet-700'}`}
            onClick={() => setActiveTab(tab.key)}
            type="button"
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>
      {/* Conteúdo das abas */}
      {activeTab === "checklist" && (
        <form className="space-y-8">
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
                <Input name="data" id="data" type="date" value={clientData.data} onChange={handleClientChange} />
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
                  photos={fotosGerais}
                  onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosGerais)}
                  onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosGerais)}
                  placeholder="Escreva uma observação sobre a foto frontal..."
                />
                <PhotoSection
                  title="Foto Traseira"
                  photos={fotosGerais}
                  onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosGerais)}
                  onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosGerais)}
                  placeholder="Escreva uma observação sobre a foto traseira..."
                />
                <PhotoSection
                  title="Foto Lateral Esquerda"
                  photos={fotosGerais}
                  onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosGerais)}
                  onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosGerais)}
                  placeholder="Escreva uma observação sobre a foto lateral esquerda..."
                />
                <PhotoSection
                  title="Foto Lateral Direita"
                  photos={fotosGerais}
                  onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosGerais)}
                  onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosGerais)}
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
                    onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosPneus)}
                    onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosPneus)}
                    currentCount={fotosPneus.length}
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
                    onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosPneus)}
                    onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosPneus)}
                    currentCount={fotosPneus.length}
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
                    onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosEletrico)}
                    onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosEletrico)}
                    currentCount={fotosEletrico.length}
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
                    onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosEletrico)}
                    onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosEletrico)}
                    currentCount={fotosEletrico.length}
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
                    onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosEletrico)}
                    onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosEletrico)}
                    currentCount={fotosEletrico.length}
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
                    onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosEletrico)}
                    onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosEletrico)}
                    currentCount={fotosEletrico.length}
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
                    onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosMecanica)}
                    onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosMecanica)}
                    currentCount={fotosMecanica.length}
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
                    onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosMecanica)}
                    onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosMecanica)}
                    currentCount={fotosMecanica.length}
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
                    onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosSuspensao)}
                    onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosSuspensao)}
                    currentCount={fotosSuspensao.length}
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
                    onPhotoCapture={(photoData) => handlePhotoCapture(photoData, setFotosSuspensao)}
                    onPhotoSelect={(photoData) => handlePhotoSelect(photoData, setFotosSuspensao)}
                    currentCount={fotosSuspensao.length}
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
                  <div className="flex gap-2 mb-2">
                    <Button variant="outline" type="button" className="flex-1" disabled>📷 Galeria (0/5)</Button>
                    <Button variant="outline" type="button" className="flex-1" disabled>📸 Câmera (0/5)</Button>
                  </div>
                  <div>
                    <Label className="block mb-1">Observação</Label>
                    <textarea className="w-full rounded border p-2 text-sm" placeholder="Escreva uma observação sobre tanque e banco..." rows={2}></textarea>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Observações Finais */}
          <Card className="bg-violet-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-violet-700">Observações Finais (Opcional)</CardTitle>
            </CardHeader>
            <CardContent>
              <div>
                <Label className="block mb-1">Observações</Label>
                <textarea className="w-full rounded border p-2 text-sm" placeholder="Digite suas observações aqui..." rows={3}></textarea>
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
                />
              </div>
              <div>
                <SignaturePad
                  label="Assinatura do Locatário"
                  onSave={(signature) => setLocatarioSignature(signature)}
                  onClear={() => setLocatarioSignature("")}
                />
              </div>
            </div>
            <div className="text-xs text-gray-400 mt-2">CNPJ: 55.050.610/0001-91</div>
          </CardContent>
        </Card>
          {/* Checklist virá aqui nas próximas etapas */}
          <div className="text-center">
            <Button type="submit" disabled={!isFormValid()}>
              Gerar PDF
            </Button>
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
                      <Button className={`flex items-center gap-1 ${loc.selecionado ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`} size="sm" onClick={() => handleSelecionarVistoria(idx)}>
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
          {/* Formulário de cadastro de moto */}
          {!showMotoForm ? (
            <Button className="mb-4 bg-blue-500 hover:bg-blue-600 text-white" onClick={() => setShowMotoForm(true)}>Nova Moto</Button>
          ) : (
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
                    <Button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white">{editMotoIdx !== null ? "Salvar" : "Cadastrar Moto"}</Button>
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
                      <div>
                        <div className="font-semibold text-lg text-gray-800">{moto.modelo} - {moto.placa}</div>
                        <div className="text-sm text-gray-500">Locatário: {loc ? loc.nome : "-"} (RG: {moto.locatarioRg}) | KM: {moto.km}</div>
                        <div className="text-xs text-gray-400">Chassi: {moto.chassi} | Motor: {moto.motor}</div>
                        {moto.obs && <div className="text-xs text-gray-500 mt-1">Obs: {moto.obs}</div>}
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
      {activeTab === "agendamento" && (
        <div>
          {/* Card de gerenciamento */}
          <Card className="mb-4">
            <CardContent className="py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2">
              <div className="text-2xl font-bold text-gray-800 flex items-center gap-2">
                <CalendarIcon className="text-violet-600 w-7 h-7" /> Gerenciar Agendamentos
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" className="text-violet-600 flex items-center gap-1 font-semibold" onClick={() => setShowAgendamentoForm(true)}>
                  <PlusIcon className="w-5 h-5" /> Novo Agendamento Interno
                </Button>
                <Button variant="outline" onClick={handleGerarLinkPublico}>
                  Copiar Link Público
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Lista de agendamentos */}
          <Card className="mb-4">
            <CardContent className="py-4">
              <div className="text-xl font-bold text-gray-800 mb-4">Lista de Todos os Agendamentos</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label>Filtrar por Status</Label>
                  <select className="w-full rounded border p-2 text-sm" value={filtroStatus} onChange={e => setFiltroStatus(e.target.value)}>
                    <option value="">Todos os Status</option>
                    <option value="pendente">Pendente</option>
                    <option value="concluido">Concluído</option>
                  </select>
                </div>
                <div>
                  <Label>Filtrar por Data</Label>
                  <select className="w-full rounded border p-2 text-sm" value={filtroData} onChange={e => setFiltroData(e.target.value)}>
                    <option value="">Todas as Datas</option>
                    {[...new Set(agendamentos.map(a => a.data))].filter(Boolean).map(data => (
                      <option key={data} value={data}>{data}</option>
                    ))}
                  </select>
                </div>
              </div>
              {agendamentos.filter(a => (!filtroStatus || a.status === filtroStatus) && (!filtroData || a.data === filtroData)).length === 0 ? (
                <div className="text-center text-gray-400">Nenhum agendamento encontrado.</div>
              ) : (
                <div className="space-y-4">
                  {agendamentos.filter(a => (!filtroStatus || a.status === filtroStatus) && (!filtroData || a.data === filtroData)).map((a, idx) => (
                    <div key={a.nome + a.telefone + a.data + idx} className="bg-white rounded-lg shadow p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-2 border border-gray-100">
                      <div>
                        <div className="font-semibold text-lg text-gray-800">{a.nome} - {a.placa}</div>
                        <div className="text-sm text-gray-500">Tipo: {tipoManutencaoOptions.find(opt => opt.value === a.tipo)?.label || a.tipo} | Data: {a.data} | Horário: {a.horario}</div>
                        <div className="text-xs text-gray-400">Telefone: {a.telefone}</div>
                        {a.obs && <div className="text-xs text-gray-500 mt-1">Obs: {a.obs}</div>}
                      </div>
                      <div className="flex flex-col md:flex-row gap-2 md:items-center">
                        <span className={`px-3 py-1 rounded text-xs font-semibold ${a.status === "pendente" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>{a.status === "pendente" ? "Pendente" : "Concluído"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
          {/* Modal/aba exclusiva para solicitação de agendamento (link público ou interno) */}
          {showAgendamentoForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-auto p-6 relative">
                <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700" onClick={() => { setShowAgendamentoForm(false); }}>&times;</button>
                <div className="text-2xl font-bold text-violet-700 mb-4 flex items-center gap-2"><CalendarIcon className="w-6 h-6" /> Agendar Manutenção da Moto</div>
                <form onSubmit={handleEnviarAgendamento} className="space-y-4">
                  <div>
                    <Label htmlFor="nome">Seu Nome Completo <span className="text-red-500">*</span></Label>
                    <Input id="nome" name="nome" required placeholder="Digite seu nome completo" value={agendamentoForm.nome} onChange={handleAgendamentoChange} disabled={!!location.search.includes('locatario=')} />
                  </div>
                  <div>
                    <Label htmlFor="telefone">Telefone para Contato (WhatsApp) <span className="text-red-500">*</span></Label>
                    <div className="flex items-center gap-2">
                      <span><PhoneIcon className="w-4 h-4 text-gray-400" /></span>
                      <Input id="telefone" name="telefone" required placeholder="(XX) XXXXX-XXXX" value={agendamentoForm.telefone} onChange={handleAgendamentoChange} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="placa">Placa da Moto <span className="text-red-500">*</span></Label>
                    <div className="flex items-center gap-2">
                      <span><BikeIcon className="w-4 h-4 text-gray-400" /></span>
                      <Input id="placa" name="placa" required placeholder="ABC-1234 ou ABC1D23" value={agendamentoForm.placa} onChange={handleAgendamentoChange} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="tipo">Tipo de Manutenção <span className="text-red-500">*</span></Label>
                    <div className="flex items-center gap-2">
                      <span><Wrench className="w-4 h-4 text-gray-400" /></span>
                      <select id="tipo" name="tipo" required value={agendamentoForm.tipo} onChange={handleAgendamentoChange} className="w-full rounded border p-2 text-sm">
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
                      <Input id="data" name="data" type="date" required value={agendamentoForm.data} onChange={handleAgendamentoChange} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="horario">Horário Desejado <span className="text-red-500">*</span></Label>
                    <div className="flex items-center gap-2">
                      <span><Clock className="w-4 h-4 text-gray-400" /></span>
                      <Input id="horario" name="horario" type="time" required value={agendamentoForm.horario} onChange={handleAgendamentoChange} />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="obs">Observações (opcional)</Label>
                    <div className="flex items-center gap-2">
                      <span><MessageSquare className="w-4 h-4 text-gray-400" /></span>
                      <textarea id="obs" name="obs" placeholder="Descreva o problema ou detalhes adicionais aqui..." className="w-full rounded border p-2 text-sm" value={agendamentoForm.obs} onChange={handleAgendamentoChange} />
                    </div>
                  </div>
                  <div className="pt-2">
                    <Button type="submit" className="w-full bg-gradient-to-r from-violet-500 to-blue-500 text-white text-lg font-semibold flex items-center justify-center gap-2 py-3">
                      <span>Enviar Solicitação</span>
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
