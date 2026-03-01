import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function Katail() {
  const [, navigate] = useLocation();
  const [formData, setFormData] = useState({ name: "", email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const utils = trpc.useUtils();

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async () => {
      await utils.auth.me.invalidate();
      toast.success("Conta criada com sucesso!");
      navigate("/admin");
    },
    onError: (err) => {
      toast.error(err.message || "Erro ao criar conta");
      setIsLoading(false);
    },
  });

  const handleCreateAccount = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!formData.name.trim() || !formData.email.trim() || !formData.password) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (formData.password.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    setIsLoading(true);
    registerMutation.mutate({ name: formData.name, email: formData.email, password: formData.password });
  };

  const features = [
    { icon: "🛍️", title: "Loja Online Completa", desc: "Crie a sua loja em minutos com templates profissionais e personalizáveis." },
    { icon: "📦", title: "Gestão de Produtos", desc: "Adicione, edite e organize os seus produtos com facilidade e rapidez." },
    { icon: "💳", title: "Pagamentos Seguros", desc: "Aceite pagamentos de todo o mundo com as melhores taxas do mercado." },
    { icon: "📊", title: "Analytics em Tempo Real", desc: "Acompanhe as suas vendas e o desempenho da loja em tempo real." },
    { icon: "🚀", title: "Alta Performance", desc: "Infraestrutura robusta com 99.9% de uptime para nunca perder uma venda." },
    { icon: "🎯", title: "Marketing Integrado", desc: "Ferramentas de marketing para atrair e converter mais clientes." },
  ];

  const testimonials = [
    { name: "Ana Costa", role: "Fundadora, ModaLux", text: "Em 3 meses triplicamos as vendas. A plataforma é intuitiva e o suporte é excelente.", avatar: "AC" },
    { name: "Pedro Alves", role: "CEO, TechDrop", text: "Migrei da Shopify e não me arrependo. Muito mais simples e com melhores taxas.", avatar: "PA" },
    { name: "Sofia Mendes", role: "Empreendedora", text: "Comecei do zero e hoje fatura €15k/mês. A melhor decisão que tomei.", avatar: "SM" },
  ];

  return (
    <div className="min-h-screen bg-white font-sans antialiased">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .gradient-text {
          background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a855f7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hero-bg {
          background: radial-gradient(ellipse 80% 60% at 50% -10%, rgba(99,102,241,0.12) 0%, transparent 70%);
        }
        .card-hover {
          transition: all 0.2s ease;
        }
        .card-hover:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
        }
        .badge-pill {
          background: linear-gradient(135deg, rgba(99,102,241,0.1), rgba(168,85,247,0.1));
          border: 1px solid rgba(99,102,241,0.2);
        }
        .btn-primary {
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          transition: all 0.2s ease;
        }
        .btn-primary:hover {
          background: linear-gradient(135deg, #4f46e5, #7c3aed);
          transform: translateY(-1px);
          box-shadow: 0 8px 25px rgba(99,102,241,0.35);
        }
        .input-field {
          transition: all 0.2s ease;
        }
        .input-field:focus {
          border-color: #6366f1;
          box-shadow: 0 0 0 3px rgba(99,102,241,0.1);
        }
        .stat-card {
          background: linear-gradient(135deg, #f8fafc, #f1f5f9);
        }
        .noise-bg {
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
        }
      `}</style>

      {/* ── NAVBAR ── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg btn-primary flex items-center justify-center">
                  <span className="text-white font-bold text-sm">K</span>
                </div>
                <span className="font-bold text-gray-900 text-lg tracking-tight">katail</span>
              </div>
              <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
                <a href="#features" className="hover:text-gray-900 transition-colors">Funcionalidades</a>
                <a href="#pricing" className="hover:text-gray-900 transition-colors">Preços</a>
                <a href="#testimonials" className="hover:text-gray-900 transition-colors">Depoimentos</a>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/auth")}
                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors px-4 py-2"
              >
                Entrar
              </button>
              <button
                onClick={() => navigate("/auth")}
                className="btn-primary text-white text-sm font-semibold px-5 py-2.5 rounded-xl"
              >
                Começar grátis
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="hero-bg noise-bg pt-20 pb-24 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left */}
            <div>
              <div className="badge-pill inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-medium text-indigo-600 mb-8">
                <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse"></span>
                3 dias grátis · Sem cartão de crédito
              </div>
              <h1 className="text-5xl lg:text-6xl font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-6">
                A plataforma que<br />
                <span className="gradient-text">transforma ideias</span><br />
                em lojas lucrativas
              </h1>
              <p className="text-xl text-gray-500 leading-relaxed mb-10 max-w-lg">
                Crie, gira e escale o seu negócio digital com as melhores ferramentas do mercado. Simples, rápido e poderoso.
              </p>
              <div className="flex flex-wrap items-center gap-4 mb-12">
                <button
                  onClick={() => navigate("/auth")}
                  className="btn-primary text-white font-semibold px-8 py-4 rounded-xl text-base"
                >
                  Criar loja grátis →
                </button>
                <button
                  onClick={() => navigate("/auth")}
                  className="flex items-center gap-2 text-gray-600 font-medium text-base hover:text-gray-900 transition-colors"
                >
                  <span className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">▶</span>
                  Ver demo
                </button>
              </div>
              {/* Social proof */}
              <div className="flex items-center gap-6">
                <div className="flex -space-x-2">
                  {["#6366f1","#8b5cf6","#a855f7","#ec4899","#f43f5e"].map((c, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: c }}>
                      {["A","B","C","D","E"][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-1 text-amber-400 text-sm">
                    {"★★★★★"}
                    <span className="text-gray-700 font-semibold ml-1">4.9</span>
                  </div>
                  <p className="text-xs text-gray-400">+12.000 lojas ativas</p>
                </div>
              </div>
            </div>

            {/* Right — Form Card */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl shadow-indigo-100/50 border border-gray-100 p-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Crie a sua conta</h2>
                <p className="text-gray-400 text-sm mb-7">Grátis por 3 dias, depois €5/mês</p>

                <form className="space-y-4" onSubmit={handleCreateAccount}>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Nome completo</label>
                    <input
                      type="text"
                      placeholder="João Silva"
                      value={formData.name}
                      onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                      className="input-field w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">E-mail</label>
                    <input
                      type="email"
                      placeholder="joao@empresa.com"
                      value={formData.email}
                      onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                      className="input-field w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Senha</label>
                    <input
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      value={formData.password}
                      onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                      className="input-field w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="btn-primary w-full text-white font-semibold py-3.5 rounded-xl text-sm mt-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    {isLoading ? "A criar conta..." : "Criar conta grátis →"}
                  </button>
                </form>

                <p className="text-center text-xs text-gray-400 mt-5">
                  Já tem conta?{" "}
                  <button onClick={() => navigate("/auth")} className="text-indigo-600 font-semibold hover:underline">
                    Entrar
                  </button>
                </p>

                <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-100">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span className="text-green-500">🔒</span> SSL Seguro
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span>✓</span> Sem cartão
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400">
                    <span>✓</span> Cancele quando quiser
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── LOGOS / TRUST ── */}
      <section className="border-y border-gray-100 py-10 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-8">Integrado com as melhores plataformas</p>
          <div className="flex flex-wrap justify-center items-center gap-10 opacity-40 grayscale">
            {["Stripe", "PayPal", "Shopify", "WooCommerce", "Mercado Pago"].map((name) => (
              <span key={name} className="text-gray-600 font-bold text-lg">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* ── STATS ── */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { value: "+50M€", label: "Em vendas processadas" },
              { value: "12k+", label: "Lojas ativas" },
              { value: "180+", label: "Países suportados" },
              { value: "99.9%", label: "Uptime garantido" },
            ].map((s) => (
              <div key={s.label} className="stat-card rounded-2xl p-6 text-center">
                <p className="text-3xl lg:text-4xl font-extrabold gradient-text mb-2">{s.value}</p>
                <p className="text-sm text-gray-500 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="badge-pill inline-flex items-center px-4 py-1.5 rounded-full text-sm font-medium text-indigo-600 mb-4">
              Funcionalidades
            </div>
            <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
              Tudo o que precisa para<br />
              <span className="gradient-text">vender mais</span>
            </h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">
              Uma plataforma completa com todas as ferramentas para criar e gerir o seu negócio digital.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card-hover bg-white rounded-2xl p-7 border border-gray-100">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              O que dizem os nossos <span className="gradient-text">clientes</span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="card-hover bg-gray-50 rounded-2xl p-7 border border-gray-100">
                <div className="flex items-center gap-1 text-amber-400 text-sm mb-4">{"★★★★★"}</div>
                <p className="text-gray-700 text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full btn-primary flex items-center justify-center text-white text-xs font-bold">{t.avatar}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ── */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-4">
              Preço simples e <span className="gradient-text">transparente</span>
            </h2>
            <p className="text-gray-500 text-lg">Sem surpresas. Sem taxas escondidas.</p>
          </div>
          <div className="max-w-md mx-auto">
            <div className="bg-white rounded-3xl border-2 border-indigo-100 shadow-xl shadow-indigo-50 p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-indigo-50 to-transparent rounded-bl-full"></div>
              <div className="relative">
                <div className="badge-pill inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold text-indigo-600 mb-6">
                  🎉 3 dias grátis para testar
                </div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-6xl font-extrabold text-gray-900">€5</span>
                  <span className="text-gray-400 font-medium">/mês</span>
                </div>
                <p className="text-gray-400 text-sm mb-8">Faturado mensalmente · Cancele quando quiser</p>
                <ul className="space-y-3 mb-8">
                  {[
                    "Loja online completa",
                    "Produtos ilimitados",
                    "Pagamentos integrados",
                    "Analytics em tempo real",
                    "Suporte prioritário",
                    "Domínio personalizado",
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-gray-700">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold flex-shrink-0">✓</span>
                      {item}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/auth")}
                  className="btn-primary w-full text-white font-semibold py-4 rounded-xl text-base"
                >
                  Começar 3 dias grátis →
                </button>
                <p className="text-center text-xs text-gray-400 mt-4">Sem cartão de crédito necessário</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ── */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
            Pronto para começar a<br />
            <span className="gradient-text">vender online?</span>
          </h2>
          <p className="text-gray-500 text-lg mb-10 max-w-xl mx-auto">
            Junte-se a mais de 12.000 empreendedores que já usam o Katail para gerir os seus negócios.
          </p>
          <button
            onClick={() => navigate("/auth")}
            className="btn-primary text-white font-semibold px-10 py-4 rounded-xl text-lg"
          >
            Criar loja grátis agora →
          </button>
          <p className="text-sm text-gray-400 mt-4">3 dias grátis · Sem cartão · Cancele quando quiser</p>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-gray-100 py-12 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg btn-primary flex items-center justify-center">
                  <span className="text-white font-bold text-xs">K</span>
                </div>
                <span className="font-bold text-gray-900">katail</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">Soluções digitais para o seu negócio crescer.</p>
            </div>
            {[
              { title: "Produto", links: ["Funcionalidades", "Preços", "Segurança", "Integrações"] },
              { title: "Empresa", links: ["Sobre", "Blog", "Carreiras", "Contacto"] },
              { title: "Legal", links: ["Privacidade", "Termos", "Cookies"] },
            ].map((col) => (
              <div key={col.title}>
                <h4 className="text-gray-900 font-semibold text-sm mb-4">{col.title}</h4>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-gray-400 text-sm hover:text-gray-700 transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-100 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-400 text-sm">© 2025 Katail. Todos os direitos reservados.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors text-sm">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors text-sm">LinkedIn</a>
              <a href="#" className="text-gray-400 hover:text-gray-600 transition-colors text-sm">Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
