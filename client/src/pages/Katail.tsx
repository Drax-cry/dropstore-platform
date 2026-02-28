import { useLocation } from "wouter";
import { useState } from "react";
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

  return (
    <div className="selection-ocean">
      <style>{`
        :root {
          --midnight: #122C4F;
          --cream-grey: #F2F4F7;
          --noir: #000000;
          --ocean: #5B88B2;
        }

        body {
          font-family: 'Inter', sans-serif;
          background-color: var(--noir);
          color: var(--cream-grey);
        }

        .bg-midnight { background-color: var(--midnight); }
        .text-midnight { color: var(--midnight); }
        .border-midnight { border-color: var(--midnight); }

        .bg-cream { background-color: var(--cream-grey); }
        .text-cream { color: var(--cream-grey); }

        .bg-ocean { background-color: var(--ocean); }
        .text-ocean { color: var(--ocean); }
        .border-ocean { border-color: var(--ocean); }

        .navbar-floating {
          margin-top: 20px;
          border-radius: 12px;
          box-shadow: 0 4px 25px rgba(0, 0, 0, 0.4);
        }

        .hero-gradient {
          background: linear-gradient(180deg, var(--noir) 0%, var(--midnight) 100%);
        }

        details summary::-webkit-details-marker {
          display: none;
        }
        
        details[open] summary i {
          transform: rotate(180deg);
        }

        .selection-ocean::selection {
          background-color: var(--ocean);
          color: white;
        }

        .btn-checkout:active {
          transform: scale(0.98);
        }
      `}</style>

      {/* Header Flutuante */}
      <div className="fixed top-0 left-0 w-full z-50 px-4 sm:px-6 lg:px-8">
        <header className="max-w-7xl mx-auto navbar-floating bg-cream">
          <div className="flex justify-between items-center h-16 px-6">
            {/* Logótipo */}
            <div className="flex items-center gap-12">
              <div className="flex items-center text-midnight font-bold text-2xl gap-1">
                <i className="fas fa-layer-group"></i>
                <span>katail</span>
              </div>
              
              {/* Menu Desktop */}
              <nav className="hidden lg:flex space-x-6 text-sm font-semibold text-midnight/80">
                <div className="flex items-center gap-1 cursor-pointer hover:text-midnight transition">
                  Produto <i className="fas fa-chevron-down text-[10px]"></i>
                </div>
                <div className="flex items-center gap-1 cursor-pointer hover:text-midnight transition">
                  Soluções <i className="fas fa-chevron-down text-[10px]"></i>
                </div>
                <a href="#" className="hover:text-midnight transition">Taxa</a>
                <a href="#" className="hover:text-midnight transition">Comprar curso</a>
                <a href="#" className="hover:text-midnight transition">Ajuda</a>
              </nav>
            </div>

            {/* Botões */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/auth")}
                className="flex items-center border border-midnight text-midnight rounded-lg px-4 py-2 text-sm font-bold hover:bg-midnight hover:text-white transition"
              >
                Entrar <i className="fas fa-caret-down ml-2"></i>
              </button>
              <button 
                onClick={() => navigate("/auth")}
                className="bg-midnight text-white px-5 py-2.5 rounded-lg text-sm font-bold shadow-md hover:bg-ocean transition"
              >
                Comece gratuitamente
              </button>
            </div>
          </div>
        </header>
      </div>

      {/* Secção Hero */}
      <main className="relative min-h-screen flex items-center pt-24 pb-12 px-4 sm:px-6 lg:px-8 overflow-hidden hero-gradient">
        {/* Ilustração SVG Notebook Minimalista */}
        <div className="absolute right-0 top-1/2 -translate-y-1/2 w-full lg:w-3/4 opacity-10 pointer-events-none transform translate-x-1/4">
          <svg viewBox="0 0 800 600" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
            <rect x="150" y="100" width="500" height="320" rx="20" stroke="#5B88B2" strokeWidth="2" />
            <path d="M100 420H700L720 460C720 471.046 711.046 480 700 480H100C88.9543 480 80 471.046 80 460L100 420Z" stroke="#5B88B2" strokeWidth="2" />
            <rect x="340" y="435" width="120" height="30" rx="5" stroke="#5B88B2" strokeWidth="1" />
          </svg>
        </div>

        <div className="max-w-7xl mx-auto w-full grid md:grid-cols-2 gap-12 items-center relative z-10">
          <div className="text-cream">
            <h1 className="text-4xl md:text-5xl lg:text-7xl font-bold leading-tight mb-6">
              Aqui o seu negócio digital <span className="text-ocean">acontece.</span>
            </h1>
            <ul className="space-y-4 mb-10">
              <li className="flex items-center gap-3">
                <i className="fas fa-check-circle text-ocean text-xl"></i>
                <p className="text-lg font-medium">Crie, gira e venda para o mundo</p>
              </li>
              <li className="flex items-center gap-3">
                <i className="fas fa-check-circle text-ocean text-xl"></i>
                <p className="text-lg font-medium">Ecossistema mais completo do mercado</p>
              </li>
            </ul>
            <div className="inline-block bg-white/5 backdrop-blur-xl border border-white/10 p-5 rounded-2xl">
              <p className="text-sm font-semibold mb-2 text-ocean uppercase tracking-widest">Seguro e confiável</p>
              <div className="flex items-center gap-2 mb-1">
                <div className="flex text-ocean">
                  <i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i><i className="fas fa-star"></i>
                </div>
                <span className="font-bold text-xl">4.8</span>
              </div>
              <p className="text-xs opacity-60">Baseado em +200.000 avaliações</p>
            </div>
          </div>

          <div className="flex justify-center md:justify-end">
            <div className="bg-cream p-8 rounded-3xl shadow-2xl w-full max-w-md text-midnight">
              <h2 className="text-2xl font-bold text-center mb-1">Crie sua conta agora.</h2>
              <p className="text-center text-midnight/60 font-medium mb-8">É gratuito e rápido</p>
              <div className="grid grid-cols-2 gap-4 mb-8">
                <button className="flex items-center justify-center gap-2 border border-midnight/20 py-3 rounded-xl hover:bg-midnight/5 transition">
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                </button>
                <button className="flex items-center justify-center gap-2 border border-midnight/20 py-3 rounded-xl hover:bg-midnight/5 transition">
                  <i className="fab fa-apple text-xl text-noir"></i>
                </button>
              </div>
              <form className="space-y-4" onSubmit={handleCreateAccount}>
                <input
                  type="text"
                  placeholder="Nome completo"
                  value={formData.name}
                  onChange={(e) => setFormData(p => ({ ...p, name: e.target.value }))}
                  className="w-full px-4 py-4 bg-white border border-midnight/10 rounded-xl outline-none focus:border-ocean transition placeholder:text-gray-400"
                />
                <input
                  type="email"
                  placeholder="E-mail profissional"
                  value={formData.email}
                  onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                  className="w-full px-4 py-4 bg-white border border-midnight/10 rounded-xl outline-none focus:border-ocean transition placeholder:text-gray-400"
                />
                <input
                  type="password"
                  placeholder="Senha (mín. 6 caracteres)"
                  value={formData.password}
                  onChange={(e) => setFormData(p => ({ ...p, password: e.target.value }))}
                  className="w-full px-4 py-4 bg-white border border-midnight/10 rounded-xl outline-none focus:border-ocean transition placeholder:text-gray-400"
                />
                <button type="submit" disabled={isLoading} className="w-full bg-midnight text-white font-bold py-4 rounded-xl shadow-lg hover:bg-ocean transition mt-6 disabled:opacity-60 disabled:cursor-not-allowed">
                  Criar minha conta
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>

      {/* Acesso Antecipado */}
      <section className="bg-cream py-24 px-4 sm:px-6 lg:px-8 text-midnight">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="w-full md:w-1/2 flex justify-center">
            <div className="relative w-80 h-80 bg-midnight/5 rounded-full flex items-center justify-center">
              <i className="fas fa-rocket text-8xl text-midnight opacity-20"></i>
              <div className="absolute inset-0 border-2 border-dashed border-midnight/10 rounded-full animate-[spin_20s_linear_infinite]"></div>
            </div>
          </div>
          <div className="w-full md:w-1/2 text-left">
            <span className="inline-block bg-midnight text-white rounded-full px-4 py-1.5 text-xs font-bold mb-6 uppercase tracking-widest">
              Acesso Antecipado
            </span>
            <h2 className="text-4xl lg:text-5xl font-bold leading-tight mb-6">
              Os mesmos benefícios de quem já <span className="text-ocean">fatura alto.</span>
            </h2>
            <p className="text-midnight/70 text-lg mb-8 leading-relaxed">
              Desbloqueie ferramentas exclusivas: suporte prioritário, gerente de contas e as melhores taxas do mercado europeu.
            </p>
            <button className="bg-midnight text-white font-bold px-8 py-4 rounded-xl shadow-md hover:bg-ocean transition">
              Ver todos os benefícios
            </button>
          </div>
        </div>
      </section>

      {/* Estatísticas */}
      <section className="bg-noir text-cream py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-4xl lg:text-6xl font-bold mb-20 text-center lg:text-left max-w-3xl">
            Lidamos com a <span className="text-ocean">complexidade</span> para que você foque no lucro.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-16">
            <div className="border-l border-ocean/30 pl-8">
              <p className="text-5xl font-bold mb-4 text-ocean">+ 50M</p>
              <p className="opacity-60 text-sm font-semibold uppercase tracking-widest">Em vendas processadas</p>
            </div>
            <div className="border-l border-ocean/30 pl-8">
              <p className="text-5xl font-bold mb-4 text-ocean">180+</p>
              <p className="opacity-60 text-sm font-semibold uppercase tracking-widest">Países suportados</p>
            </div>
            <div className="border-l border-ocean/30 pl-8">
              <p className="text-5xl font-bold mb-4 text-ocean">99.9%</p>
              <p className="opacity-60 text-sm font-semibold uppercase tracking-widest">Uptime garantido</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="bg-midnight py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-cream mb-4">Plano Simples e Transparente</h2>
          <p className="text-cream/60 text-lg mb-12">Tudo o que precisa para criar e gerir a sua loja online</p>
          
          <div className="max-w-md mx-auto bg-noir rounded-2xl border border-ocean/30 p-8 shadow-lg">
            <div className="mb-6">
              <p className="text-cream/60 text-sm font-semibold uppercase tracking-widest mb-2">Plano Profissional</p>
              <div className="flex items-baseline justify-center gap-2">
                <span className="text-5xl font-bold text-ocean">€5</span>
                <span className="text-cream/60">/mês</span>
              </div>
            </div>
            
            <ul className="text-left space-y-4 mb-8">
              <li className="flex items-center gap-3 text-cream">
                <i className="fas fa-check text-ocean"></i>
                <span>Acesso completo à plataforma</span>
              </li>
              <li className="flex items-center gap-3 text-cream">
                <i className="fas fa-check text-ocean"></i>
                <span>Até 100 produtos</span>
              </li>
              <li className="flex items-center gap-3 text-cream">
                <i className="fas fa-check text-ocean"></i>
                <span>Gerenciamento de lojas</span>
              </li>
              <li className="flex items-center gap-3 text-cream">
                <i className="fas fa-check text-ocean"></i>
                <span>Suporte por email</span>
              </li>
              <li className="flex items-center gap-3 text-cream">
                <i className="fas fa-check text-ocean"></i>
                <span>Relatórios e analytics</span>
              </li>
            </ul>
            
            <button 
              onClick={handleCreateAccount}
              className="w-full bg-ocean hover:bg-ocean/90 text-noir font-bold py-3 px-6 rounded-lg transition duration-200 transform hover:scale-105"
            >
              Experimente Grátis
            </button>
            <p className="text-cream/40 text-xs mt-4">Sem cartão de crédito necessário</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-noir border-t border-ocean/10 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center text-cream font-bold text-xl gap-1 mb-4">
                <i className="fas fa-layer-group"></i>
                <span>katail</span>
              </div>
              <p className="text-cream/60 text-sm">Soluções digitais para o seu negócio crescer.</p>
            </div>
            <div>
              <h4 className="text-cream font-bold mb-4">Produto</h4>
              <ul className="space-y-2 text-cream/60 text-sm">
                <li><a href="#" className="hover:text-cream transition">Funcionalidades</a></li>
                <li><a href="#" className="hover:text-cream transition">Preços</a></li>
                <li><a href="#" className="hover:text-cream transition">Segurança</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-cream font-bold mb-4">Empresa</h4>
              <ul className="space-y-2 text-cream/60 text-sm">
                <li><a href="#" className="hover:text-cream transition">Sobre</a></li>
                <li><a href="#" className="hover:text-cream transition">Blog</a></li>
                <li><a href="#" className="hover:text-cream transition">Contacto</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-cream font-bold mb-4">Legal</h4>
              <ul className="space-y-2 text-cream/60 text-sm">
                <li><a href="#" className="hover:text-cream transition">Privacidade</a></li>
                <li><a href="#" className="hover:text-cream transition">Termos</a></li>
                <li><a href="#" className="hover:text-cream transition">Cookies</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-ocean/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-cream/60 text-sm">© 2025 Katail. Todos os direitos reservados.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="text-cream/60 hover:text-cream transition"><i className="fab fa-twitter"></i></a>
              <a href="#" className="text-cream/60 hover:text-cream transition"><i className="fab fa-linkedin"></i></a>
              <a href="#" className="text-cream/60 hover:text-cream transition"><i className="fab fa-github"></i></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
