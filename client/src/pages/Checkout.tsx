import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function Checkout() {
  const { isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  // Get storeId from URL params
  const params = new URLSearchParams(window.location.search);
  const storeId = params.get("storeId");
  const sessionId = params.get("session_id");

  useEffect(() => {
    if (loading) return;

    if (!isAuthenticated) {
      navigate("/auth");
      return;
    }

    if (!storeId) {
      setStatus("error");
      setMessage("Parâmetros inválidos");
      return;
    }

    // If this is a success callback from Stripe
    if (sessionId) {
      handlePaymentSuccess();
    } else {
      // Initiate checkout
      initiateCheckout();
    }
  }, [isAuthenticated, loading, storeId, sessionId]);

  const activateSubscriptionMutation = trpc.trial.activateSubscription.useMutation({
    onSuccess: () => {
      setStatus("success");
      setMessage("Subscrição ativada com sucesso! Redirecionando...");
      toast.success("Loja desbloqueada!");
      setTimeout(() => {
        navigate("/admin");
      }, 2000);
    },
    onError: (error) => {
      setStatus("error");
      setMessage(error.message || "Erro ao ativar subscrição");
      toast.error("Erro ao ativar subscrição");
    },
  });

  const handlePaymentSuccess = async () => {
    if (!storeId || !sessionId) return;
    activateSubscriptionMutation.mutate({
      storeId: parseInt(storeId),
      stripeSessionId: sessionId,
    });
  };

  const initiateCheckout = async () => {
    if (!storeId) return;

    try {
      // In a real implementation, this would call your backend to create a Stripe checkout session
      // For now, we'll simulate the checkout process
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ storeId: parseInt(storeId) }),
      });

      if (!response.ok) {
        throw new Error("Erro ao criar sessão de checkout");
      }

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Erro ao iniciar checkout");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="max-w-md w-full text-center">
        {status === "loading" && (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-black animate-spin" />
            <h1 className="text-2xl font-bold mb-2">A processar pagamento...</h1>
            <p className="text-gray-500">Por favor aguarde enquanto processamos a sua subscrição.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <h1 className="text-2xl font-bold mb-2">Pagamento Confirmado!</h1>
            <p className="text-gray-500 mb-6">{message}</p>
            <button
              onClick={() => navigate("/admin")}
              className="w-full bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              Ir para o Painel
            </button>
          </>
        )}

        {status === "error" && (
          <>
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <h1 className="text-2xl font-bold mb-2">Erro no Pagamento</h1>
            <p className="text-gray-500 mb-6">{message}</p>
            <button
              onClick={() => navigate("/admin")}
              className="w-full bg-black text-white px-6 py-3 rounded-full font-medium hover:bg-gray-800 transition-colors"
            >
              Voltar ao Painel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
