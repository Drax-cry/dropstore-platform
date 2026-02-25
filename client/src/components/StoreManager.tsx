import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  ArrowLeft, Plus, Trash2, Edit2, ExternalLink, Tag, Layers, Package,
  X, Check, Loader2, Upload, ChevronDown, ChevronRight, Copy
} from "lucide-react";
import ProductModal from "./ProductModal";

interface Props {
  storeId: number;
  onBack: () => void;
}

type Tab = "categories" | "products";

export default function StoreManager({ storeId, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("categories");
  const [newCatName, setNewCatName] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [expandedCat, setExpandedCat] = useState<number | null>(null);
  const [addingSubFor, setAddingSubFor] = useState<number | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<number | null>(null);

  const utils = trpc.useUtils();

  // Store data will be fetched from categories/products queries
  const [store, setStore] = useState<{ id: number; name: string; slug: string; slogan: string | null; logoUrl: string | null; whatsappNumber: string | null; primaryColor: string | null; } | null>(null);
  const { data: categories } = trpc.categories.list.useQuery({ storeId });
  const { data: subcategories } = trpc.subcategories.listByStore.useQuery({ storeId });
  const { data: products } = trpc.products.listByStore.useQuery({ storeId });

  // Initialize store data from props or fetch it
  useEffect(() => {
    if (storeId && !store) {
      // Create a minimal store object from storeId
      setStore({
        id: storeId,
        name: "Loja",
        slug: "",
        slogan: null,
        logoUrl: null,
        whatsappNumber: null,
        primaryColor: null,
      });
    }
  }, [storeId, store]);

  const createCatMutation = trpc.categories.create.useMutation({
    onSuccess: () => {
      toast.success("Categoria criada");
      setNewCatName("");
      utils.categories.list.invalidate({ storeId });
    },
    onError: () => toast.error("Erro ao criar categoria"),
  });

  const deleteCatMutation = trpc.categories.delete.useMutation({
    onSuccess: () => {
      toast.success("Categoria eliminada");
      utils.categories.list.invalidate({ storeId });
    },
    onError: () => toast.error("Erro ao eliminar categoria"),
  });

  const createSubMutation = trpc.subcategories.create.useMutation({
    onSuccess: () => {
      toast.success("Subcategoria criada");
      setNewSubName("");
      setAddingSubFor(null);
      utils.subcategories.listByStore.invalidate({ storeId });
    },
    onError: () => toast.error("Erro ao criar subcategoria"),
  });

  const deleteSubMutation = trpc.subcategories.delete.useMutation({
    onSuccess: () => {
      toast.success("Subcategoria eliminada");
      utils.subcategories.listByStore.invalidate({ storeId });
    },
    onError: () => toast.error("Erro ao eliminar subcategoria"),
  });

  const deleteProductMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      toast.success("Produto eliminado");
      utils.products.listByStore.invalidate({ storeId });
    },
    onError: () => toast.error("Erro ao eliminar produto"),
  });

  const storeUrl = store ? `${window.location.origin}/loja/${store.slug}` : "";

  const handleCopyUrl = () => {
    if (storeUrl) {
      navigator.clipboard.writeText(storeUrl);
      toast.success("Link copiado!");
    }
  };

  if (!store) {
    return (
      <div className="text-center py-12">
        <div className="w-10 h-10 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 lg:hidden flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 truncate">{store.name}</h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1 truncate">{store.slogan}</p>
          </div>
        </div>
      </div>

      {/* Store Link */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
        <div className="min-w-0">
          <p className="text-xs text-blue-600 font-medium mb-1">Link da vitrine</p>
          <p className="text-xs sm:text-sm text-blue-900 truncate font-mono">{storeUrl}</p>
        </div>
        <button
          onClick={handleCopyUrl}
          className="flex-shrink-0 flex items-center justify-center gap-1.5 sm:gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors w-full sm:w-auto"
        >
          <Copy className="w-4 h-4" />
          <span className="hidden sm:inline">Copiar</span>
          <span className="sm:hidden">Copy</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 sm:gap-2 border-b border-gray-200 overflow-x-auto -mx-3 sm:mx-0 px-3 sm:px-0">
        {(["categories", "products"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
              activeTab === tab
                ? "border-black text-gray-900"
                : "border-transparent text-gray-600 hover:text-gray-900"
            }`}
          >
            {tab === "categories" ? (
              <span className="flex items-center gap-1.5 sm:gap-2">
                <Tag className="w-4 h-4" />
                <span className="hidden sm:inline">Categorias</span>
                <span className="sm:hidden">Cats</span>
              </span>
            ) : (
              <span className="flex items-center gap-1.5 sm:gap-2">
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Produtos</span>
                <span className="sm:hidden">Prods</span>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="space-y-4 sm:space-y-6">
        {activeTab === "categories" ? (
          <>
            {/* Create Category */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 sm:p-6">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Plus className="w-5 h-5" />
                Nova Categoria
              </h3>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={newCatName}
                  onChange={e => setNewCatName(e.target.value)}
                  placeholder="Ex: Camisetas, Calças..."
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                  onKeyDown={e => {
                    if (e.key === "Enter" && newCatName.trim()) {
                      createCatMutation.mutate({ storeId, name: newCatName.trim() });
                    }
                  }}
                />
                <button
                  onClick={() => createCatMutation.mutate({ storeId, name: newCatName.trim() })}
                  disabled={!newCatName.trim() || createCatMutation.isPending}
                  className="bg-black text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors w-full sm:w-auto"
                >
                  {createCatMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin inline" /> : "Adicionar"}
                </button>
              </div>
            </div>

            {/* Categories List */}
            <div className="space-y-3">
              {categories && categories.length > 0 ? (
                categories.map(cat => (
                  <div key={cat.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div
                      onClick={() => setExpandedCat(expandedCat === cat.id ? null : cat.id)}
                      className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Tag className="w-5 h-5 text-gray-400 flex-shrink-0" />
                        <span className="font-medium text-gray-900 truncate">{cat.name}</span>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                          {subcategories?.filter(s => s.categoryId === cat.id).length || 0}
                        </span>
                        <ChevronRight
                          className={`w-5 h-5 text-gray-400 transition-transform ${
                            expandedCat === cat.id ? "rotate-90" : ""
                          }`}
                        />
                      </div>
                    </div>

                    {expandedCat === cat.id && (
                      <div className="border-t border-gray-200 bg-gray-50 p-4 sm:p-5 space-y-4">
                        {/* Subcategories */}
                        <div className="space-y-2">
                          {subcategories
                            ?.filter(s => s.categoryId === cat.id)
                            .map(sub => (
                              <div key={sub.id} className="flex items-center justify-between bg-white p-3 rounded-lg">
                                <span className="text-sm text-gray-700 truncate flex-1">{sub.name}</span>
                  <button
                    onClick={() => deleteSubMutation.mutate({ id: sub.id })}
                                  className="p-1.5 hover:bg-red-50 rounded text-red-600 flex-shrink-0"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                        </div>

                        {/* Add Subcategory */}
                        {addingSubFor === cat.id ? (
                          <div className="flex flex-col sm:flex-row gap-2">
                            <input
                              type="text"
                              value={newSubName}
                              onChange={e => setNewSubName(e.target.value)}
                              placeholder="Ex: Nike, Adidas..."
                              className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === "Enter" && newSubName.trim()) {
                                  createSubMutation.mutate({ storeId, categoryId: cat.id, name: newSubName.trim() });
                                }
                              }}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  if (newSubName.trim()) {
                                    createSubMutation.mutate({ storeId, categoryId: cat.id, name: newSubName.trim() });
                                  }
                                }}
                                className="flex-1 sm:flex-none bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
                              >
                                <Check className="w-4 h-4 inline" />
                              </button>
                              <button
                                onClick={() => {
                                  setAddingSubFor(null);
                                  setNewSubName("");
                                }}
                                className="flex-1 sm:flex-none bg-gray-200 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-gray-300"
                              >
                                <X className="w-4 h-4 inline" />
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => setAddingSubFor(cat.id)}
                            className="w-full flex items-center justify-center gap-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                            Adicionar Marca
                          </button>
                        )}
                      </div>
                    )}

                    {/* Delete Category Button */}
                    <div className="border-t border-gray-200 bg-gray-50 px-4 sm:px-5 py-3 flex justify-end">
                      <button
                        onClick={() => deleteCatMutation.mutate({ id: cat.id })}
                        className="text-sm text-red-600 hover:text-red-700 font-medium flex items-center gap-1"
                      >
                        <Trash2 className="w-4 h-4" />
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-xl">
                  <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Nenhuma categoria criada</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* Add Product Button */}
            <button
              onClick={() => setShowProductModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-black text-white px-4 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Novo Produto
            </button>

            {/* Products Grid */}
            {products && products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map(product => (
                  <div key={product.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-gray-300 transition-colors">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-40 object-cover" />
                    ) : (
                      <div className="w-full h-40 bg-gray-100 flex items-center justify-center">
                        <Package className="w-8 h-8 text-gray-300" />
                      </div>
                    )}
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">{product.name}</h4>
                      {product.brand && <p className="text-xs text-gray-500 mt-1">{product.brand}</p>}
                      <p className="text-lg font-bold text-gray-900 mt-2">R$ {Number(product.price).toFixed(2)}</p>
                      <div className="flex gap-2 mt-4">
                        <button
                          onClick={() => deleteProductMutation.mutate({ id: product.id, storeId })}
                          className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span className="hidden sm:inline">Eliminar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500">Nenhum produto adicionado</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Product Modal */}
      {showProductModal && (
        <ProductModal
          storeId={storeId}
          productId={editingProduct}
          categories={categories || []}
          subcategories={subcategories || []}
          onClose={() => {
            setShowProductModal(false);
            setEditingProduct(null);
          }}
          onSuccess={() => {
            utils.products.listByStore.invalidate({ storeId });
            setShowProductModal(false);
            setEditingProduct(null);
          }}
        />
      )}
    </div>
  );
}
