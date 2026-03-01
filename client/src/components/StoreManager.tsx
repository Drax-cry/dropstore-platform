import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import {
  ArrowLeft, Plus, Trash2, Edit2, ExternalLink, Tag, Layers, Package,
  X, Check, Loader2, Upload, ChevronDown, ChevronRight
} from "lucide-react";
import ProductModal from "./ProductModal";
import EditStoreModal from "./EditStoreModal";
import BannerManager from "./BannerManager";
import TrialBlockModal from "./TrialBlockModal";
import TrialCountdownBanner from "./TrialCountdownBanner";
import LanguageSwitcher from "./LanguageSwitcher";

interface Props {
  storeId: number;
  onBack: () => void;
}

type Tab = "categories" | "products" | "banners";

export default function StoreManager({ storeId, onBack }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("categories");
  const [showTrialBlock, setShowTrialBlock] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newSubName, setNewSubName] = useState("");
  const [expandedCat, setExpandedCat] = useState<number | null>(null);
  const [addingSubFor, setAddingSubFor] = useState<number | null>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showEditStoreModal, setShowEditStoreModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<number | null>(null);
  const [editingProductData, setEditingProductData] = useState<{
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
  } | null>(null);

  const utils = trpc.useUtils();
  const { t } = useTranslation();

  const { data: store } = trpc.stores.getBySlug.useQuery(
    { slug: "" },
    { enabled: false }
  );

  const { data: storeData } = trpc.stores.myStores.useQuery();
  const currentStore = storeData?.find(s => s.id === storeId);

  const { data: categories, isLoading: catsLoading } = trpc.categories.list.useQuery({ storeId });
  const { data: allSubcategories } = trpc.subcategories.listByStore.useQuery({ storeId });
  const { data: products, isLoading: productsLoading } = trpc.products.listByStore.useQuery({ storeId });

  // Check trial status
  const { data: trialStatus } = trpc.trial.checkStatus.useQuery(
    { storeId },
    { enabled: !!storeId }
  );

  // Show trial block modal if trial expired
  useEffect(() => {
    if (trialStatus && !trialStatus.isActive) {
      setShowTrialBlock(true);
    }
  }, [trialStatus]);

  const createCatMutation = trpc.categories.create.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate({ storeId });
      setNewCatName("");
      toast.success("Categoria criada!");
    },
    onError: () => toast.error("Erro ao criar categoria"),
  });

  const deleteCatMutation = trpc.categories.delete.useMutation({
    onSuccess: () => {
      utils.categories.list.invalidate({ storeId });
      toast.success("Categoria eliminada");
    },
  });

  const createSubMutation = trpc.subcategories.create.useMutation({
    onSuccess: () => {
      utils.subcategories.listByStore.invalidate({ storeId });
      setNewSubName("");
      setAddingSubFor(null);
      toast.success("Subcategoria criada!");
    },
    onError: () => toast.error("Erro ao criar subcategoria"),
  });

  const deleteSubMutation = trpc.subcategories.delete.useMutation({
    onSuccess: () => utils.subcategories.listByStore.invalidate({ storeId }),
  });

  const deleteProductMutation = trpc.products.delete.useMutation({
    onSuccess: () => {
      utils.products.listByStore.invalidate({ storeId });
      toast.success("Produto removido");
    },
  });

  const getSubsForCategory = (categoryId: number) =>
    allSubcategories?.filter(s => s.categoryId === categoryId) || [];

  const getProductsForCategory = (categoryId: number) =>
    products?.filter(p => p.categoryId === categoryId) || [];

  const initiateCheckout = async (id: number) => {
    try {
      toast.loading("A redirecionar para o pagamento...");
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: id }),
      });
      if (!response.ok) throw new Error("Erro ao criar sessão");
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de pagamento não recebida");
      }
    } catch (error) {
      toast.dismiss();
      toast.error("Erro ao iniciar pagamento. Tente novamente.");
    }
  };

  return (
    <div>
      {/* Trial Status Banner */}
      {trialStatus && trialStatus.isActive && trialStatus.status?.trialEndsAt && (
        <TrialCountdownBanner
          trialEndsAt={new Date(trialStatus.status.trialEndsAt)}
          onUpgrade={() => initiateCheckout(storeId)}
        />
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 sm:mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-500 transition-colors flex-shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">{currentStore?.name || "Loja"}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-xs sm:text-sm text-gray-400 truncate">dropstore.manus.space/loja/{currentStore?.slug}</span>
              <a
                href={`/loja/${currentStore?.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 flex-shrink-0"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <LanguageSwitcher variant="light" />
          <button
            onClick={() => setShowEditStoreModal(true)}
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <Edit2 className="w-4 h-4" />
            {t("admin.editStore") || "Editar loja"}
          </button>
          <a
            href={`/loja/${currentStore?.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 border border-gray-200 text-gray-600 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            {t("admin.viewStorefront") || "Ver vitrine"}
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-full sm:w-fit mb-6 sm:mb-8">
        {([
          { key: "categories", label: "Categorias", icon: Tag },
          { key: "products", label: "Produtos", icon: Package },
          { key: "banners", label: "Banners", icon: Layers },
        ] as const).map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Categories Tab */}
      {activeTab === "categories" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">Categorias e Subcategorias</h2>
          </div>

          {/* Add Category */}
          <div className="bg-white rounded-xl border border-gray-100 p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Nova categoria</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={e => setNewCatName(e.target.value)}
                placeholder="Nome da categoria (ex: Roupas, Tênis...)"
                className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                onKeyDown={e => {
                  if (e.key === "Enter" && newCatName.trim()) {
                    createCatMutation.mutate({ storeId, name: newCatName.trim() });
                  }
                }}
              />
              <button
                onClick={() => {
                  if (newCatName.trim()) {
                    createCatMutation.mutate({ storeId, name: newCatName.trim() });
                  }
                }}
                disabled={createCatMutation.isPending || !newCatName.trim()}
                className="bg-black text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 flex items-center gap-1.5"
              >
                {createCatMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Adicionar
              </button>
            </div>
          </div>

          {/* Categories List */}
          {catsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
          ) : categories && categories.length > 0 ? (
            <div className="space-y-2">
              {categories.map(cat => {
                const subs = getSubsForCategory(cat.id);
                const isExpanded = expandedCat === cat.id;
                return (
                  <div key={cat.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                    <div className="flex items-center justify-between p-4">
                      <button
                        onClick={() => setExpandedCat(isExpanded ? null : cat.id)}
                        className="flex items-center gap-3 flex-1 text-left"
                      >
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />}
                        <div>
                          <p className="font-medium text-gray-800">{cat.name}</p>
                          <p className="text-xs text-gray-400">{subs.length} subcategoria{subs.length !== 1 ? "s" : ""}</p>
                        </div>
                      </button>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => setAddingSubFor(addingSubFor === cat.id ? null : cat.id)}
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                          title="Adicionar subcategoria"
                        >
                          <Layers className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Eliminar esta categoria e todas as suas subcategorias?")) {
                              deleteCatMutation.mutate({ id: cat.id });
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Add Subcategory */}
                    {addingSubFor === cat.id && (
                      <div className="px-4 pb-3 border-t border-gray-50 pt-3 bg-gray-50">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={newSubName}
                            onChange={e => setNewSubName(e.target.value)}
                            placeholder="Nome da subcategoria (ex: Nike, Adidas...)"
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black bg-white"
                            autoFocus
                          />
                          <button
                            onClick={() => {
                              if (newSubName.trim()) {
                                createSubMutation.mutate({ storeId, categoryId: cat.id, name: newSubName.trim() });
                              }
                            }}
                            disabled={createSubMutation.isPending || !newSubName.trim()}
                            className="bg-black text-white px-3 py-2 rounded-lg text-sm hover:bg-gray-800 transition-colors disabled:opacity-50"
                          >
                            {createSubMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => { setAddingSubFor(null); setNewSubName(""); }}
                            className="p-2 rounded-lg hover:bg-gray-200 text-gray-400 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Subcategories */}
                    {isExpanded && subs.length > 0 && (
                      <div className="border-t border-gray-50 divide-y divide-gray-50">
                        {subs.map(sub => (
                          <div key={sub.id} className="flex items-center justify-between px-6 py-2.5 bg-gray-50/50">
                            <div className="flex items-center gap-2">
                              <div className="w-1.5 h-1.5 bg-gray-300 rounded-full" />
                              <span className="text-sm text-gray-600">{sub.name}</span>
                            </div>
                            <button
                              onClick={() => deleteSubMutation.mutate({ id: sub.id })}
                              className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <Tag className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">Nenhuma categoria criada ainda</p>
            </div>
          )}
        </div>
      )}

      {/* Products Tab */}
      {activeTab === "products" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">Produtos</h2>
            <button
              onClick={() => { setEditingProduct(null); setShowProductModal(true); }}
              disabled={!categories || categories.length === 0}
              className="flex items-center gap-2 bg-black text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title={!categories || categories.length === 0 ? "Crie uma categoria primeiro" : ""}
            >
              <Plus className="w-4 h-4" />
              Novo produto
            </button>
          </div>

          {(!categories || categories.length === 0) && (
            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 text-sm text-amber-700">
              Crie pelo menos uma categoria antes de adicionar produtos.
            </div>
          )}

          {productsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 animate-pulse">
                  <div className="h-32 bg-gray-200 rounded-lg mb-3" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : products && products.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {products.map(product => {
                const category = categories?.find(c => c.id === product.categoryId);
                const sub = allSubcategories?.find(s => s.id === product.subcategoryId);
                const sizes = product.sizes ? JSON.parse(product.sizes) : [];
                return (
                  <div key={product.id} className="bg-white rounded-xl border border-gray-100 overflow-hidden hover:border-gray-200 hover:shadow-md transition-all group">
                    <div className="aspect-square bg-gray-100 relative overflow-hidden">
                      {product.imageUrl ? (
                        <img src={product.imageUrl} alt={product.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-10 h-10 text-gray-300" />
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            setEditingProduct(product.id);
                            setEditingProductData({
                              id: product.id,
                              name: product.name,
                              brand: product.brand,
                              price: product.price,
                              description: product.description ?? null,
                              imageUrl: product.imageUrl,
                              sizes: product.sizes,
                              categoryId: product.categoryId,
                              subcategoryId: product.subcategoryId,
                              discountPercent: product.discountPercent ?? null,
                            });
                            setShowProductModal(true);
                          }}
                          className="p-1.5 bg-white rounded-lg shadow text-gray-500 hover:text-gray-800"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm("Remover este produto?")) {
                              deleteProductMutation.mutate({ id: product.id, storeId });
                            }
                          }}
                          className="p-1.5 bg-white rounded-lg shadow text-gray-500 hover:text-red-500"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="p-3">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium text-gray-800 text-sm leading-tight">{product.name}</p>
                        <span className="text-sm font-bold text-gray-900 whitespace-nowrap">
                          R$ {Number(product.price).toFixed(2)}
                        </span>
                      </div>
                      {product.brand && <p className="text-xs text-gray-400 mb-1">{product.brand}</p>}
                      <div className="flex items-center gap-1.5 flex-wrap mt-2">
                        {category && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">{category.name}</span>
                        )}
                        {sub && (
                          <span className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full">{sub.name}</span>
                        )}
                      </div>
                      {sizes.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-2">
                          {sizes.map((s: string) => (
                            <span key={s} className="text-xs border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded">{s}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium mb-1">Nenhum produto adicionado</p>
              <p className="text-xs">Clique em "Novo produto" para começar</p>
            </div>
          )}
        </div>
      )}

      {/* Banners Tab */}
      {activeTab === "banners" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-800">Banners da loja</h2>
              <p className="text-xs text-gray-400 mt-0.5">Exibidos em carrossel no topo da vitrine</p>
            </div>
          </div>
          <BannerManager storeId={storeId} />
        </div>
      )}

      {showProductModal && (
        <ProductModal
          storeId={storeId}
          productId={editingProduct}
          editProduct={editingProductData}
          categories={categories || []}
          subcategories={allSubcategories || []}
          storeCountry={currentStore?.country ?? "BR"}
          onClose={() => { setShowProductModal(false); setEditingProduct(null); setEditingProductData(null); }}
          onSuccess={() => {
            setShowProductModal(false);
            setEditingProduct(null);
            setEditingProductData(null);
            utils.products.listByStore.invalidate({ storeId });
          }}
        />
      )}

      {showEditStoreModal && currentStore && (
        <EditStoreModal
          store={currentStore}
          onClose={() => setShowEditStoreModal(false)}
          onSuccess={() => {
            setShowEditStoreModal(false);
            utils.stores.myStores.invalidate();
          }}
        />
      )}

      {showTrialBlock && currentStore && (
        <TrialBlockModal
          storeId={storeId}
          trialEndsAt={currentStore.trialEndsAt ? new Date(currentStore.trialEndsAt) : null}
          onUnlock={() => initiateCheckout(storeId)}
        />
      )}
    </div>
  );
}
