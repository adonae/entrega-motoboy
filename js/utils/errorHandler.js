import { Dom } from "./dom.js";

export function handleError(err, context = "Operacao", fallback = "Erro inesperado.") {
  const message = err instanceof Error ? err.message : fallback;
  console.error(`[${context}]`, err);
  Dom.showToast(message, "error");
  return message;
}

export function logError(err, context = "Operacao") {
  console.error(`[${context}]`, err);
}
