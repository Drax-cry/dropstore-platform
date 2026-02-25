import { useState } from "react";
import { ShoppingBag, Store, Tag, Package, MessageCircle, Search, Smartphone, Zap, CheckCircle, ArrowRight, Star, Users, TrendingUp, Globe } from "lucide-react";

const stats = [
  { label: "Lojas criadas", value: "∞", icon: Store, color: "#6366f1" },
  { label: "Produtos suportados", value: "Ilimitados", icon: Package, color: "#10b981" },
  { label: "Integração WhatsApp", value: "Nativa", icon: MessageCircle, color: "#25D366" },
  { label: "Tempo de setup", value: "< 5 min", icon: Zap, color: "#f59e0b" },
];

const features = [
  {
    icon: Store,
    title: "Criação de Lojas",
    desc: "Crie a sua loja com nome, logo personalizada, slogan e cor principal. Cada loja recebe um link único e público.",
    color: "#6366f1",
    items: ["Upload de logo", "Cor personalizada", "Link único (/loja/slug)", "Slogan configurável"],
  },
  {
    icon: Tag,
    title: "Categorias & Subcategorias",
    desc: "Organize os seus produtos em categorias e subcategorias (marcas). Navegação intuitiva por abas e filtros.",
    color: "#10b981",
    items: ["Categorias ilimitadas", "Subcategorias por marca", "Filtros dinâmicos", "Navegação por abas"],
  },
  {
    icon: Package,
    title: "Gestão de Produtos",
    desc: "Adicione produtos com imagem, preço, marca e tamanhos. Interface de administração completa e intuitiva.",
    color: "#f59e0b",
    items: ["Upload de imagem", "Seletor de tamanhos", "Preço formatado", "Ativação/desativação"],
  },
  {
    icon: MessageCircle,
    title: "Integração WhatsApp",
    desc: "Botão de pedido direto no WhatsApp com mensagem pré-preenchida contendo produto, tamanho e preço.",
    color: "#25D366",
    items: ["Mensagem automática", "Produto + tamanho + preço", "Abre diretamente no app", "Número configurável"],
  },
  {
    icon: Search,
    title: "Pesquisa em Tempo Real",
    desc: "Barra de pesquisa com filtragem instantânea por nome, marca ou categoria. Experiência fluida.",
    color: "#3b82f6",
    items: ["Filtragem instantânea", "Pesquisa por nome", "Pesquisa por marca", "Limpar pesquisa"],
  },
  {
    icon: Smartphone,
    title: "Design Responsivo",
    desc: "Layout adaptado para mobile e desktop. Animações suaves de scroll e hover nos cards de produto.",
    color: "#ec4899",
    items: ["Mobile-first", "Animações de scroll", "Hover effects", "Cards modernos"],
  },
];

const techStack = [
  { name: "React 19", category: "Frontend", color: "#61dafb" },
  { name: "TypeScript", category: "Linguagem", color: "#3178c6" },
  { name: "tRPC 11", category: "API", color: "#398ccb" },
  { name: "Tailwind CSS 4", category: "Estilos", color: "#38bdf8" },
  { name: "Drizzle ORM", category: "Base de Dados", color: "#c5f74f" },
  { name: "MySQL/TiDB", category: "Base de Dados", color: "#4479a1" },
  { name: "S3 Storage", category: "Ficheiros", color: "#ff9900" },
  { name: "Manus OAuth", category: "Autenticação", color: "#7c3aed" },
];

const userFlow = [
  { step: 1, title: "Login", desc: "Autenticação segura via OAuth", icon: Users },
  { step: 2, title: "Criar Loja", desc: "Nome, logo, WhatsApp e cor", icon: Store },
  { step: 3, title: "Categorias", desc: "Organizar por tipo e marca", icon: Tag },
  { step: 4, title: "Produtos", desc: "Adicionar com preços e tamanhos", icon: Package },
  { step: 5, title: "Partilhar", desc: "Link público da vitrine", icon: Globe },
];

export default function Presentation() {
  const [activeFeature, setActiveFeature] = useState(0);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Hero */}
      <section className="relative overflow-hidden py-24 px-4">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-950 via-gray-950 to-gray-950" />
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />

        <div className="relative max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-medium px-4 py-2 rounded-full mb-8">
            <Star className="w-3.5 h-3.5" />
            Plataforma DropStore — Apresentação Interativa
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
            <span className="text-white">Catálogos Online</span>
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              para Drops & Revendas
            </span>
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Uma plataforma completa para criar e gerir lojas online de drops e revendas, com catálogo moderno, integração WhatsApp e painel de administração intuitivo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="/" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full font-medium transition-all hover:scale-105">
              Criar a minha loja
              <ArrowRight className="w-4 h-4" />
            </a>
            <a href="/admin" className="inline-flex items-center gap-2 border border-gray-700 hover:border-gray-500 text-gray-300 px-6 py-3 rounded-full font-medium transition-all">
              Ir para o painel
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 px-4 border-t border-gray-800/50">
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="text-center p-6 rounded-2xl bg-gray-900 border border-gray-800 hover:border-gray-700 transition-colors">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3" style={{ backgroundColor: `${stat.color}20` }}>
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
              <p className="text-2xl font-bold text-white mb-1">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* User Flow */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Como funciona</h2>
            <p className="text-gray-400">Da criação da conta à vitrine pública em 5 passos simples</p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4">
            {userFlow.map((step, i) => (
              <div key={i} className="flex items-center gap-4 flex-1">
                <div className="flex flex-col items-center text-center flex-1">
                  <div className="w-14 h-14 rounded-2xl bg-gray-800 border border-gray-700 flex items-center justify-center mb-3 relative">
                    <step.icon className="w-6 h-6 text-indigo-400" />
                    <div className="absolute -top-2 -right-2 w-5 h-5 bg-indigo-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {step.step}
                    </div>
                  </div>
                  <p className="font-semibold text-white text-sm">{step.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{step.desc}</p>
                </div>
                {i < userFlow.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-gray-700 flex-shrink-0 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Interactive */}
      <section className="py-16 px-4 bg-gray-900/50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Funcionalidades</h2>
            <p className="text-gray-400">Explore cada funcionalidade da plataforma</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Feature selector */}
            <div className="space-y-2">
              {features.map((f, i) => (
                <button
                  key={i}
                  onClick={() => setActiveFeature(i)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border text-left transition-all ${
                    activeFeature === i
                      ? "bg-gray-800 border-gray-600"
                      : "bg-gray-900/50 border-gray-800 hover:border-gray-700"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${f.color}20` }}>
                    <f.icon className="w-5 h-5" style={{ color: f.color }} />
                  </div>
                  <span className={`text-sm font-medium ${activeFeature === i ? "text-white" : "text-gray-400"}`}>
                    {f.title}
                  </span>
                </button>
              ))}
            </div>

            {/* Feature detail */}
            <div className="lg:col-span-2 bg-gray-900 border border-gray-800 rounded-2xl p-8">
              {(() => {
                const f = features[activeFeature];
                return (
                  <div>
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-14 h-14 rounded-2xl flex items-center justify-center" style={{ backgroundColor: `${f.color}20` }}>
                        <f.icon className="w-7 h-7" style={{ color: f.color }} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-white">{f.title}</h3>
                        <p className="text-sm text-gray-400 mt-0.5">{f.desc}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {f.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-2 bg-gray-800/50 rounded-xl p-3">
                          <CheckCircle className="w-4 h-4 flex-shrink-0" style={{ color: f.color }} />
                          <span className="text-sm text-gray-300">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-white mb-3">Stack Tecnológica</h2>
            <p className="text-gray-400">Construído com tecnologias modernas e de alta performance</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {techStack.map((tech, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-xl p-4 hover:border-gray-700 transition-colors">
                <div className="w-3 h-3 rounded-full mb-3" style={{ backgroundColor: tech.color }} />
                <p className="font-semibold text-white text-sm">{tech.name}</p>
                <p className="text-xs text-gray-500 mt-0.5">{tech.category}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits highlight */}
      <section className="py-16 px-4 bg-gradient-to-b from-gray-900 to-gray-950 border-t border-gray-800/50">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">Por que escolher o DropStore?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: TrendingUp,
                title: "Explore intuitivamente",
                desc: "Navegue pelos dados da sua loja de forma mais intuitiva com filtros, categorias e pesquisa em tempo real.",
                color: "#6366f1",
              },
              {
                icon: Star,
                title: "Compreenda as tendências",
                desc: "Compreenda melhor as tendências dos seus produtos mais pedidos e categorias mais populares.",
                color: "#f59e0b",
              },
              {
                icon: Globe,
                title: "Partilhe facilmente",
                desc: "Guarde ou partilhe facilmente o link da sua vitrine com clientes via WhatsApp, Instagram ou redes sociais.",
                color: "#10b981",
              },
            ].map((b, i) => (
              <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-6">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: `${b.color}20` }}>
                  <b.icon className="w-6 h-6" style={{ color: b.color }} />
                </div>
                <h3 className="font-semibold text-white mb-2">{b.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">{b.desc}</p>
              </div>
            ))}
          </div>

          <a href="/" className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all hover:scale-105 shadow-lg shadow-indigo-500/20">
            Começar agora — é grátis
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-800 py-8 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-indigo-600 rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-white">DropStore</span>
          </div>
          <p className="text-xs text-gray-500">Plataforma de catálogos online para drops e revendas</p>
        </div>
      </footer>
    </div>
  );
}
