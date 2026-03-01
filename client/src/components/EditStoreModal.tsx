import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  X, Upload, Store, Loader2, Check, MapPin, Phone, Mail,
  Instagram, Facebook, Youtube, Music2
} from "lucide-react";

const COUNTRIES = [
  { code: "BR", name: "Brasil", flag: "🇧🇷", prefix: "+55", currency: "BRL", symbol: "R$" },
  { code: "PT", name: "Portugal", flag: "🇵🇹", prefix: "+351", currency: "EUR", symbol: "€" },
  { code: "ES", name: "Espanha", flag: "🇪🇸", prefix: "+34", currency: "EUR", symbol: "€" },
  { code: "AR", name: "Argentina", flag: "🇦🇷", prefix: "+54", currency: "ARS", symbol: "$" },
  { code: "CO", name: "Colômbia", flag: "🇨🇴", prefix: "+57", currency: "COP", symbol: "COP" },
];

interface StoreData {
  id: number;
  name: string;
  slogan: string | null;
  logoUrl: string | null;
  whatsappNumber: string | null;
  primaryColor: string | null;
  country: string | null;
  currency: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  instagram?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  youtube?: string | null;
}

interface Props {
  store: StoreData;
  onClose: () => void;
  onSuccess: () => void;
}

type TabKey = "info" | "contact" | "social";

export default function EditStoreModal({ store, onClose, onSuccess }: Props) {
  const [activeTab, setActiveTab] = useState<TabKey>("info");

  // Info tab
  const [name, setName] = useState(store.name);
  const [slogan, setSlogan] = useState(store.slogan ?? "");

  // Remove o prefixo do número ao inicializar para evitar duplicação ao salvar
  const stripPrefix = (number: string, prefix: string) => {
    const digits = number.replace(/\D/g, "");
    const prefixDigits = prefix.replace(/\D/g, "");
    if (digits.startsWith(prefixDigits)) {
      return digits.slice(prefixDigits.length);
    }
    return digits;
  };

  const initialCountry = COUNTRIES.find(c => c.code === store.country) ?? COUNTRIES[0];
  const [whatsapp, setWhatsapp] = useState(() => {
    if (!store.whatsappNumber) return "";
    return stripPrefix(store.whatsappNumber, initialCountry.prefix);
  });
  const [primaryColor, setPrimaryColor] = useState(store.primaryColor ?? "#000000");
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [logoPreview, setLogoPreview] = useState<string | null>(store.logoUrl ?? null);
  const [logoFile, setLogoFile] = useState<{ fileBase64: string; mimeType: string; fileName: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Contact tab
  const [address, setAddress] = useState(store.address ?? "");
  const [phone, setPhone] = useState(store.phone ?? "");
  const [email, setEmail] = useState(store.email ?? "");

  // Social tab
  const [instagram, setInstagram] = useState(store.instagram ?? "");
  const [facebook, setFacebook] = useState(store.facebook ?? "");
  const [tiktok, setTiktok] = useState(store.tiktok ?? "");
  const [youtube, setYoutube] = useState(store.youtube ?? "");

  const utils = trpc.useUtils();

  const uploadLogoMutation = trpc.stores.uploadLogo.useMutation();
  const updateStoreMutation = trpc.stores.update.useMutation({
    onSuccess: () => {
      toast.success("Loja atualizada com sucesso!");
      utils.stores.myStores.invalidate();
      onSuccess();
    },
    onError: (err) => toast.error(err.message || "Erro ao atualizar loja"),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 5MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setLogoPreview(result);
      const base64 = result.split(",")[1];
      setLogoFile({ fileBase64: base64, mimeType: file.type, fileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    let logoUrl: string | undefined = store.logoUrl ?? undefined;
    if (logoFile) {
      try {
        const result = await uploadLogoMutation.mutateAsync({
          fileBase64: logoFile.fileBase64,
          mimeType: logoFile.mimeType,
          fileName: logoFile.fileName,
        });
        logoUrl = result.url;
      } catch {
        toast.error("Erro ao fazer upload do logo");
        return;
      }
    }

    updateStoreMutation.mutate({
      id: store.id,
      name: name.trim(),
      slogan: slogan.trim() || undefined,
      logoUrl,
      whatsappNumber: whatsapp.trim()
        ? `${selectedCountry.prefix}${whatsapp.replace(/\D/g, "")}`
        : undefined,
      primaryColor,
      address: address.trim() || null,
      phone: phone.trim() || null,
      email: email.trim() || null,
      instagram: instagram.trim() || null,
      facebook: facebook.trim() || null,
      tiktok: tiktok.trim() || null,
      youtube: youtube.trim() || null,
    });
  };

  const isLoading = uploadLogoMutation.isPending || updateStoreMutation.isPending;

  const tabs: { key: TabKey; label: string }[] = [
    { key: "info", label: "Informações" },
    { key: "contact", label: "Contacto" },
    { key: "social", label: "Redes Sociais" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
              <Store className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">Editar loja</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-100 px-6">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`py-3 px-4 text-sm font-medium border-b-2 transition-colors -mb-px ${
                activeTab === tab.key
                  ? "border-black text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-600"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* ---- TAB: INFORMAÇÕES ---- */}
          {activeTab === "info" && (
            <>
              {/* Logo Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Logo da loja</label>
                <div className="flex items-center gap-4">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-200 overflow-hidden cursor-pointer hover:border-gray-400 transition-colors flex items-center justify-center bg-gray-50 flex-shrink-0"
                  >
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <Upload className="w-6 h-6 text-gray-300" />
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-sm font-medium text-gray-700 hover:text-black transition-colors border border-gray-200 px-3 py-1.5 rounded-lg"
                    >
                      {logoPreview ? "Trocar logo" : "Adicionar logo"}
                    </button>
                    <p className="text-xs text-gray-400 mt-1">PNG, JPG até 5MB</p>
                  </div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>

              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nome da loja <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Nome da sua loja"
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Slogan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Slogan</label>
                <input
                  type="text"
                  value={slogan}
                  onChange={e => setSlogan(e.target.value)}
                  placeholder="Ex: O Melhor Drop é Aqui"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* País */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">País</label>
                <div className="grid grid-cols-5 gap-2">
                  {COUNTRIES.map(country => (
                    <button
                      key={country.code}
                      type="button"
                      onClick={() => setSelectedCountry(country)}
                      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 transition-all ${
                        selectedCountry.code === country.code
                          ? "border-black bg-black/5"
                          : "border-gray-100 hover:border-gray-300"
                      }`}
                    >
                      <span className="text-xl">{country.flag}</span>
                      <span className="text-xs font-medium text-gray-600">{country.prefix}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* WhatsApp */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">WhatsApp</label>
                <div className="flex">
                  <span className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-500 whitespace-nowrap">
                    {selectedCountry.flag} {selectedCountry.prefix}
                  </span>
                  <input
                    type="tel"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    placeholder="Número sem prefixo"
                    className="flex-1 border border-gray-200 rounded-r-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* Cor principal */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor principal</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                  />
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={e => setPrimaryColor(e.target.value)}
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black font-mono"
                  />
                </div>
              </div>
            </>
          )}

          {/* ---- TAB: CONTACTO ---- */}
          {activeTab === "contact" && (
            <>
              <p className="text-xs text-gray-400 -mt-1">
                Estas informações serão exibidas no rodapé da sua vitrine pública.
              </p>

              {/* Endereço */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  Endereço físico
                </label>
                <textarea
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Ex: Rua das Flores, 123 – Centro, São Paulo – SP"
                  rows={3}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
                />
              </div>

              {/* Telefone */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-gray-400" />
                  Telefone / Fixo
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Ex: +55 11 3000-0000"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
                <p className="text-xs text-gray-400 mt-1">Diferente do WhatsApp — pode ser um número fixo ou alternativo.</p>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-gray-400" />
                  E-mail de contacto
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="Ex: contato@minhalore.com"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </>
          )}

          {/* ---- TAB: REDES SOCIAIS ---- */}
          {activeTab === "social" && (
            <>
              <p className="text-xs text-gray-400 -mt-1">
                Cole o URL completo do seu perfil (ex: https://www.instagram.com/seu_usuario/) ou apenas o nome de utilizador.
              </p>

              {/* Instagram */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Instagram className="w-4 h-4 text-gray-400" />
                  Instagram
                </label>
                <input
                  type="text"
                  value={instagram}
                  onChange={e => setInstagram(e.target.value)}
                  placeholder="https://www.instagram.com/seu_usuario/ ou seu_usuario"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Facebook */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Facebook className="w-4 h-4 text-gray-400" />
                  Facebook
                </label>
                <input
                  type="text"
                  value={facebook}
                  onChange={e => setFacebook(e.target.value)}
                  placeholder="https://www.facebook.com/sua_pagina/ ou sua_pagina"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* TikTok */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Music2 className="w-4 h-4 text-gray-400" />
                  TikTok
                </label>
                <input
                  type="text"
                  value={tiktok}
                  onChange={e => setTiktok(e.target.value)}
                  placeholder="https://www.tiktok.com/@seu_usuario/ ou seu_usuario"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* YouTube */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                  <Youtube className="w-4 h-4 text-gray-400" />
                  YouTube
                </label>
                <input
                  type="text"
                  value={youtube}
                  onChange={e => setYoutube(e.target.value)}
                  placeholder="https://www.youtube.com/c/seu_canal/ ou seu_canal"
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 border border-gray-200 text-gray-600 py-3 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isLoading || !name.trim()}
              className="flex-1 bg-black text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  A guardar...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Guardar alterações
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
