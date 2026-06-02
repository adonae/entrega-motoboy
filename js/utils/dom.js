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

  showLinkCriado(link) {
    const div = document.createElement("div");
    div.style.cssText = `
      position:fixed;top:20px;right:20px;left:20px;max-width:500px;
      margin:0 auto;background:var(--surface);border:1px solid var(--border);
      border-radius:var(--radius);padding:1rem;box-shadow:0 4px 12px rgba(0,0,0,0.15);
      z-index:9999;
    `;
    div.innerHTML = `
      <p style="margin-bottom:0.5rem;font-weight:500;">Link de rastreio criado</p>
      <div style="display:flex;gap:0.5rem;align-items:center;">
        <input readonly value="${link}"
          style="flex:1;padding:0.5rem;border:1px solid var(--border);
                 border-radius:var(--radius);font-size:0.875rem;background:var(--bg);" />
        <button onclick="navigator.clipboard.writeText('${link}').then(()=>this.textContent='Copiado!')"
          class="btn btn-primary btn-sm">Copiar</button>
      </div>
      <button onclick="this.closest('div').remove()"
        style="position:absolute;top:8px;right:8px;background:none;border:none;
               cursor:pointer;font-size:1.2rem;color:var(--text-muted);">×</button>
    `;
    document.body.appendChild(div);
  },
};
