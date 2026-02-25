import { trpc } from "@/lib/trpc";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { useLocation } from "wouter";
import {
  ShoppingBag, Plus, Store, ExternalLink, Trash2, Settings,
  LogOut, ChevronRight, Package, Tag, Layers, Menu, X, AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import CreateStoreModal from "@/components/CreateStoreModal";
import StoreManager from "@/components/StoreManager";

export default function Admin() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const [, navigate] = useLocation();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedStoreId, setSelectedStoreId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-gray-400">A carregar...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="text-center max-w-sm">
          <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold mb-3">Acesso Restrito</h1>
          <p className="text-gray-500 mb-6 text-sm sm:text-base">Precisa de iniciar sessão para aceder ao painel.</p>
          <a
            href={getLoginUrl()}
            className="inline-block bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors w-full sm:w-auto"
          >
            Iniciar Sessão
          </a>
        </div>
      </div>
    );
  }

  const selectedStore = stores?.find(s => s.id === selectedStoreId);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-3 sm:px-4 md:px-6 py-3 sm:py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 hover:bg-gray-100 rounded-lg text-gray-600"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-7 sm:w-8 h-7 sm:h-8 bg-black rounded-lg flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-4 sm:w-5 h-4 sm:h-5 text-white" />
              </div>
              <span className="font-bold text-sm sm:text-base text-gray-900 hidden sm:inline">DropStore</span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4">
            <div className="text-right hidden sm:block">
              <p className="text-xs sm:text-sm font-medium text-gray-900 truncate">{user?.name}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
            <button
              onClick={() => logout()}
              className="p-2 sm:px-3 md:px-4 sm:py-2 hover:bg-gray-100 rounded-lg text-gray-600 text-xs sm:text-sm font-medium transition-colors flex items-center gap-1.5 sm:gap-2"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-0 lg:gap-4 xl:gap-6 max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
        {/* Sidebar */}
        <aside
          className={`fixed inset-y-0 left-0 z-30 w-60 sm:w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 lg:relative lg:translate-x-0 lg:inset-auto lg:w-64 xl:w-72 pt-20 lg:pt-6 px-3 sm:px-4 lg:px-5 xl:px-6 py-4 sm:py-6 overflow-y-auto ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="space-y-6">
            {/* Create Store Button */}
            <button
              onClick={() => {
                setShowCreateModal(true);
                setSidebarOpen(false);
              }}
              className="w-full flex items-center justify-center gap-2 bg-black text-white px-4 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors text-sm sm:text-base"
            >
              <Plus className="w-4 h-4" />
              Nova Loja
            </button>

            {/* Stores List */}
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Minhas Lojas</p>
              <div className="space-y-2">
                {storesLoading ? (
                  <div className="text-center py-6">
                    <div className="w-6 h-6 border-2 border-black border-t-transparent rounded-full animate-spin mx-auto" />
                  </div>
                ) : stores && stores.length > 0 ? (
                  stores.map(store => (
                    <button
                      key={store.id}
                      onClick={() => {
                        setSelectedStoreId(store.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors text-sm ${
                        selectedStoreId === store.id
                          ? "bg-black text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-2 truncate">
                        <Store className="w-4 h-4 flex-shrink-0" />
                        <span className="truncate">{store.name}</span>
                      </div>
                    </button>
                  ))
                ) : (
                  <p className="text-xs text-gray-400 py-4 text-center">Nenhuma loja criada</p>
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 py-6 lg:py-8 pb-20 lg:pb-8">
          {selectedStore ? (
            <StoreManager
              storeId={selectedStore.id}
              onBack={() => setSelectedStoreId(null)}
            />
          ) : (
            <div className="text-center py-12 sm:py-20">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Store className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Nenhuma loja selecionada</h2>
              <p className="text-gray-500 text-sm sm:text-base mb-6">Selecione uma loja ou crie uma nova para começar</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-medium hover:bg-gray-800 transition-colors text-sm sm:text-base"
              >
                <Plus className="w-4 h-4" />
                Criar Primeira Loja
              </button>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateStoreModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            refetch();
            setShowCreateModal(false);
          }}
        />
      )}

      {/* Mobile overlay when sidebar is open */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
