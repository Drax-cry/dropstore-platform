import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  ShoppingBag, Plus, Store, ExternalLink, Trash2, Settings,
  LogOut, ChevronRight, Package, Tag, Layers
} from "lucide-react";
import { toast } from "sonner";
import CreateStoreModal from "@/components/CreateStoreModal";
import StoreManager from "@/components/StoreManager";

export default function Admin() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);

  const { data: stores, isLoading: storesLoading, refetch } = trpc.stores.myStores.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  const deleteStoreMutation = trpc.stores.delete.useMutation({
    onSuccess: () => {
      toast.success("Loja eliminada com sucesso");
      refetch();
      if (selectedStoreId) setSelectedStoreId(null);
    },
    onError: () => toast.error("Erro ao eliminar loja"),
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Acesso Restrito</h1>
          <p className="text-gray-500 mb-6">Precisa de iniciar sessão para aceder ao painel.</p>
          <a href={getLoginUrl()} className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors">
            Iniciar Sessão
          </a>
        </div>
      </div>
    );
  }

  const selectedStore = stores?.find(s => s.id === selectedStoreId);

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-100 flex flex-col fixed h-full z-10">
        <div className="p-5 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-base" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>DropStore</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-1">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-3 mb-3">As minhas lojas</p>
          {storesLoading ? (
            <div className="space-y-2">
              {[1, 2].map(i => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : stores && stores.length > 0 ? (
            stores.map(store => (
              <button
                key={store.id}
                onClick={() => setSelectedStoreId(store.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  selectedStoreId === store.id
                    ? "bg-black text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                <Store className="w-4 h-4 flex-shrink-0" />
                <span className="truncate font-medium">{store.name}</span>
              </button>
            ))
          ) : (
            <p className="text-xs text-gray-400 px-3 py-2">Nenhuma loja criada</p>
          )}

          <button
            onClick={() => setShowCreateModal(true)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors mt-2 border border-dashed border-gray-200"
          >
            <Plus className="w-4 h-4" />
            <span>Nova loja</span>
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{user?.name || "Utilizador"}</p>
              <p className="text-xs text-gray-400 truncate">{user?.email || ""}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); navigate("/"); }}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 ml-64 p-8">
        {!selectedStoreId ? (
          <div>
            <div className="mb-8">
              <h1 className="text-2xl font-bold text-gray-900">Bem-vindo, {user?.name?.split(" ")[0] || "utilizador"}!</h1>
              <p className="text-gray-500 mt-1">Gerencie as suas lojas e catálogos de produtos.</p>
            </div>

            {storesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
                    <div className="h-12 w-12 bg-gray-200 rounded-xl mb-4" />
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : stores && stores.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stores.map(store => (
                  <div key={store.id} className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-gray-200 hover:shadow-md transition-all group">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
                        {store.logoUrl ? (
                          <img src={store.logoUrl} alt={store.name} className="w-full h-full object-cover" />
                        ) : (
                          <Store className="w-6 h-6 text-gray-400" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <a
                          href={`/loja/${store.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700"
                          title="Ver loja"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => {
                            if (confirm("Tem certeza que deseja eliminar esta loja?")) {
                              deleteStoreMutation.mutate({ id: store.id });
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                          title="Eliminar loja"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <h3 className="font-semibold text-gray-900 mb-1">{store.name}</h3>
                    {store.slogan && <p className="text-sm text-gray-400 mb-3 truncate">{store.slogan}</p>}
                    <div className="flex items-center gap-2 mt-4">
                      <button
                        onClick={() => setSelectedStoreId(store.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 bg-black text-white text-xs font-medium py-2 rounded-lg hover:bg-gray-800 transition-colors"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Gerir loja
                      </button>
                      <a
                        href={`/loja/${store.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 border border-gray-200 text-gray-600 text-xs font-medium py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Ver
                      </a>
                    </div>
                  </div>
                ))}

                {/* Create new store card */}
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-white rounded-2xl p-6 border-2 border-dashed border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all flex flex-col items-center justify-center gap-3 text-gray-400 hover:text-gray-600 min-h-[180px]"
                >
                  <div className="w-12 h-12 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center">
                    <Plus className="w-6 h-6" />
                  </div>
                  <span className="text-sm font-medium">Criar nova loja</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Store className="w-10 h-10 text-gray-300" />
                </div>
                <h2 className="text-xl font-semibold text-gray-800 mb-2">Nenhuma loja criada</h2>
                <p className="text-gray-400 mb-8 max-w-sm mx-auto">
                  Crie a sua primeira loja e comece a partilhar o seu catálogo de produtos com os clientes.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Criar a minha primeira loja
                </button>

                <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto text-left">
                  {[
                    { icon: Store, step: "1", title: "Crie a loja", desc: "Defina nome, logo e informações" },
                    { icon: Tag, step: "2", title: "Adicione categorias", desc: "Organize os seus produtos" },
                    { icon: Package, step: "3", title: "Adicione produtos", desc: "Com preços e tamanhos" },
                  ].map((item, i) => (
                    <div key={i} className="bg-white rounded-xl p-5 border border-gray-100">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">
                          {item.step}
                        </div>
                        <item.icon className="w-5 h-5 text-gray-400" />
                      </div>
                      <h3 className="font-semibold text-gray-800 text-sm mb-1">{item.title}</h3>
                      <p className="text-xs text-gray-400">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <StoreManager
            storeId={selectedStoreId}
            onBack={() => setSelectedStoreId(null)}
          />
        )}
      </main>

      {showCreateModal && (
        <CreateStoreModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}
