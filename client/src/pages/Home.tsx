import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { ShoppingBag, Store, Zap, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/admin");
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-black border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">A carregar...</p>
        </div>
      </div>
    );
  }

  const features = [
    { icon: Store, title: "Crie a sua loja", desc: "Configure a sua loja em minutos com logo, cores e informações de contacto." },
    { icon: ShoppingBag, title: "Gerencie produtos", desc: "Adicione categorias, subcategorias e produtos com imagens, preços e tamanhos." },
    { icon: Zap, title: "Integração WhatsApp", desc: "Os clientes contactam diretamente pelo WhatsApp com mensagem pré-preenchida." },
  ];

  const benefits = [
    "Catálogo online moderno e responsivo",
    "Barra de pesquisa em tempo real",
    "Seletor de tamanhos nos produtos",
    "Animações e efeitos visuais",
    "Link único para a sua loja",
    "Sem custos mensais",
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 sticky top-0 z-50 bg-white/95 backdrop-blur-sm">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center">
              <ShoppingBag className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
              DropStore
            </span>
          </div>
          <a
            href="/auth"
            className="inline-flex items-center gap-2 bg-black text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
          >
            Entrar
            <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-12 sm:pt-20 pb-16 sm:pb-24 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-gray-100 text-gray-600 text-xs font-medium px-3 py-1.5 rounded-full mb-8">
            <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
            Plataforma de catálogos online
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-black mb-6 leading-tight">
            O Melhor Drop
            <br />
            <span className="text-gray-400">é Aqui.</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto mb-10 leading-relaxed">
            Crie o seu catálogo online profissional em minutos. Partilhe com os seus clientes e receba pedidos pelo WhatsApp.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="/auth"
              className="inline-flex items-center gap-2 bg-black text-white px-8 py-3.5 rounded-full text-base font-semibold hover:bg-gray-800 transition-all hover:scale-105 shadow-lg shadow-black/10"
            >
              Criar a minha loja
              <ArrowRight className="w-5 h-5" />
            </a>
            <span className="text-sm text-gray-400">Gratuito e sem cartão de crédito</span>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-gray-50">
        <div className="container">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-black mb-3">Tudo o que precisa</h2>
            <p className="text-gray-500">Uma plataforma completa para o seu negócio de drops</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl p-8 border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all group">
                <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  <f.icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-black mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20">
        <div className="container">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-black mb-4">
                Tudo incluído, sem complicações
              </h2>
              <p className="text-gray-500 mb-8 leading-relaxed">
                A sua loja online com todas as funcionalidades que precisa para apresentar os seus produtos de forma profissional e receber pedidos facilmente.
              </p>
              <ul className="space-y-3">
                {benefits.map((b, i) => (
                  <li key={i} className="flex items-center gap-3 text-gray-700">
                    <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                    <span className="text-sm">{b}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative">
              <div className="bg-gray-900 rounded-2xl p-6 shadow-2xl">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <div className="flex-1 bg-gray-800 rounded-full h-5 mx-2" />
                </div>
                <div className="space-y-3">
                  <div className="bg-gray-800 rounded-lg p-3">
                    <div className="h-3 bg-gray-700 rounded w-3/4 mb-2" />
                    <div className="h-2 bg-gray-700 rounded w-1/2" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    {[1, 2, 3, 4].map(n => (
                      <div key={n} className="bg-gray-800 rounded-lg p-3">
                        <div className="h-16 bg-gray-700 rounded mb-2" />
                        <div className="h-2 bg-gray-700 rounded w-3/4 mb-1" />
                        <div className="h-2 bg-gray-700 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-black">
        <div className="container text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Pronto para começar?
          </h2>
          <p className="text-gray-400 mb-8">
            Crie a sua loja em minutos e comece a receber pedidos hoje.
          </p>
          <a
            href="/auth"
            className="inline-flex items-center gap-2 bg-white text-black px-8 py-3.5 rounded-full text-base font-semibold hover:bg-gray-100 transition-all hover:scale-105"
          >
            Começar agora — é grátis
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-black rounded-md flex items-center justify-center">
              <ShoppingBag className="w-3 h-3 text-white" />
            </div>
            <span className="font-semibold text-sm">DropStore</span>
          </div>
          <p className="text-xs text-gray-400">© 2025 DropStore. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
