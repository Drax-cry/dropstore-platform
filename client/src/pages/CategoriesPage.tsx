import { useState, useMemo, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, Tag, Package, ChevronRight, Search, X, ArrowUpDown } from "lucide-react";

function useScrollFadeIn() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  return ref;
}

interface CategoryWithCount {
  id: number;
  name: string;
  slug: string;
  count: number;
  color?: string;
}

export default function CategoriesPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<"recent" | "price-high" | "price-low">("recent");

  const { data: store, isLoading: storeLoading } = trpc.stores.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  const { data: categories } = trpc.categories.list.useQuery(
    { storeId: store?.id || 0 },
    { enabled: !!store?.id }
  );

  const { data: allProducts } = trpc.products.listByStore.useQuery(
    { storeId: store?.id || 0 },
    { enabled: !!store?.id }
  );

  const { data: allSubcategories } = trpc.subcategories.listByStore.useQuery(
    { storeId: store?.id || 0 },
    { enabled: !!store?.id }
  );

  // Calcular contagem de produtos por categoria
  const categoriesWithCount = useMemo(() => {
    if (!categories || !allProducts) return [];
    
    const colors = [
      "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6",
      "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16"
    ];

    return categories.map((cat, idx) => ({
      ...cat,
      count: allProducts.filter(p => p.categoryId === cat.id).length,
      color: colors[idx % colors.length]
    }));
  }, [categories, allProducts]);

  // Filtrar categorias por busca
  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return categoriesWithCount;
    const q = searchQuery.toLowerCase();
    return categoriesWithCount.filter(cat =>
      cat.name.toLowerCase().includes(q)
    );
  }, [categoriesWithCount, searchQuery]);

  // Subcategorias da categoria selecionada
  const selectedCategorySubs = useMemo(() => {
    if (!selectedCategoryId || !allSubcategories) return [];
    return allSubcategories.filter(s => s.categoryId === selectedCategoryId);
  }, [selectedCategoryId, allSubcategories]);

  // Produtos da categoria selecionada com ordenação
  const selectedCategoryProducts = useMemo(() => {
    if (!selectedCategoryId || !allProducts) return [];
    let products = allProducts.filter(p => p.categoryId === selectedCategoryId);
    
    // Aplicar ordenação
    switch (sortBy) {
      case "price-high":
        return [...products].sort((a, b) => Number(b.price) - Number(a.price));
      case "price-low":
        return [...products].sort((a, b) => Number(a.price) - Number(b.price));
      case "recent":
      default:
        return [...products].reverse(); // Mais recentes primeiro (IDs maiores)
    }
  }, [selectedCategoryId, allProducts, sortBy]);

  const primaryColor = store?.primaryColor || "#000000";

  // Função para obter label de ordenação
  const getSortLabel = () => {
    switch (sortBy) {
      case "price-high":
        return "Maior Preço";
      case "price-low":
        return "Menor Preço";
      case "recent":
      default:
        return "Mais Recentes";
    }
  };

  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${primaryColor} transparent transparent transparent` }} />
          <p className="text-gray-400 text-sm">A carregar categorias...</p>
        </div>
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <p className="text-gray-500">Loja não encontrada</p>
        </div>
      </div>
    );
  }

  // Se uma categoria está selecionada, mostrar produtos dessa categoria
  if (selectedCategoryId) {
    const selectedCat = categoriesWithCount.find(c => c.id === selectedCategoryId);
    return (
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
          <div className="container px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
            <button
              onClick={() => setSelectedCategoryId(null)}
              className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <h1 className="font-bold text-base sm:text-lg text-gray-900 truncate">{selectedCat?.name}</h1>
              <p className="text-xs sm:text-sm text-gray-500">{selectedCategoryProducts.length} produtos</p>
            </div>
          </div>
        </header>

        {/* Subcategorias */}
        {selectedCategorySubs.length > 0 && (
          <div className="bg-gray-50 border-b border-gray-100 py-3 sticky top-14 sm:top-16 z-40">
            <div className="container px-4 sm:px-6">
              <div className="flex gap-2 overflow-x-auto pb-1">
                {selectedCategorySubs.map(sub => (
                  <div
                    key={sub.id}
                    className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-gray-200"
                    style={{ borderColor: selectedCat?.color, color: selectedCat?.color }}
                  >
                    {sub.name}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Produtos */}
        <main className="container px-4 sm:px-6 py-6 sm:py-10">
          {selectedCategoryProducts.length > 0 && (
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900">Produtos</h2>
              <div className="flex items-center gap-2">
                <label className="text-sm text-gray-600">Ordenar por:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-sm font-medium focus:outline-none focus:ring-2 transition-all"
                  style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
                >
                  <option value="recent">Mais Recentes</option>
                  <option value="price-low">Menor Preço</option>
                  <option value="price-high">Maior Preço</option>
                </select>
              </div>
            </div>
          )}
          {selectedCategoryProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 lg:gap-4">
              {selectedCategoryProducts.map(product => (
                <div
                  key={product.id}
                  className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="aspect-square bg-gray-100 overflow-hidden relative">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-200" />
                      </div>
                    )}
                    {product.brand && (
                      <div className="absolute top-3 left-3">
                        <span className="bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-700 px-2.5 py-1 rounded-full shadow-sm">
                          {product.brand}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="p-3 sm:p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 text-xs sm:text-sm line-clamp-2">{product.name}</h3>
                    <p className="text-base sm:text-lg font-bold text-gray-900">
                      R$ {Number(product.price).toFixed(2).replace(".", ",")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Nenhum produto nesta categoria</p>
            </div>
          )}
        </main>
      </div>
    );
  }

  // Visualização de categorias
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="container px-4 sm:px-6 flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">
          <button
            onClick={() => navigate(`/loja/${slug}`)}
            className="p-2 hover:bg-gray-100 rounded-lg text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="font-bold text-base sm:text-lg text-gray-900">Categorias</h1>
          <div className="w-10" />
        </div>
      </header>

      {/* Search */}
      <div className="border-b border-gray-100 py-4 px-4 sm:px-6">
        <div className="container max-w-md mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Pesquisar categorias..."
            className="w-full pl-9 pr-4 py-2.5 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all"
            style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Categories Grid */}
      <main className="container px-4 sm:px-6 py-8 sm:py-12">
        {filteredCategories.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {filteredCategories.map((category) => {
              const ref = useScrollFadeIn();
              return (
                <div
                  key={category.id}
                  ref={ref}
                  style={{ opacity: 0, transform: "translateY(20px)", transition: "opacity 0.5s ease, transform 0.5s ease" }}
                  onClick={() => setSelectedCategoryId(category.id)}
                  className="group cursor-pointer"
                >
                  <div
                    className="h-40 sm:h-48 rounded-2xl overflow-hidden relative flex items-center justify-center text-white font-bold text-2xl sm:text-3xl hover:shadow-xl transition-all duration-300 hover:scale-105"
                    style={{ backgroundColor: category.color }}
                  >
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                    <div className="relative z-10 text-center px-4">
                      <Tag className="w-8 h-8 sm:w-10 sm:h-10 mx-auto mb-2 opacity-80" />
                      <h2 className="text-lg sm:text-2xl font-bold leading-tight">{category.name}</h2>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <p className="text-sm text-gray-600">
                      <span className="font-semibold text-gray-900">{category.count}</span> produto{category.count !== 1 ? "s" : ""}
                    </p>
                    <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Nenhuma categoria encontrada</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-6 sm:py-8 mt-8 sm:mt-10">
        <div className="container px-4 sm:px-6 text-center">
          <p className="text-xs sm:text-sm text-gray-400">
            {store.name} · Powered by{" "}
            <a href="/" className="font-medium text-gray-600 hover:text-gray-900">DropStore</a>
          </p>
        </div>
      </footer>
    </div>
  );
}
