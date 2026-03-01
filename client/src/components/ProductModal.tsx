import { useState, useRef, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { X, Upload, Package, Loader2, Plus, Link, FolderOpen } from "lucide-react";
import type { Category, Subcategory } from "../../../drizzle/schema";

interface ProductData {
  id: number;
  name: string;
  brand: string | null;
  price: string;
  description: string | null;
  imageUrl: string | null;
  sizes: string | null;
  categoryId: number;
  subcategoryId: number | null;
  discountPercent: string | null;
}

interface Props {
  storeId: number;
  productId: number | null;
  editProduct?: ProductData | null;
  categories: Category[];
  subcategories: Subcategory[];
  storeCountry?: string;
  onClose: () => void;
  onSuccess: () => void;
}

// Tamanhos de roupa por país (apenas letras)
const CLOTHING_SIZES_BY_COUNTRY: Record<string, string[]> = {
  BR: ["PP", "P", "M", "G", "GG", "XGG"],
  PT: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  ES: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  AR: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
  CO: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
};

// Tamanhos de ténis/calçado por país (completos)
const SHOE_SIZES_BY_COUNTRY: Record<string, string[]> = {
  // Brasil: numeração BR 33-47 (inclui meios números)
  BR: ["33", "33.5", "34", "34.5", "35", "35.5", "36", "36.5",
       "37", "37.5", "38", "38.5", "39", "39.5", "40", "40.5",
       "41", "41.5", "42", "42.5", "43", "43.5", "44", "44.5",
       "45", "45.5", "46", "46.5", "47"],
  // Portugal/Europa: numeração EU 34-50 (inclui meios números)
  PT: ["34", "34.5", "35", "35.5", "36", "36.5", "37", "37.5",
       "38", "38.5", "39", "39.5", "40", "40.5", "41", "41.5",
       "42", "42.5", "43", "43.5", "44", "44.5", "45", "45.5",
       "46", "46.5", "47", "47.5", "48", "49", "50"],
  // Espanha: numeração EU 34-50 (inclui meios números)
  ES: ["34", "34.5", "35", "35.5", "36", "36.5", "37", "37.5",
       "38", "38.5", "39", "39.5", "40", "40.5", "41", "41.5",
       "42", "42.5", "43", "43.5", "44", "44.5", "45", "45.5",
       "46", "46.5", "47", "47.5", "48", "49", "50"],
  // Argentina: numeração AR 35-48 (inclui meios números)
  AR: ["35", "35.5", "36", "36.5", "37", "37.5", "38", "38.5",
       "39", "39.5", "40", "40.5", "41", "41.5", "42", "42.5",
       "43", "43.5", "44", "44.5", "45", "45.5", "46", "47", "48"],
  // Colômbia: numeração EU 34-48 + EUA equivalente
  CO: ["34", "35", "35.5", "36", "36.5", "37", "37.5", "38",
       "38.5", "39", "39.5", "40", "40.5", "41", "41.5", "42",
       "42.5", "43", "43.5", "44", "44.5", "45", "46", "47", "48"],
};

// Labels descritivos dos tamanhos de roupa por país
const CLOTHING_SIZE_LABELS: Record<string, Record<string, string>> = {
  BR: { PP: "PP", P: "P", M: "M", G: "G", GG: "GG", XGG: "XGG" },
  PT: { XS: "XS", S: "S", M: "M", L: "L", XL: "XL", XXL: "XXL", XXXL: "XXXL" },
  ES: { XS: "XS", S: "S", M: "M", L: "L", XL: "XL", XXL: "XXL", XXXL: "XXXL" },
  AR: { XS: "XS", S: "S", M: "M", L: "L", XL: "XL", XXL: "XXL", XXXL: "XXXL" },
  CO: { XS: "XS", S: "S", M: "M", L: "L", XL: "XL", XXL: "XXL", XXXL: "XXXL" },
};

// Fallbacks
const CLOTHING_SIZES = ["PP", "P", "M", "G", "GG", "XGG"];
const SHOE_SIZES = ["34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45"];

// Ordem canónica de todos os tamanhos conhecidos
// Calçado com meios números intercalados (33, 33.5, 34, 34.5, ...)
const SHOE_SIZE_ORDER: string[] = Array.from({ length: 35 }, (_, i) => {
  const base = 33 + i * 0.5;
  return String(base);
});

const SIZE_ORDER: string[] = [
  // Roupa Brasil
  "PP", "P", "M", "G", "GG", "XGG",
  // Roupa internacional (do menor para o maior)
  "XS", "S", "L", "XL", "XXL", "XXXL",
  // Calçado com meios números intercalados
  ...SHOE_SIZE_ORDER,
];

function sortSizes(sizes: string[]): string[] {
  return [...sizes].sort((a, b) => {
    const ia = SIZE_ORDER.indexOf(a);
    const ib = SIZE_ORDER.indexOf(b);
    // Ambos na ordem canónica
    if (ia !== -1 && ib !== -1) return ia - ib;
    // Ambos desconhecidos: tenta numérico, depois alfabético
    if (ia === -1 && ib === -1) {
      const na = parseFloat(a);
      const nb = parseFloat(b);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.localeCompare(b);
    }
    // Desconhecido vai para o fim
    return ia === -1 ? 1 : -1;
  });
}

export default function ProductModal({ storeId, productId, editProduct, categories, subcategories, storeCountry = "BR", onClose, onSuccess }: Props) {
  const isEditing = !!editProduct;

  // Tamanhos adaptados ao país da loja
  const clothingSizes = CLOTHING_SIZES_BY_COUNTRY[storeCountry] ?? CLOTHING_SIZES;
  const shoeSizes = SHOE_SIZES_BY_COUNTRY[storeCountry] ?? SHOE_SIZES;
  const clothingLabels = CLOTHING_SIZE_LABELS[storeCountry] ?? {};

  const [name, setName] = useState(editProduct?.name ?? "");
  const [brand, setBrand] = useState(editProduct?.brand ?? "");
  const [price, setPrice] = useState(editProduct?.price ?? "");
  const [description, setDescription] = useState(editProduct?.description ?? "");
  const [categoryId, setCategoryId] = useState<number | "">(editProduct?.categoryId ?? categories[0]?.id ?? "");
  const [subcategoryId, setSubcategoryId] = useState<number | "">(editProduct?.subcategoryId ?? "");
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    editProduct?.sizes ? sortSizes(JSON.parse(editProduct.sizes)) : []
  );
  const [customSize, setCustomSize] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(editProduct?.imageUrl ?? null);
  const [imageFile, setImageFile] = useState<{ fileBase64: string; mimeType: string; fileName: string } | null>(null);
  const [sizeType, setSizeType] = useState<"clothing" | "shoes" | "custom">("clothing");
  const [discountPercent, setDiscountPercent] = useState(editProduct?.discountPercent ?? "");
  const [imageInputMode, setImageInputMode] = useState<"file" | "url">("file");
  const [imageUrl, setImageUrl] = useState("");
  const [imageLoadError, setImageLoadError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state when editProduct changes
  useEffect(() => {
    if (editProduct) {
      setName(editProduct.name);
      setBrand(editProduct.brand ?? "");
      setPrice(editProduct.price);
      setDescription(editProduct.description ?? "");
      setCategoryId(editProduct.categoryId);
      setSubcategoryId(editProduct.subcategoryId ?? "");
      setSelectedSizes(editProduct.sizes ? sortSizes(JSON.parse(editProduct.sizes)) : []);
      setImagePreview(editProduct.imageUrl ?? null);
      setDiscountPercent(editProduct.discountPercent ?? "");
      setImageFile(null);
      setImageUrl("");
    }
  }, [editProduct?.id]);

  // Converte URLs do Google Drive em links diretos de imagem
  const convertGoogleDriveUrl = (url: string): string => {
    // Formato: https://drive.google.com/file/d/FILE_ID/view?...
    const fileMatch = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (fileMatch) {
      return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;
    }
    // Formato: https://drive.google.com/open?id=FILE_ID
    const openMatch = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
    if (openMatch) {
      return `https://drive.google.com/uc?export=view&id=${openMatch[1]}`;
    }
    // Formato: https://docs.google.com/uc?id=FILE_ID
    const docsMatch = url.match(/docs\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
    if (docsMatch) {
      return `https://drive.google.com/uc?export=view&id=${docsMatch[1]}`;
    }
    return url;
  };

  const handleImageUrlChange = (url: string) => {
    const trimmed = url.trim();
    setImageUrl(url);
    setImageLoadError(false);
    if (trimmed) {
      const converted = convertGoogleDriveUrl(trimmed);
      setImagePreview(converted);
      setImageFile(null);
    } else {
      setImagePreview(null);
    }
  };

  const uploadImageMutation = trpc.products.uploadImage.useMutation();

  const createProductMutation = trpc.products.create.useMutation({
    onSuccess: () => {
      toast.success("Produto adicionado!");
      onSuccess();
    },
    onError: (err) => toast.error(err.message || "Erro ao criar produto"),
  });

  const updateProductMutation = trpc.products.update.useMutation({
    onSuccess: () => {
      toast.success("Produto atualizado!");
      onSuccess();
    },
    onError: (err) => toast.error(err.message || "Erro ao atualizar produto"),
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
    setSelectedSizes(prev => {
      const next = prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size];
      return sortSizes(next);
    });
  };

  const addCustomSize = () => {
    if (customSize.trim() && !selectedSizes.includes(customSize.trim())) {
      setSelectedSizes(prev => sortSizes([...prev, customSize.trim()]));
      setCustomSize("");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price || !categoryId) return;

    let finalImageUrl: string | undefined | null = isEditing ? editProduct?.imageUrl : undefined;

    // Se inseriu URL diretamente, usa essa URL
    if (imageInputMode === "url" && imageUrl.trim()) {
      finalImageUrl = imageUrl.trim();
    } else if (imageFile) {
      // Upload de arquivo
      try {
        const result = await uploadImageMutation.mutateAsync({
          fileBase64: imageFile.fileBase64,
          mimeType: imageFile.mimeType,
          fileName: imageFile.fileName,
          storeId,
        });
        finalImageUrl = result.url;
      } catch {
        toast.error("Erro ao fazer upload da imagem");
        return;
      }
    }

    if (isEditing && editProduct) {
      updateProductMutation.mutate({
        id: editProduct.id,
        storeId,
        categoryId: Number(categoryId),
        subcategoryId: subcategoryId ? Number(subcategoryId) : null,
        name: name.trim(),
        brand: brand.trim() || undefined,
        price,
        imageUrl: finalImageUrl ?? undefined,
        sizes: selectedSizes,
        description: description.trim() || undefined,
        discountPercent: discountPercent || null,
      });
    } else {
      createProductMutation.mutate({
        storeId,
        categoryId: Number(categoryId),
        subcategoryId: subcategoryId ? Number(subcategoryId) : undefined,
        name: name.trim(),
        brand: brand.trim() || undefined,
        price,
        imageUrl: finalImageUrl ?? undefined,
        sizes: selectedSizes,
        description: description.trim() || undefined,
        discountPercent: discountPercent || undefined,
      });
    }
  };

  const isLoading = uploadImageMutation.isPending || createProductMutation.isPending || updateProductMutation.isPending;
  const currentSizes = sizeType === "clothing" ? clothingSizes : sizeType === "shoes" ? shoeSizes : [];

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full sm:max-w-2xl max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-black rounded-xl flex items-center justify-center">
              <Package className="w-5 h-5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-gray-900">
              {isEditing ? "Editar produto" : "Novo produto"}
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

                {/* Tabs: Arquivo / URL */}
                <div className="flex gap-1 mb-3 bg-gray-100 rounded-lg p-1">
                  <button
                    type="button"
                    onClick={() => {
                      setImageInputMode("file");
                      setImageUrl("");
                      setImageLoadError(false);
                      setImagePreview(isEditing ? editProduct?.imageUrl ?? null : null);
                      setImageFile(null);
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      imageInputMode === "file" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <FolderOpen className="w-3.5 h-3.5" />
                    Arquivo
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImageInputMode("url");
                      setImageFile(null);
                      setImageLoadError(false);
                      // Se estiver editando e tiver imageUrl existente, preenche o campo
                      const existingUrl = isEditing ? editProduct?.imageUrl ?? "" : "";
                      if (existingUrl && !imageUrl) {
                        setImageUrl(existingUrl);
                        setImagePreview(existingUrl);
                      }
                    }}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                      imageInputMode === "url" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    <Link className="w-3.5 h-3.5" />
                    URL
                  </button>
                </div>

                {imageInputMode === "file" ? (
                  <>
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
                    {isEditing && imagePreview && (
                      <p className="text-xs text-gray-400 mt-1">Clique na imagem para substituir</p>
                    )}
                  </>
                ) : (
                  <>
                    <input
                      type="text"
                      value={imageUrl}
                      onChange={e => handleImageUrlChange(e.target.value)}
                      onPaste={e => {
                        const pasted = e.clipboardData.getData("text");
                        if (pasted) {
                          setTimeout(() => handleImageUrlChange(pasted), 0);
                        }
                      }}
                      placeholder="Cole URL ou link do Google Drive..."
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black mb-1"
                      autoFocus
                    />
                    {imageUrl && convertGoogleDriveUrl(imageUrl.trim()) !== imageUrl.trim() && (
                      <p className="text-xs text-blue-600 mb-2">🔗 Link do Google Drive detectado e convertido automaticamente</p>
                    )}
                    {!imageUrl && (
                      <p className="text-xs text-gray-400 mb-2">Suporta links do Google Drive, Imgur, e outros</p>
                    )}
                    <div className="border-2 border-dashed border-gray-200 rounded-xl overflow-hidden aspect-square flex items-center justify-center bg-gray-50">
                      {imagePreview && !imageLoadError ? (
                        <img
                          src={imagePreview}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onLoad={() => setImageLoadError(false)}
                          onError={() => setImageLoadError(true)}
                        />
                      ) : imageLoadError ? (
                        <div className="flex flex-col items-center gap-2 text-red-400 p-6">
                          <Link className="w-8 h-8" />
                          <span className="text-xs text-center">Não foi possível carregar a imagem. Verifique a URL.</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-gray-400 p-6">
                          <Link className="w-8 h-8" />
                          <span className="text-sm text-center">Cole a URL da imagem acima</span>
                        </div>
                      )}
                    </div>
                    {imagePreview && !imageLoadError && (
                      <p className="text-xs text-green-600 mt-1">✓ Imagem carregada com sucesso</p>
                    )}
                  </>
                )}
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
                  Preço <span className="text-red-500">*</span>
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

              {/* Discount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Desconto (%)</label>
                <div className="flex">
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max="99"
                    value={discountPercent}
                    onChange={e => setDiscountPercent(e.target.value)}
                    placeholder="Ex: 10"
                    className="flex-1 border border-gray-200 rounded-l-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <span className="flex items-center px-3 bg-gray-50 border border-l-0 border-gray-200 rounded-r-xl text-sm text-gray-500">%</span>
                </div>
                {discountPercent && price && (
                  <p className="text-xs text-green-600 mt-1">
                    Preço com desconto: R$ {(parseFloat(price) * (1 - parseFloat(discountPercent) / 100)).toFixed(2)}
                  </p>
                )}
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
                  {type === "clothing"
                    ? `Roupas (${clothingSizes.slice(0,3).join("/")})`
                    : type === "shoes"
                    ? `Tênis (${shoeSizes[0]}-${shoeSizes[shoeSizes.length-1]})`
                    : "Personalizado"}
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
                    {sizeType === "clothing" && clothingLabels[size] ? clothingLabels[size] : size}
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
              ) : isEditing ? "Guardar alterações" : "Adicionar produto"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
