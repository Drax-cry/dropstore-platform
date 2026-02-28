import { useState, useEffect } from "react";
import { Clock, Zap, X } from "lucide-react";

interface Props {
  trialEndsAt: Date;
  onUpgrade: () => void;
}

function getTimeLeft(trialEndsAt: Date) {
  const now = new Date();
  const diff = trialEndsAt.getTime() - now.getTime();
  if (diff <= 0) return null;

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, totalSeconds };
}

export default function TrialCountdownBanner({ trialEndsAt, onUpgrade }: Props) {
  const [timeLeft, setTimeLeft] = useState(() => getTimeLeft(trialEndsAt));
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(getTimeLeft(trialEndsAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [trialEndsAt]);

  if (!timeLeft || dismissed) return null;

  const isUrgent = timeLeft.days === 0; // menos de 1 dia
  const isWarning = timeLeft.days <= 1;  // 1 dia ou menos

  const bgClass = isUrgent
    ? "bg-gradient-to-r from-red-500 to-orange-500"
    : isWarning
    ? "bg-gradient-to-r from-orange-400 to-amber-500"
    : "bg-gradient-to-r from-blue-600 to-indigo-600";

  return (
    <div className={`${bgClass} rounded-xl p-4 mb-6 text-white shadow-lg`}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left: Icon + Text */}
        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
          <div className="bg-white/20 rounded-lg p-2 flex-shrink-0">
            <Clock className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-sm sm:text-base">
              {isUrgent ? "⚠️ O teu trial expira hoje!" : "Período de Teste Gratuito"}
            </p>
            <p className="text-xs sm:text-sm text-white/80 mt-0.5">
              {isUrgent
                ? "Subscreve agora para não perderes acesso à tua loja"
                : "Aproveita os 3 dias gratuitos — depois é €5/mês"}
            </p>
          </div>
        </div>

        {/* Center: Countdown */}
        <div className="flex items-center gap-2 justify-center sm:justify-start flex-shrink-0">
          {timeLeft.days > 0 && (
            <div className="bg-white/20 rounded-lg px-3 py-2 text-center min-w-[52px]">
              <p className="text-xl font-bold leading-none">{timeLeft.days}</p>
              <p className="text-[10px] text-white/70 mt-0.5">dias</p>
            </div>
          )}
          <div className="bg-white/20 rounded-lg px-3 py-2 text-center min-w-[52px]">
            <p className="text-xl font-bold leading-none">{String(timeLeft.hours).padStart(2, "0")}</p>
            <p className="text-[10px] text-white/70 mt-0.5">horas</p>
          </div>
          <div className="bg-white/20 rounded-lg px-3 py-2 text-center min-w-[52px]">
            <p className="text-xl font-bold leading-none">{String(timeLeft.minutes).padStart(2, "0")}</p>
            <p className="text-[10px] text-white/70 mt-0.5">min</p>
          </div>
          <div className="bg-white/20 rounded-lg px-3 py-2 text-center min-w-[52px]">
            <p className="text-xl font-bold leading-none">{String(timeLeft.seconds).padStart(2, "0")}</p>
            <p className="text-[10px] text-white/70 mt-0.5">seg</p>
          </div>
        </div>

        {/* Right: CTA + Dismiss */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onUpgrade}
            className="flex items-center gap-1.5 bg-white text-blue-700 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-white/90 transition-colors shadow-sm"
          >
            <Zap className="w-4 h-4" />
            Subscrever €5/mês
          </button>
          {!isUrgent && (
            <button
              onClick={() => setDismissed(true)}
              className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-white/70 hover:text-white"
              title="Fechar"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
