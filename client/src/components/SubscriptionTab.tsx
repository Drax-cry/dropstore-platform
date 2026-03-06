import React from "react";
import { CheckCircle, Zap, Clock, XCircle, X, CreditCard, Check, Sparkles, TrendingUp } from "lucide-react";

interface SubscriptionTabProps {
  storeId: number;
  trialEndsAt: Date | null;
  subscriptionStatus: "trial" | "active" | "expired" | "cancelled" | null;
  isPending: boolean;
  onInitiateCheckout: (storeId: number) => void;
  onCancelSubscription: (storeId: number) => void;
}

export function SubscriptionTab({
  storeId,
  trialEndsAt,
  subscriptionStatus,
  isPending,
  onInitiateCheckout,
  onCancelSubscription,
}: SubscriptionTabProps) {
  const isFree = !trialEndsAt;
  const now = new Date();
  const daysLeft = trialEndsAt ? Math.max(0, Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))) : null;
  const isTrialExpired = trialEndsAt && trialEndsAt < now;
  const isPaid = subscriptionStatus === "active";
  const isActive = subscriptionStatus === "trial" && !isTrialExpired;

  return (
    <div className="max-w-2xl space-y-8">
      {/* Premium Status Card with Gradient */}
      <div className={`rounded-3xl p-8 text-white relative overflow-hidden shadow-xl ${
        isFree ? "bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700" :
        isPaid ? "bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600" :
        isActive ? "bg-gradient-to-br from-amber-500 via-orange-500 to-red-600" :
        "bg-gradient-to-br from-slate-500 to-slate-700"
      }`}>
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl" style={{background: 'rgba(255,255,255,0.3)'}} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-2xl" style={{background: 'rgba(0,0,0,0.1)'}} />
        </div>
        
        <div className="relative z-10">
          {/* Header */}
          <div className="flex items-start justify-between mb-8">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                {isFree ? <CheckCircle className="w-8 h-8" /> :
                 isPaid ? <Zap className="w-8 h-8" /> :
                 isActive ? <Clock className="w-8 h-8" /> :
                 <XCircle className="w-8 h-8" />}
              </div>
              <div>
                <p className="text-sm font-semibold opacity-90 uppercase tracking-wide">
                  {isFree ? "Acesso Gratuito" :
                   isPaid ? "Subscrição Premium" :
                   isActive ? "Período de Trial" :
                   "Trial Expirado"}
                </p>
                <p className="text-4xl font-bold mt-1">
                  {isFree ? "Gratuito" :
                   isPaid ? "€5/mês" :
                   isActive ? "Teste" :
                   "Expirado"}
                </p>
              </div>
            </div>
            {isPaid && (
              <div className="px-4 py-2 bg-white/30 rounded-full text-sm font-bold backdrop-blur-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Ativo
              </div>
            )}
          </div>
          
          {/* Description */}
          <p className="text-base opacity-95 leading-relaxed mb-6">
            {isFree ? "Acesso permanente com funcionalidades essenciais para gerir a sua loja" :
             isPaid ? "Renovação automática no próximo ciclo de faturação. Cancele a qualquer momento" :
             isActive && daysLeft !== null ? `Tem ${daysLeft} dia${daysLeft !== 1 ? "s" : ""} de teste gratuito restante` :
             "Atualize para continuar usando a sua loja e aceder a todas as funcionalidades"}
          </p>
          
          {/* Expiration Date */}
          {trialEndsAt && !isPaid && (
            <div className="flex items-center gap-3 text-sm opacity-85 font-medium">
              <span className="text-lg">📅</span>
              <span>Expira em {trialEndsAt.toLocaleDateString("pt-PT", { day: "2-digit", month: "long", year: "numeric" })}</span>
            </div>
          )}
        </div>
      </div>

      {/* Progress Bar for Trial */}
      {!isFree && !isPaid && trialEndsAt && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              Progresso do Trial
            </span>
            <span className="text-sm font-bold text-indigo-600">{daysLeft} / 3 dias</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${
                daysLeft === 0 ? "bg-gradient-to-r from-red-500 to-red-600" : 
                daysLeft === 1 ? "bg-gradient-to-r from-amber-500 to-orange-500" : 
                "bg-gradient-to-r from-indigo-500 to-purple-500"
              }`}
              style={{ width: `${Math.min(100, ((daysLeft ?? 0) / 3) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Plan Features */}
      <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-indigo-600" />
          Funcionalidades Incluídas
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {[
            "Loja online personalizada",
            "Produtos ilimitados",
            "Categorias e subcategorias",
            "Banners e promoções",
            "Integração WhatsApp",
            "Suporte prioritário",
          ].map(feature => (
            <div key={feature} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
              <span className="text-sm text-gray-700 font-medium">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-3">
        {!isFree && !isPaid && (
          <button
            onClick={() => onInitiateCheckout(storeId)}
            className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-2xl transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            <CreditCard className="w-5 h-5" />
            {isTrialExpired ? "Desbloquear Loja — €5/mês" : "Subscrever Agora — €5/mês"}
          </button>
        )}
        
        {isPaid && (
          <>
            <div className="flex items-center gap-3 text-sm text-emerald-700 bg-emerald-50 rounded-xl p-4 border border-emerald-200">
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">Subscrição ativa. Será cobrado €5/mês automaticamente via Stripe.</span>
            </div>
            <button
              onClick={() => onCancelSubscription(storeId)}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed text-red-600 font-semibold py-3 px-6 rounded-xl transition-colors border border-red-200"
            >
              {isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  A cancelar...
                </>
              ) : (
                <>
                  <X className="w-5 h-5" />
                  Cancelar Subscrição
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
