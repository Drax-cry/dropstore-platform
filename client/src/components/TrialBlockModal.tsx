import { useEffect, useState } from "react";
import { AlertTriangle, CreditCard, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

interface Props {
  storeId: number;
  trialEndsAt: Date | null;
  onUnlock?: () => void;
}

export default function TrialBlockModal({ storeId, trialEndsAt, onUnlock }: Props) {
  const [, navigate] = useLocation();
  const [daysLeft, setDaysLeft] = useState(0);

  useEffect(() => {
    if (!trialEndsAt) return;

    const calculateDaysLeft = () => {
      const now = new Date();
      const diff = trialEndsAt.getTime() - now.getTime();
      const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
      setDaysLeft(Math.max(0, days));
    };

    calculateDaysLeft();
    const interval = setInterval(calculateDaysLeft, 1000 * 60); // Update every minute
    return () => clearInterval(interval);
  }, [trialEndsAt]);

  const handleCheckout = () => {
    navigate(`/checkout?storeId=${storeId}`);
    onUnlock?.();
  };

  if (daysLeft > 0) return null; // Trial still active

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-8 h-8 text-red-600" />
        </div>

        <h2 className="text-2xl font-bold text-gray-900 mb-2">Período de Teste Expirado</h2>
        <p className="text-gray-500 mb-6">
          O seu período de teste de 3 dias terminou. Subscreva agora para continuar a gerir a sua loja.
        </p>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-900">
            <strong>Plano DropStore:</strong> €5/mês
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Acesso completo a todas as funcionalidades
          </p>
        </div>

        <button
          onClick={handleCheckout}
          className="w-full bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2 mb-3"
        >
          <CreditCard className="w-5 h-5" />
          Desbloquear Loja - €5/mês
          <ArrowRight className="w-4 h-4" />
        </button>

        <button
          onClick={() => navigate("/admin")}
          className="w-full border border-gray-200 text-gray-600 px-6 py-3 rounded-full font-medium hover:bg-gray-50 transition-colors"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
