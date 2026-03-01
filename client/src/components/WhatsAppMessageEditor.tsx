import { useState, useRef } from "react";
import { MessageCircle, RotateCcw, Sparkles, Eye, Code2, Plus } from "lucide-react";

const VARIABLES = [
  { key: "{{produto}}", label: "Nome do produto", example: "Camiseta Branca", color: "bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100" },
  { key: "{{preco}}", label: "Preço", example: "R$ 89,90", color: "bg-green-50 border-green-200 text-green-700 hover:bg-green-100" },
  { key: "{{tamanho}}", label: "Tamanho", example: "M", color: "bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100" },
];

const TEMPLATES = [
  {
    label: "Simples",
    icon: "💬",
    message: `Olá! Tenho interesse no produto *{{produto}}* no tamanho {{tamanho}}.\n\nPreço: {{preco}}\n\nPoderia confirmar disponibilidade?`,
  },
  {
    label: "Detalhado",
    icon: "🛍️",
    message: `Olá! Gostaria de encomendar:\n\n🛍️ *{{produto}}*\n📏 Tamanho: {{tamanho}}\n💰 Preço: {{preco}}\n\nAguardo confirmação. Obrigado!`,
  },
  {
    label: "Direto",
    icon: "⚡",
    message: `Quero comprar: *{{produto}}* — Tamanho {{tamanho}} — {{preco}}`,
  },
  {
    label: "Formal",
    icon: "📋",
    message: `Bom dia!\n\nGostaria de solicitar informações sobre o produto abaixo:\n\n• Produto: *{{produto}}*\n• Tamanho: {{tamanho}}\n• Valor: {{preco}}\n\nAguardo retorno. Obrigado.`,
  },
];

interface Props {
  value: string;
  onChange: (val: string) => void;
  defaultMessage: string;
}

export default function WhatsAppMessageEditor({ value, onChange, defaultMessage }: Props) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const previewText = value
    .replace(/\{\{produto\}\}/g, "Camiseta Branca")
    .replace(/\{\{preco\}\}/g, "R$ 89,90")
    .replace(/\{\{tamanho\}\}/g, "M");

  const insertAtCursor = (variable: string) => {
    const el = textareaRef.current;
    if (!el) {
      onChange(value + variable);
      return;
    }
    const start = el.selectionStart ?? value.length;
    const end = el.selectionEnd ?? value.length;
    const newVal = value.slice(0, start) + variable + value.slice(end);
    onChange(newVal);
    // Restore cursor after variable
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + variable.length, start + variable.length);
    }, 0);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageCircle className="w-4 h-4 text-green-600" />
          <p className="text-sm font-medium text-gray-700">Mensagem do WhatsApp</p>
        </div>
        {/* Edit / Preview toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
          <button
            type="button"
            onClick={() => setMode("edit")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              mode === "edit" ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Code2 className="w-3 h-3" />
            Editar
          </button>
          <button
            type="button"
            onClick={() => setMode("preview")}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
              mode === "preview" ? "bg-white shadow text-gray-800" : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <Eye className="w-3 h-3" />
            Preview
          </button>
        </div>
      </div>

      {/* Templates */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <p className="text-xs font-medium text-gray-600">Templates prontos</p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              type="button"
              onClick={() => onChange(t.message)}
              className="flex items-center gap-2 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-left hover:bg-amber-50 hover:border-amber-300 transition-all group"
            >
              <span className="text-base">{t.icon}</span>
              <span className="text-xs font-medium text-gray-600 group-hover:text-amber-700">{t.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Variables */}
      <div>
        <p className="text-xs font-medium text-gray-600 mb-2">
          Clique para inserir na posição do cursor:
        </p>
        <div className="flex flex-wrap gap-2">
          {VARIABLES.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => insertAtCursor(v.key)}
              className={`flex items-center gap-1 text-xs border px-2.5 py-1.5 rounded-lg transition-all font-mono ${v.color}`}
              title={`Insere: ${v.key} → ex: "${v.example}"`}
            >
              <Plus className="w-3 h-3" />
              {v.key}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-1.5">
          As variáveis são substituídas automaticamente pelo valor real do produto.
        </p>
      </div>

      {/* Editor / Preview */}
      {mode === "edit" ? (
        <div className="relative">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            rows={7}
            placeholder={defaultMessage}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none font-mono bg-gray-50"
          />
          <span className="absolute bottom-2 right-3 text-xs text-gray-300">{value.length} chars</span>
        </div>
      ) : (
        /* WhatsApp-style chat bubble preview */
        <div className="bg-[#e5ddd5] rounded-xl p-4 min-h-[140px]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23c8b8a2' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }}>
          <div className="flex justify-end">
            <div className="bg-[#dcf8c6] rounded-2xl rounded-tr-sm px-3 py-2 max-w-[85%] shadow-sm">
              <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{previewText || "(mensagem vazia)"}</p>
              <p className="text-right text-xs text-gray-400 mt-1">agora ✓✓</p>
            </div>
          </div>
        </div>
      )}

      {/* Reset */}
      <button
        type="button"
        onClick={() => onChange(defaultMessage)}
        className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        <RotateCcw className="w-3 h-3" />
        Restaurar mensagem padrão
      </button>
    </div>
  );
}
