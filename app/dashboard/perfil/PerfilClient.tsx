"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  User, Shield, Sparkles, Building2, UploadCloud, 
  Trash2, ArrowLeft, Loader2, Save, CheckCircle, 
  Phone, CreditCard, Award, FileText, Image as ImageIcon 
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PerfilClient() {
  const router = useRouter();
  
  // Estados do formulário
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [professionalType, setProfessionalType] = useState("");
  const [creaCrtq, setCreaCrtq] = useState("");
  const [conselhoEstado, setConselhoEstado] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Estados de controle
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Referências para inputs de arquivos
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Busca dados de perfil ao carregar
  useEffect(() => {
    fetch("/api/user/profile")
      .then((res) => {
        if (!res.ok) throw new Error("Falha ao buscar perfil");
        return res.json();
      })
      .then((data) => {
        setName(data.name || "");
        setEmail(data.email || "");
        setProfessionalType(data.professionalType || "outro");
        setCreaCrtq(data.creaCrtq || "");
        setConselhoEstado(data.conselhoEstado || "");
        setCpfCnpj(data.cpfCnpj || "");
        setPhone(data.phone || "");
        setLogoUrl(data.logoUrl || "");
        setAvatarUrl(data.avatarUrl || "");
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg("Erro ao carregar os dados de perfil.");
        setIsLoading(false);
      });
  }, []);

  // Formatação de telefone
  const handlePhoneChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    if (clean.length <= 11) {
      // Máscara (99) 99999-9999 ou (99) 9999-9999
      let formatted = clean;
      if (clean.length > 2) {
        formatted = `(${clean.slice(0, 2)}) ` + clean.slice(2);
      }
      if (clean.length > 7) {
        formatted = `(${clean.slice(0, 2)}) ${clean.slice(2, 7)}-${clean.slice(7)}`;
      }
      setPhone(formatted);
    }
  };

  // Formatação de CPF/CNPJ
  const handleCpfCnpjChange = (val: string) => {
    const clean = val.replace(/\D/g, "");
    if (clean.length <= 14) {
      let formatted = clean;
      if (clean.length > 11) {
        // CNPJ: 99.999.999/9999-99
        formatted = `${clean.slice(0, 2)}.${clean.slice(2, 5)}.${clean.slice(5, 8)}/${clean.slice(8, 12)}-${clean.slice(12)}`;
      } else if (clean.length > 9) {
        // CPF: 999.999.999-99
        formatted = `${clean.slice(0, 3)}.${clean.slice(3, 6)}.${clean.slice(6, 9)}-${clean.slice(9)}`;
      }
      setCpfCnpj(formatted);
    }
  };

  // Upload genérico
  const uploadFile = async (file: File, type: "logo" | "avatar") => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", type);

    const res = await fetch("/api/user/upload", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Falha no upload do arquivo");
    return data.url;
  };

  // Evento de upload de Avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingAvatar(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const url = await uploadFile(file, "avatar");
      setAvatarUrl(url);
      setSuccessMsg("Foto de perfil alterada com sucesso! Clique em 'Salvar Configurações' para persistir.");
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao carregar foto do avatar.");
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  // Evento de upload de Logotipo
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingLogo(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const url = await uploadFile(file, "logo");
      setLogoUrl(url);
      setSuccessMsg("Logotipo corporativo carregado com sucesso! Clique em 'Salvar Configurações' para persistir.");
    } catch (err: any) {
      setErrorMsg(err.message || "Erro ao carregar logotipo.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  // Submeter formulário de perfil
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validações
    if (!name.trim()) {
      setErrorMsg("O Nome do Responsável Técnico é obrigatório.");
      setIsSaving(false);
      return;
    }

    if (professionalType === "agronomo") {
      if (!creaCrtq.trim()) {
        setErrorMsg("O preenchimento do CREA/CRTQ é obrigatório para Engenheiros Agrônomos.");
        setIsSaving(false);
        return;
      }
      if (!conselhoEstado.trim()) {
        setErrorMsg("O Estado do Conselho (UF) é obrigatório para Engenheiros Agrônomos.");
        setIsSaving(false);
        return;
      }
    }

    try {
      const res = await fetch("/api/user/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          professionalType,
          creaCrtq: creaCrtq.trim(),
          conselhoEstado,
          cpfCnpj,
          phone,
          logoUrl,
          avatarUrl,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao salvar perfil");

      setSuccessMsg("Configurações salvas e aplicadas com sucesso!");
      
      // Força a atualização do Header
      router.refresh();
      
      // Limpa mensagem de sucesso depois de 5s
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (err: any) {
      setErrorMsg(err.message || "Ocorreu um erro ao salvar o perfil.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col justify-between selection:bg-emerald-200">
        <Header />
        <div className="flex-1 flex flex-col items-center justify-center py-20">
          <Loader2 className="h-10 w-10 text-emerald-800 animate-spin" />
          <p className="text-sm font-bold text-neutral-600 mt-4">Carregando perfil...</p>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-900 flex flex-col selection:bg-emerald-200">
      <Header />

      <main className="flex-1 container mx-auto max-w-4xl px-4 py-8 lg:py-12">
        <div className="space-y-6">
          
          {/* Top Link e Título */}
          <div>
            <Link 
              href="/admin" 
              className="inline-flex items-center text-xs font-bold text-neutral-500 hover:text-neutral-900 mb-4 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              Voltar ao Dashboard
            </Link>
            <h1 className="text-2xl font-extrabold tracking-tight text-neutral-900 sm:text-3xl">
              Configurações de Perfil
            </h1>
            <p className="text-neutral-550 text-sm mt-1">
              Personalize suas informações cadastrais e dados que constarão na identificação e cabeçalho dos seus laudos técnicos em PDF.
            </p>
          </div>

          {/* Mensagens de feedback */}
          {errorMsg && (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-xs font-bold flex items-center gap-3 animate-in fade-in duration-200">
              <Shield className="h-5 w-5 text-red-650 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded-xl border border-emerald-250 bg-emerald-50 text-emerald-850 text-xs font-bold flex items-center gap-3 animate-in fade-in duration-200">
              <CheckCircle className="h-5 w-5 text-emerald-700 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Form principal */}
          <form onSubmit={handleSaveProfile} className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Bloco da Esquerda (Avatar e Logotipo) - 4 cols */}
            <div className="md:col-span-4 space-y-6">
              
              {/* Card 1: Avatar */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs flex flex-col items-center text-center space-y-4">
                <h3 className="text-xs font-extrabold text-neutral-800 uppercase tracking-wider">Foto do Profissional</h3>
                
                <div className="relative group w-28 h-28">
                  {avatarUrl ? (
                    <img 
                      src={avatarUrl} 
                      alt="Avatar" 
                      className="w-full h-full object-cover rounded-full border border-neutral-200 shadow-inner" 
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-neutral-100 flex items-center justify-center border-2 border-dashed border-neutral-250 text-neutral-400">
                      <User className="w-12 h-12" />
                    </div>
                  )}
                  {isUploadingAvatar && (
                    <div className="absolute inset-0 bg-white/70 rounded-full flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-emerald-800 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <input 
                    type="file" 
                    ref={avatarInputRef}
                    onChange={handleAvatarUpload}
                    accept="image/*"
                    className="hidden" 
                  />
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={isUploadingAvatar}
                    className="w-full py-2 px-3 border border-neutral-300 rounded-xl bg-white hover:bg-neutral-50 text-xs font-bold text-neutral-700 transition-colors cursor-pointer"
                  >
                    {avatarUrl ? "Alterar Foto" : "Carregar Foto"}
                  </button>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={() => setAvatarUrl("")}
                      className="w-full py-1.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-[10px] font-bold text-red-650 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remover Foto
                    </button>
                  )}
                </div>
              </div>

              {/* Card 2: Logotipo corporativo */}
              <div className="bg-white border border-neutral-200 rounded-2xl p-6 shadow-2xs flex flex-col items-center text-center space-y-4">
                <div className="space-y-1">
                  <h3 className="text-xs font-extrabold text-neutral-800 uppercase tracking-wider">Logotipo corporativo</h3>
                  <p className="text-[9.5px] text-neutral-400 leading-normal">Ideal para cabeçalho do laudo PDF (tamanho recomendado: 400x120px)</p>
                </div>

                <div className="w-full aspect-[3/1] bg-neutral-50 border border-neutral-200 rounded-xl overflow-hidden flex items-center justify-center p-2 relative">
                  {logoUrl ? (
                    <img 
                      src={logoUrl} 
                      alt="Logo da Consultoria" 
                      className="max-w-full max-h-full object-contain" 
                    />
                  ) : (
                    <div className="text-center text-neutral-400 p-3">
                      <ImageIcon className="w-6 h-6 mx-auto mb-1 text-neutral-300" />
                      <span className="text-[10px] font-medium block">Sem Logotipo</span>
                    </div>
                  )}
                  {isUploadingLogo && (
                    <div className="absolute inset-0 bg-white/70 flex items-center justify-center">
                      <Loader2 className="h-6 w-6 text-emerald-800 animate-spin" />
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2 w-full">
                  <input 
                    type="file" 
                    ref={logoInputRef}
                    onChange={handleLogoUpload}
                    accept="image/*"
                    className="hidden" 
                  />
                  <button
                    type="button"
                    onClick={() => logoInputRef.current?.click()}
                    disabled={isUploadingLogo}
                    className="w-full py-2 px-3 border border-neutral-300 rounded-xl bg-white hover:bg-neutral-50 text-xs font-bold text-neutral-700 transition-colors cursor-pointer"
                  >
                    {logoUrl ? "Substituir Logo" : "Carregar Logotipo"}
                  </button>
                  {logoUrl && (
                    <button
                      type="button"
                      onClick={() => setLogoUrl("")}
                      className="w-full py-1.5 px-3 rounded-xl bg-red-50 hover:bg-red-100 text-[10px] font-bold text-red-650 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remover Logotipo
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Bloco da Direita (Formulário de Informações) - 8 cols */}
            <div className="md:col-span-8 bg-white border border-neutral-200 rounded-2xl p-6 md:p-8 shadow-2xs space-y-6">
              
              <h3 className="text-xs font-extrabold text-neutral-800 uppercase tracking-wider border-b pb-3 border-neutral-100">
                Dados Cadastrais e Profissionais
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Nome / Responsável Técnico */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Responsável Técnico *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-450" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Nome completo que sairá nos relatórios"
                      className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-sm transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-neutral-800"
                      required
                    />
                  </div>
                </div>

                {/* Email (Apenas leitura) */}
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-neutral-400 uppercase mb-1">
                    E-mail da Conta (Não editável)
                  </label>
                  <input
                    type="email"
                    value={email}
                    disabled
                    className="w-full px-3 py-2 border border-neutral-200 bg-neutral-50 text-neutral-500 rounded-lg text-sm cursor-not-allowed"
                  />
                </div>

                {/* Tipo de Profissional */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Tipo de Profissional
                  </label>
                  <select
                    value={professionalType}
                    onChange={(e) => {
                      setProfessionalType(e.target.value);
                      if (e.target.value !== "agronomo") {
                        // Limpa os campos obrigatórios do agrônomo se mudar
                        setErrorMsg(null);
                      }
                    }}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-lg text-sm bg-white transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-neutral-800"
                  >
                    <option value="agronomo">Engenheiro Agrônomo</option>
                    <option value="tecnico">Técnico Agrícola</option>
                    <option value="produtor">Produtor Rural</option>
                    <option value="consultor">Consultor Técnico</option>
                    <option value="outro">Outro / Profissional do Campo</option>
                  </select>
                </div>

                {/* Telefone / WhatsApp */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    Telefone / WhatsApp
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-450" />
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => handlePhoneChange(e.target.value)}
                      placeholder="(99) 99999-9999"
                      className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-sm transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-neutral-800"
                    />
                  </div>
                </div>

                {/* CPF ou CNPJ */}
                <div>
                  <label className="block text-xs font-bold text-neutral-700 uppercase mb-1">
                    CPF ou CNPJ
                  </label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-450" />
                    <input
                      type="text"
                      value={cpfCnpj}
                      onChange={(e) => handleCpfCnpjChange(e.target.value)}
                      placeholder="000.000.000-00"
                      className="w-full pl-9 pr-3 py-2 border border-neutral-300 rounded-lg text-sm transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-neutral-800"
                    />
                  </div>
                </div>

                {/* Conselho Profissional (CREA/CRTQ) */}
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1 ${professionalType === "agronomo" ? "text-neutral-700" : "text-neutral-400"}`}>
                    Nº do CREA / CRTQ {professionalType === "agronomo" && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-450" />
                    <input
                      type="text"
                      value={creaCrtq}
                      onChange={(e) => setCreaCrtq(e.target.value)}
                      placeholder={professionalType === "agronomo" ? "Obrigatório" : "Opcional"}
                      required={professionalType === "agronomo"}
                      disabled={professionalType !== "agronomo" && professionalType !== "tecnico"}
                      className={`w-full pl-9 pr-3 py-2 border rounded-lg text-sm transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-neutral-800 ${
                        professionalType !== "agronomo" && professionalType !== "tecnico"
                          ? "bg-neutral-50 text-neutral-400 border-neutral-200 cursor-not-allowed"
                          : "border-neutral-300"
                      }`}
                    />
                  </div>
                </div>

                {/* Estado do Conselho (UF) */}
                <div>
                  <label className={`block text-xs font-bold uppercase mb-1 ${professionalType === "agronomo" ? "text-neutral-700" : "text-neutral-400"}`}>
                    UF do Conselho {professionalType === "agronomo" && <span className="text-red-500">*</span>}
                  </label>
                  <select
                    value={conselhoEstado}
                    onChange={(e) => setConselhoEstado(e.target.value)}
                    required={professionalType === "agronomo"}
                    disabled={professionalType !== "agronomo" && professionalType !== "tecnico"}
                    className={`w-full px-3 py-2 border rounded-lg text-sm bg-white transition-colors focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-neutral-800 ${
                      professionalType !== "agronomo" && professionalType !== "tecnico"
                        ? "bg-neutral-50 text-neutral-450 border-neutral-200 cursor-not-allowed"
                        : "border-neutral-300"
                    }`}
                  >
                    <option value="">Selecione...</option>
                    <option value="AC">Acre</option>
                    <option value="AL">Alagoas</option>
                    <option value="AP">Amapá</option>
                    <option value="AM">Amazonas</option>
                    <option value="BA">Bahia</option>
                    <option value="CE">Ceará</option>
                    <option value="DF">Distrito Federal</option>
                    <option value="ES">Espírito Santo</option>
                    <option value="GO">Goiás</option>
                    <option value="MA">Maranhão</option>
                    <option value="MT">Mato Grosso</option>
                    <option value="MS">Mato Grosso do Sul</option>
                    <option value="MG">Minas Gerais</option>
                    <option value="PA">Pará</option>
                    <option value="PB">Paraíba</option>
                    <option value="PR">Paraná</option>
                    <option value="PE">Pernambuco</option>
                    <option value="PI">Piauí</option>
                    <option value="RJ">Rio de Janeiro</option>
                    <option value="RN">Rio Grande do Norte</option>
                    <option value="RS">Rio Grande do Sul</option>
                    <option value="RO">Rondônia</option>
                    <option value="RR">Roraima</option>
                    <option value="SC">Santa Catarina</option>
                    <option value="SP">São Paulo</option>
                    <option value="SE">Sergipe</option>
                    <option value="TO">Tocantins</option>
                  </select>
                </div>

              </div>

              {/* Botões do Rodapé */}
              <div className="pt-6 border-t border-neutral-100 flex flex-col sm:flex-row justify-end gap-3">
                <Link
                  href="/admin"
                  className="px-5 py-3 border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  Cancelar
                </Link>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-3 bg-emerald-800 hover:bg-emerald-900 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow transition-all active:scale-[0.98] disabled:opacity-60 cursor-pointer"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Salvar Configurações
                    </>
                  )}
                </button>
              </div>

            </div>

          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
