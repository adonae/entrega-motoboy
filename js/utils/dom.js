export const Dom = {
  escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  },

  showToast(message, type = "info") {
    const bg =
      type === "success"
        ? "var(--success)"
        : type === "error"
          ? "var(--danger)"
          : "var(--primary)";
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = `position:fixed;bottom:20px;right:20px;padding:12px 16px;border-radius:8px;background:${bg};color:white;z-index:9999;box-shadow:0 4px 6px rgba(0,0,0,0.1);transition:opacity 0.3s;`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  setLoading(element, isLoading, loadingText = "Carregando...") {
    if (!element) return;
    if (isLoading) {
      element.dataset.originalText = element.textContent;
      element.textContent = "";
      const span = document.createElement("span");
      span.className = "loading";
      span.textContent = loadingText;
      element.appendChild(span);
      element.disabled = true;
    } else {
      element.textContent = element.dataset.originalText || "";
      element.disabled = false;
    }
  },

  showError(element, message) {
    if (!element) return;
    element.innerHTML = `<p class="text-muted">${message}</p>`;
  },
};
