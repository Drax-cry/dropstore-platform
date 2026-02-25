import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { X, Upload, Store, Loader2 } from "lucide-react";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function CreateStoreModal({ onClose, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [slogan, setSlogan] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [primaryColor, setPrimaryColor] = useState("#000000");
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [logoFile, setLogoFile] = useState<{ fileBase64: string; mimeType: string; fileName: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadLogoMutation = trpc.stores.uploadLogo.useMutation();
  const createStoreMutation = trpc.stores.create.useMutation({
    onSuccess: () => {
      toast.success("Loja criada com sucesso!");
      onSuccess();
    },
    onError: (err) => toast.error(err.message || "Erro ao criar loja"),
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

    let logoUrl: string | undefined;
    if (logoFile) {
      try {
        const result = await uploadLogoMutation.mutateAsync({ fileBase64: logoFile.fileBase64, mimeType: logoFile.mimeType, fileName: logoFile.fileName });
        logoUrl = result.url;
      } catch {
        toast.error("Erro ao fazer upload da logo");
        return;
      }
    }

    createStoreMutation.mutate({
      name: name.trim(),
      slogan: slogan.trim() || undefined,
      whatsappNumber: whatsapp.trim() || undefined,
      primaryColor,
      logoUrl,
    });
  };

  const isLoading = uploadLogoMutation.isPending || createStoreMutation.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-100 sticky top-0 bg-white">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            <div className="w-8 sm:w-9 h-8 sm:h-9 bg-black rounded-xl flex items-center justify-center flex-shrink-0">
              <Store className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">Criar nova loja</h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex-shrink-0">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Logo Upload */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Logo da loja</label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-200 rounded-xl p-4 sm:p-6 text-center cursor-pointer hover:border-gray-300 hover:bg-gray-50 transition-colors"
            >
              {logoPreview ? (
                <div className="flex flex-col items-center gap-2">
                  <img src={logoPreview} alt="Logo preview" className="w-16 sm:w-20 h-16 sm:h-20 object-contain rounded-lg" />
                  <span className="text-xs text-gray-400">Clique para alterar</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2 text-gray-400">
                  <Upload className="w-8 h-8" />
                  <span className="text-sm">Clique para fazer upload da logo</span>
                  <span className="text-xs">PNG, JPG, SVG até 5MB</span>
                </div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nome da loja <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ex: Minha Drop Store"
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
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
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Número WhatsApp</label>
            <div className="flex">
              <span className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-500">+55</span>
              <input
                type="tel"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                placeholder="11999999999"
                className="flex-1 border border-gray-200 rounded-r-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">Inclua o DDD sem espaços ou traços</p>
          </div>

          {/* Primary Color */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Cor principal</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={primaryColor}
                onChange={e => setPrimaryColor(e.target.value)}
                className="w-12 h-12 rounded-xl border border-gray-200 cursor-pointer p-1"
              />
              <div>
                <p className="text-sm font-medium text-gray-800">{primaryColor}</p>
                <p className="text-xs text-gray-400">Usada nos botões e destaques da loja</p>
              </div>
            </div>
          </div>

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
                  A criar...
                </>
              ) : (
                "Criar loja"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
