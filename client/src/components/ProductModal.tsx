import { useState, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { X, Upload, Package, Loader2, Plus } from "lucide-react";
import type { Category, Subcategory } from "../../../drizzle/schema";

interface Props {
  storeId: number;
  productId: number | null;
  categories: Category[];
  subcategories: Subcategory[];
  onClose: () => void;
  onSuccess: () => void;
}

const CLOTHING_SIZES = ["PP", "P", "M", "G", "GG", "XGG"];
const SHOE_SIZES = ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];

export default function ProductModal({ storeId, productId, categories, subcategories, onClose, onSuccess }: Props) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [categoryId, setCategoryId] = useState<number | "">(categories[0]?.id || "");
  const [subcategoryId, setSubcategoryId] = useState<number | "">("");
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [customSize, setCustomSize] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<{ fileBase64: string; mimeType: string; fileName: string } | null>(null);
  const [sizeType, setSizeType] = useState<"clothing" | "shoes" | "custom">("clothing");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const uploadImageMutation = trpc.products.uploadImage.useMutation();
  const createProductMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("Produto adicionado!");
      onSuccess();
    },
    onError: (err) => toast.error(err.message || "Erro ao criar produto"),
  });

  const filteredSubs = subcategories.filter(s => s.categoryId === Number(categoryId));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Imagem muito grande. Máximo 10MB.");
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setImagePreview(result);
      const base64 = result.split(",")[1];
      setImageFile({ fileBase64: base64, mimeType: file.type, fileName: file.name });
    };
    reader.readAsDataURL(file);
  };

  const toggleSize = (size: string) => {
    setSelectedSizes(prev =>
      prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size]
    );
  };

  const addCustomSize = () => {
    if (customSize.trim() && !selectedSizes.includes(customSize.trim())) {
      setSelectedSizes(prev => [...prev, customSize.trim()]);
      setCustomSize("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !categoryId) return;

    let imageUrl: string | undefined;
    if (imageFile) {
      try {
        const result = await uploadImageMutation.mutateAsync({ fileBase64: imageFile.fileBase64, mimeType: imageFile.mimeType, fileName: imageFile.fileName, storeId });
        imageUrl = result.url;
      } catch {
        toast.error("Erro ao fazer upload da imagem");
        return;
      }
    }

    createProductMutation.mutate({
      storeId,
      categoryId: Number(categoryId),
      subcategoryId: subcategoryId ? Number(subcategoryId) : undefined,
      name: name.trim(),
      brand: brand.trim() || undefined,
      price,
      imageUrl,
      sizes: selectedSizes,
      description: description.trim() || undefined,
    });
  };

  const isLoading = uploadImageMutation.isPending || createProductMutation.isPending;
  const currentSizes = sizeType === "clothing" ? CLOTHING_SIZES : sizeType === "shoes" ? SHOE_SIZES : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {productId ? "Editar produto" : "Novo produto"}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Left column */}
            <div className="space-y-4">
              {/* Image Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Imagem do produto</label>
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden cursor-pointer hover:border-gray-300 transition-colors aspect-square flex items-center justify-center bg-gray-50"
                >
                  {imagePreview ? (
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-gray-400 p-6">
                      <Upload className="w-8 h-8" />
                      <span className="text-sm text-center">Clique para adicionar imagem</span>
                    </div>
                  )}
                </div>
                <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Nome <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Ex: Camiseta Oversized"
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Brand */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Marca</label>
                <input
                  type="text"
                  value={brand}
                  onChange={e => setBrand(e.target.value)}
                  placeholder="Ex: Nike, Adidas..."
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Preço (R$) <span className="text-red-500">*</span>
                </label>
                <div className="flex">
                  <span className="flex items-center px-3 bg-gray-50 border border-r-0 border-gray-200 rounded-l-xl text-sm text-gray-500">R$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                    placeholder="0,00"
                    required
                    className="flex-1 border border-gray-200 rounded-r-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Categoria <span className="text-red-500">*</span>
                </label>
                <select
                  value={categoryId}
                  onChange={e => { setCategoryId(Number(e.target.value)); setSubcategoryId(""); }}
                  required
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                >
                  <option value="">Selecionar categoria</option>
                  {categories.map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Subcategory */}
              {filteredSubs.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Subcategoria / Marca</label>
                  <select
                    value={subcategoryId}
                    onChange={e => setSubcategoryId(e.target.value ? Number(e.target.value) : "")}
                    className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                  >
                    <option value="">Sem subcategoria</option>
                    {filteredSubs.map(sub => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Sizes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tamanhos disponíveis</label>
            <div className="flex gap-2 mb-3">
              {(["clothing", "shoes", "custom"] as const).map(type => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSizeType(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    sizeType === type ? "bg-black text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {type === "clothing" ? "Roupas (P/M/G)" : type === "shoes" ? "Tênis (34-45)" : "Personalizado"}
                </button>
              ))}
            </div>

            {sizeType !== "custom" && (
              <div className="flex flex-wrap gap-2 mb-3">
                {currentSizes.map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => toggleSize(size)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                      selectedSizes.includes(size)
                        ? "bg-black text-white border-black"
                        : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}

            {sizeType === "custom" && (
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={customSize}
                  onChange={e => setCustomSize(e.target.value)}
                  placeholder="Ex: Único, P/M, 42..."
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addCustomSize(); } }}
                />
                <button
                  type="button"
                  onClick={addCustomSize}
                  className="bg-black text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            )}

            {selectedSizes.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                <span className="text-xs text-gray-400 mr-1">Selecionados:</span>
                {selectedSizes.map(size => (
                  <span
                    key={size}
                    onClick={() => toggleSize(size)}
                    className="text-xs bg-black text-white px-2 py-0.5 rounded cursor-pointer hover:bg-gray-700"
                  >
                    {size} ×
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Descrição (opcional)</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Detalhes do produto..."
              rows={3}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black resize-none"
            />
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
              disabled={isLoading || !name.trim() || !price || !categoryId}
              className="flex-1 bg-black text-white py-3 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  A guardar...
                </>
              ) : (
                "Adicionar produto"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
