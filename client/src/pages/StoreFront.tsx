import { useState, useMemo, useEffect, useRef } from "react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Search, ShoppingBag, MessageCircle, ChevronDown, X, ZoomIn, ChevronLeft, ChevronRight, MapPin, Phone, Mail, Instagram, Facebook, Youtube, Music2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "@/components/LanguageSwitcher";

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

const CURRENCY_SYMBOLS: Record<string, string> = {
  BRL: "R$",
  EUR: "€",
  ARS: "$",
  COP: "$",
};

function formatPrice(value: number, currency: string | null): string {
  const symbol = CURRENCY_SYMBOLS[currency ?? "BRL"] ?? "R$";
  return `${symbol} ${value.toFixed(2).replace(".", ",")}`;
}

function ProductCard({ product, whatsapp, primaryColor, currency, whatsappMessage }: {
  product: {
    id: number;
    name: string;
    brand: string | null;
    price: string;
    imageUrl: string | null;
    sizes: string | null;
    discountPercent?: string | null;
  };
  whatsapp: string | null;
  primaryColor: string | null;
  currency: string | null;
  whatsappMessage?: string | null;
}) {
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [imageError, setImageError] = useState(false);
  const ref = useScrollFadeIn();
  const { t } = useTranslation();
  const sizes: string[] = product.sizes ? JSON.parse(product.sizes) : [];
  const color = primaryColor || "#000000";

  const discountPct = product.discountPercent ? parseFloat(product.discountPercent) : 0;
  const originalPrice = Number(product.price);
  const finalPrice = discountPct > 0 ? originalPrice * (1 - discountPct / 100) : originalPrice;

  const handleWhatsApp = () => {
    if (!whatsapp) return;
    const number = whatsapp.replace(/\D/g, "");
    const priceText = discountPct > 0
      ? `${formatPrice(finalPrice, currency)} (${discountPct}% OFF)`
      : formatPrice(originalPrice, currency);

    // Usa mensagem personalizada ou a padrão
    const DEFAULT_MSG = `Olá! Tenho interesse no seguinte produto:\n\n\ud83d\udecd\ufe0f *{{produto}}*\n\ud83d\udcb0 Preço: {{preco}}\n\ud83d\udccf Tamanho: {{tamanho}}\n\nPoderia me dar mais informações?`;
    const template = whatsappMessage || DEFAULT_MSG;
    const finalMsg = template
      .replace(/\{\{produto\}\}/g, `${product.name}${product.brand ? ` - ${product.brand}` : ""}`)
      .replace(/\{\{preco\}\}/g, priceText)
      .replace(/\{\{tamanho\}\}/g, selectedSize || "N/A");

    window.open(`https://wa.me/${number}?text=${encodeURIComponent(finalMsg)}`, "_blank");
  };

  return (
    <div
      ref={ref}
      style={{ opacity: 0, transform: "translateY(20px)", transition: "opacity 0.5s ease, transform 0.5s ease" }}
      className="bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-gray-200 hover:shadow-xl transition-all duration-300 group"
    >
      {/* Image */}
      <div className="aspect-square bg-gray-100 overflow-hidden relative">
        {product.imageUrl && !imageError ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <ShoppingBag className="w-12 h-12 text-gray-200" />
          </div>
        )}
        {product.brand && (
          <div className="absolute top-3 left-3">
            <span className="bg-white/90 backdrop-blur-sm text-xs font-semibold text-gray-700 px-2.5 py-1 rounded-full shadow-sm">
              {product.brand}
            </span>
          </div>
        )}
        {discountPct > 0 && (
          <div className="absolute top-3 right-3">
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full shadow-sm">
              -{discountPct}%
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 mb-1 text-sm leading-tight">{product.name}</h3>
        {discountPct > 0 ? (
          <div className="mb-3">
            <p className="text-xs text-gray-400 line-through">
              {formatPrice(originalPrice, currency)}
            </p>
            <p className="text-lg font-bold text-red-600">
              {formatPrice(finalPrice, currency)}
            </p>
          </div>
        ) : (
          <p className="text-lg font-bold text-gray-900 mb-3">
            {formatPrice(originalPrice, currency)}
          </p>
        )}

        {/* Size Selector */}
        {sizes.length > 0 && (
          <div className="mb-3">
            <p className="text-xs text-gray-400 mb-1.5">Tamanho:</p>
            <div className="flex flex-wrap gap-1.5">
              {sizes.map(size => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(selectedSize === size ? "" : size)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    selectedSize === size
                      ? "text-white border-transparent"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                  style={selectedSize === size ? { backgroundColor: color, borderColor: color } : {}}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* WhatsApp Button */}
        {whatsapp ? (
          <button
            onClick={handleWhatsApp}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-90 hover:scale-[1.02] active:scale-[0.98]"
            style={{ backgroundColor: color }}
          >
            <MessageCircle className="w-4 h-4" />
            {t("storefront.order")}
          </button>
        ) : (
          <div className="w-full py-2.5 rounded-xl text-sm font-semibold text-center bg-gray-100 text-gray-400">
            {t("storefront.noProducts")}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StoreFront() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<number | null>(null);
  const [activeSubId, setActiveSubId] = useState<number | null>(null);
  const [sortPrice, setSortPrice] = useState<"none" | "asc" | "desc">("none");

  const { data: store, isLoading: storeLoading, error: storeError } = trpc.stores.getBySlug.useQuery(
    { slug: slug || "" },
    { enabled: !!slug }
  );

  const { data: categories } = trpc.categories.list.useQuery(
    { storeId: store?.id || 0 },
    { enabled: !!store?.id }
  );

  const { data: allSubcategories } = trpc.subcategories.listByStore.useQuery(
    { storeId: store?.id || 0 },
    { enabled: !!store?.id }
  );

  const { data: allProducts } = trpc.products.listByStore.useQuery(
    { storeId: store?.id || 0 },
    { enabled: !!store?.id }
  );

  const { data: banners } = trpc.banners.list.useQuery(
    { storeId: store?.id || 0 },
    { enabled: !!store?.id }
  );

  const [bannerIndex, setBannerIndex] = useState(0);

  useEffect(() => {
    if (!banners || banners.length <= 1) return;
    const timer = setInterval(() => {
      setBannerIndex(prev => (prev + 1) % banners.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [banners]);

  // Set first category as active when loaded
  useEffect(() => {
    if (categories && categories.length > 0 && activeCategoryId === null) {
      setActiveCategoryId(categories[0].id);
    }
  }, [categories, activeCategoryId]);

  const subsForActiveCategory = useMemo(() =>
    allSubcategories?.filter(s => s.categoryId === activeCategoryId) || [],
    [allSubcategories, activeCategoryId]
  );

  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];
    let products = allProducts;

    if (activeCategoryId !== null) {
      products = products.filter(p => p.categoryId === activeCategoryId);
    }
    if (activeSubId !== null) {
      products = products.filter(p => p.subcategoryId === activeSubId);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      products = products.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      );
    }
    
    if (sortPrice === "asc") {
      products = [...products].sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortPrice === "desc") {
      products = [...products].sort((a, b) => Number(b.price) - Number(a.price));
    }
    
    return products;
  }, [allProducts, activeCategoryId, activeSubId, searchQuery, sortPrice]);

  const primaryColor = store?.primaryColor || "#000000";

  if (storeLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: `${primaryColor} transparent transparent transparent` }} />
          <p className="text-gray-400 text-sm">{t("common.loading")}</p>
        </div>
      </div>
    );
  }

  if (storeError || !store) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <ShoppingBag className="w-10 h-10 text-gray-300" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">{t("storefront.noProducts")}</h1>
          <p className="text-gray-400">{t("storefront.noProductsSearch")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="container">
          <div className="flex items-center justify-between h-16 gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3 flex-shrink-0">
              {store.logoUrl ? (
                <img src={store.logoUrl} alt={store.name} className="h-9 w-auto object-contain" />
              ) : (
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: primaryColor }}>
                  <ShoppingBag className="w-5 h-5 text-white" />
                </div>
              )}
              <span className="font-bold text-base text-gray-900 hidden sm:block" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                {store.name}
              </span>
            </div>

            {/* Search */}
            <div className="flex-1 max-w-md relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder={t("storefront.search")}
                className="w-full pl-9 pr-4 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:bg-white transition-all"
                style={{ "--tw-ring-color": primaryColor } as React.CSSProperties}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Category nav (desktop) */}
            <nav className="hidden lg:flex items-center gap-1">
              {categories?.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => { setActiveCategoryId(cat.id); setActiveSubId(null); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    activeCategoryId === cat.id ? "text-white" : "text-gray-600 hover:bg-gray-100"
                  }`}
                  style={activeCategoryId === cat.id ? { backgroundColor: primaryColor } : {}}
                >
                  {cat.name}
                </button>
              ))}
            </nav>
            {/* Language Switcher */}
            <div className="flex-shrink-0">
              <LanguageSwitcher variant="light" />
            </div>
          </div>
        </div>
      </header>

      {/* Banner Carousel */}
      {banners && banners.length > 0 && (
        <div className="relative w-full overflow-hidden bg-gray-100" style={{ maxHeight: 320 }}>
          <div
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${bannerIndex * 100}%)` }}
          >
            {banners.map((banner, i) => (
              <div key={banner.id} className="w-full flex-shrink-0 relative">
                <img
                  src={banner.imageUrl}
                  alt={banner.title ?? `Banner ${i + 1}`}
                  className="w-full object-cover"
                  style={{ maxHeight: 320, minHeight: 160 }}
                />
                {banner.title && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent px-6 py-4">
                    <p className="text-white font-bold text-lg sm:text-xl drop-shadow">{banner.title}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
          {banners.length > 1 && (
            <>
              <button
                onClick={() => setBannerIndex(prev => (prev - 1 + banners.length) % banners.length)}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-gray-700" />
              </button>
              <button
                onClick={() => setBannerIndex(prev => (prev + 1) % banners.length)}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 bg-white/80 hover:bg-white rounded-full flex items-center justify-center shadow transition-all"
              >
                <ChevronRight className="w-5 h-5 text-gray-700" />
              </button>
              <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
                {banners.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setBannerIndex(i)}
                    className="w-2 h-2 rounded-full transition-all"
                    style={{ backgroundColor: i === bannerIndex ? primaryColor : "rgba(255,255,255,0.6)" }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Hero Section — apenas quando não há banners */}
      {(!banners || banners.length === 0) && (
        <section
          className="py-10 sm:py-16 px-4 text-center relative overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${primaryColor}08 0%, ${primaryColor}03 100%)` }}
        >
          <div className="max-w-2xl mx-auto">
            {store.logoUrl && (
              <img src={store.logoUrl} alt={store.name} className="h-14 sm:h-20 w-auto object-contain mx-auto mb-4 sm:mb-6" />
            )}
            <h1
              className="text-3xl sm:text-4xl md:text-5xl font-bold text-gray-900 mb-3 sm:mb-4 animate-fade-in"
              style={{ fontFamily: "'Space Grotesk', sans-serif" }}
            >
              {store.slogan || store.name}
            </h1>
            {store.slogan && (
              <p className="text-base sm:text-lg text-gray-500 animate-slide-up">{store.name}</p>
            )}
          </div>
        </section>
      )}

      {/* Mobile Category Nav */}
      {categories && categories.length > 0 && (
        <div className="lg:hidden sticky top-16 z-40 bg-white border-b border-gray-100 py-3">
          <div className="flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setActiveCategoryId(cat.id); setActiveSubId(null); }}
                className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  activeCategoryId === cat.id ? "text-white" : "bg-gray-100 text-gray-600"
                }`}
                style={activeCategoryId === cat.id ? { backgroundColor: primaryColor } : {}}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Subcategory Filter */}
      {subsForActiveCategory.length > 0 && (
        <div className="bg-gray-50 border-b border-gray-100 py-3">
          <div className="container">
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              <button
                onClick={() => setActiveSubId(null)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                  activeSubId === null
                    ? "text-white border-transparent"
                    : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                }`}
                style={activeSubId === null ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
              >
                {t("storefront.all")}
              </button>
              {subsForActiveCategory.map(sub => (
                <button
                  key={sub.id}
                  onClick={() => setActiveSubId(activeSubId === sub.id ? null : sub.id)}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    activeSubId === sub.id
                      ? "text-white border-transparent"
                      : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
                  }`}
                  style={activeSubId === sub.id ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}
                >
                  {sub.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Products Grid */}
      <main className="container py-6 sm:py-10">
        {/* Search results info and Price Filter */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-2">
            {searchQuery && (
              <>
                <p className="text-sm text-gray-500">
                  {filteredProducts.length} {t("storefront.results")} "{searchQuery}"
                </p>
                <button onClick={() => setSearchQuery("")} className="text-xs text-gray-400 hover:text-gray-600 underline">
                  {t("common.back")}
                </button>
              </>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-600 font-medium">{t("storefront.sort")}:</label>
            <select
              value={sortPrice}
              onChange={(e) => setSortPrice(e.target.value as "none" | "asc" | "desc")}
              className="text-xs border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-black bg-white cursor-pointer"
            >
              <option value="none">{t("storefront.sortDefault")}</option>
              <option value="asc">{t("storefront.sortAsc")}</option>
              <option value="desc">{t("storefront.sortDesc")}</option>
            </select>
          </div>
        </div>

        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                whatsapp={store.whatsappNumber}
                primaryColor={primaryColor}
                currency={store.currency ?? "BRL"}
                whatsappMessage={store.whatsappMessage}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShoppingBag className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">{t("storefront.noProducts")}</p>
            {searchQuery && (
              <p className="text-gray-400 text-sm mt-1">{t("storefront.noProductsSearch")}</p>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-100 mt-10" style={{ backgroundColor: "#fafafa" }}>
        <div className="container py-10">
          {/* Contact & Social Grid */}
          {(store.address || store.phone || store.email || store.instagram || store.facebook || store.tiktok || store.youtube) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 mb-8">
              {/* Contact Info */}
              {(store.address || store.phone || store.email) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-4">{t("storefront.contact")}</h3>
                  <div className="space-y-3">
                    {store.address && (
                      <div className="flex items-start gap-2.5 text-sm text-gray-600">
                        <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                        <span className="whitespace-pre-line">{store.address}</span>
                      </div>
                    )}
                    {store.phone && (
                      <div className="flex items-center gap-2.5 text-sm text-gray-600">
                        <Phone className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <a href={`tel:${store.phone.replace(/\s/g, "")}`} className="hover:text-gray-900 transition-colors">
                          {store.phone}
                        </a>
                      </div>
                    )}
                    {store.email && (
                      <div className="flex items-center gap-2.5 text-sm text-gray-600">
                        <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <a href={`mailto:${store.email}`} className="hover:text-gray-900 transition-colors">
                          {store.email}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Social Media */}
              {(store.instagram || store.facebook || store.tiktok || store.youtube) && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-800 mb-4">Redes Sociais</h3>
                  <div className="flex flex-wrap gap-3">
                    {store.instagram && (
                      <a
                        href={store.instagram.startsWith('http') ? store.instagram : `https://www.instagram.com/${store.instagram}/`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors bg-white border border-gray-200 rounded-xl px-3 py-2 hover:border-gray-400"
                      >
                        <Instagram className="w-4 h-4" />
                        <span>@{store.instagram.split('/').filter(Boolean).pop() || store.instagram}</span>
                      </a>
                    )}
                    {store.facebook && (
                      <a
                        href={store.facebook.startsWith('http') ? store.facebook : `https://www.facebook.com/${store.facebook}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors bg-white border border-gray-200 rounded-xl px-3 py-2 hover:border-gray-400"
                      >
                        <Facebook className="w-4 h-4" />
                        <span>{store.facebook.split('/').filter(Boolean).pop() || store.facebook}</span>
                      </a>
                    )}
                    {store.tiktok && (
                      <a
                        href={store.tiktok.startsWith('http') ? store.tiktok : `https://www.tiktok.com/@${store.tiktok}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors bg-white border border-gray-200 rounded-xl px-3 py-2 hover:border-gray-400"
                      >
                        <Music2 className="w-4 h-4" />
                        <span>@{store.tiktok.split('/').filter(Boolean).pop() || store.tiktok}</span>
                      </a>
                    )}
                    {store.youtube && (
                      <a
                        href={store.youtube.startsWith('http') ? store.youtube : `https://www.youtube.com/c/${store.youtube}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors bg-white border border-gray-200 rounded-xl px-3 py-2 hover:border-gray-400"
                      >
                        <Youtube className="w-4 h-4" />
                        <span>{store.youtube.split('/').filter(Boolean).pop() || store.youtube}</span>
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Bottom bar */}
          <div className="border-t border-gray-200 pt-6 text-center">
            <p className="text-sm text-gray-400">
              {store.name} · Powered by{" "}
              <a href="/" className="font-medium text-gray-600 hover:text-gray-900">DropStore</a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
