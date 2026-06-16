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
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.className = `toast toast-${type}`;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = "0";
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  },

  setLoading(element, isLoading, loadingText = "Carregando...") {
    if (!element) return;
    const key = "opencodeLoadingCount";
    element[key] = element[key] || 0;

    if (isLoading) {
      if (element[key] === 0) {
        element.dataset.originalText = element.textContent;
        element.textContent = "";
        const span = document.createElement("span");
        span.className = "loading";
        span.textContent = loadingText;
        element.appendChild(span);
        element.disabled = true;
      }
      element[key]++;
    } else {
      element[key] = Math.max(0, element[key] - 1);
      if (element[key] === 0) {
        element.textContent = element.dataset.originalText || "";
        element.disabled = false;
      }
    }
  },

  showError(element, message) {
    if (!element) return;
    element.innerHTML = `<p class="text-muted">${message}</p>`;
  },

  showLinkCriado(link) {
    const div = document.createElement("div");
    div.className = "toast-link-card";
    div.innerHTML = `
      <p>Link de rastreio criado</p>
      <div class="link-input-group">
        <input readonly value="${this.escapeHtml(link)}" />
        <button data-copiar-link class="btn btn-primary btn-sm">Copiar</button>
      </div>
      <button data-fechar-card class="close-btn">×</button>
    `;

    div.querySelector("[data-copiar-link]").addEventListener("click", () => {
      navigator.clipboard.writeText(link).then(() => {
        div.querySelector("[data-copiar-link]").textContent = "Copiado!";
      });
    });

    div.querySelector("[data-fechar-card]").addEventListener("click", () => {
      div.remove();
    });

    document.body.appendChild(div);
  },
};
