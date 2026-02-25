import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Upload, Trash2, ImageIcon, Loader2, Plus, ArrowUp, ArrowDown } from "lucide-react";

interface Props {
  storeId: number;
}

export default function BannerManager({ storeId }: Props) {
  const [uploading, setUploading] = useState(false);
  const [bannerTitle, setBannerTitle] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();

  const { data: banners, isLoading } = trpc.banners.list.useQuery({ storeId });

  const uploadMutation = trpc.banners.uploadImage.useMutation();
  const createMutation = trpc.banners.create.useMutation({
    onSuccess: () => {
      utils.banners.list.invalidate({ storeId });
      setBannerTitle("");
      toast.success("Banner adicionado!");
    },
    onError: (err) => toast.error(err.message || "Erro ao adicionar banner"),
  });

  const deleteMutation = trpc.banners.delete.useMutation({
    onSuccess: () => {
      utils.banners.list.invalidate({ storeId });
      toast.success("Banner removido");
    },
    onError: () => toast.error("Erro ao remover banner"),
  });

  const reorderMutation = trpc.banners.reorder.useMutation({
    onSuccess: () => utils.banners.list.invalidate({ storeId }),
  });

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 10MB.");
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const result = ev.target?.result as string;
        const base64 = result.split(",")[1];

        const { url } = await uploadMutation.mutateAsync({
          fileBase64: base64,
          mimeType: file.type,
          fileName: file.name,
          storeId,
        });

        await createMutation.mutateAsync({
          storeId,
          imageUrl: url,
          title: bannerTitle.trim() || undefined,
          order: (banners?.length ?? 0),
        });
      };
      reader.readAsDataURL(file);
    } catch {
      toast.error("Erro ao fazer upload do banner");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleMoveUp = (index: number) => {
    if (!banners || index === 0) return;
    const current = banners[index];
    const prev = banners[index - 1];
    reorderMutation.mutate({ id: current.id, storeId, order: index - 1 });
    reorderMutation.mutate({ id: prev.id, storeId, order: index });
  };

  const handleMoveDown = (index: number) => {
    if (!banners || index === banners.length - 1) return;
    const current = banners[index];
    const next = banners[index + 1];
    reorderMutation.mutate({ id: current.id, storeId, order: index + 1 });
    reorderMutation.mutate({ id: next.id, storeId, order: index });
  };

  return (
    <div className="space-y-4">
      {/* Upload area */}
      <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 bg-gray-50">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <div className="flex-1">
            <input
              type="text"
              value={bannerTitle}
              onChange={e => setBannerTitle(e.target.value)}
              placeholder="Título do banner (opcional)"
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
            />
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 bg-black text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 whitespace-nowrap"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                A enviar...
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                Adicionar banner
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
          <ImageIcon className="w-3.5 h-3.5" />
          Recomendado: 1200×400px. Formatos: JPG, PNG, WebP. Máximo 10MB.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Banner list */}
      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
        </div>
      ) : banners && banners.length > 0 ? (
        <div className="space-y-3">
          {banners.map((banner, index) => (
            <div
              key={banner.id}
              className="flex items-center gap-3 bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-gray-200 transition-all group"
            >
              {/* Preview */}
              <div className="w-24 h-16 flex-shrink-0 bg-gray-100 overflow-hidden">
                <img
                  src={banner.imageUrl}
                  alt={banner.title ?? `Banner ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0 py-2">
                <p className="text-sm font-medium text-gray-800 truncate">
                  {banner.title || `Banner ${index + 1}`}
                </p>
                <p className="text-xs text-gray-400">Posição {index + 1}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 pr-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleMoveUp(index)}
                  disabled={index === 0}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors"
                  title="Mover para cima"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleMoveDown(index)}
                  disabled={index === (banners?.length ?? 0) - 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 disabled:opacity-30 transition-colors"
                  title="Mover para baixo"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    if (confirm("Remover este banner?")) {
                      deleteMutation.mutate({ id: banner.id, storeId });
                    }
                  }}
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  title="Remover banner"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-10 text-gray-400">
          <ImageIcon className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm font-medium mb-1">Nenhum banner adicionado</p>
          <p className="text-xs">Adicione banners para exibir no topo da sua loja</p>
        </div>
      )}
    </div>
  );
}
