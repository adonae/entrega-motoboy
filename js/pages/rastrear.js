import { AuthService } from "../services/AuthService.js";
import { EntregaService } from "../services/EntregaService.js";
import { Dom } from "../utils/dom.js";
import { Format } from "../utils/format.js";
import { handleError } from "../utils/errorHandler.js";
import { MENSAGENS, TIMELINE, STATUS_STEP_INDEX } from "../utils/constants.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await AuthService.init();
  } catch (err) {
    handleError(err, "Autenticacao");
    document.getElementById("card-busca-rastreio").innerHTML =
      `<p class="text-muted">Erro de autenticação. Tente novamente mais tarde.</p>`;
    return;
  }
  const btnBuscar = document.getElementById("btn-buscar");
  const cardBusca = document.getElementById("card-busca-rastreio");
  const cardStatus = document.getElementById("card-status");
  const mapaContainer = document.getElementById("mapa-container");
  const timelineEl = document.getElementById("timeline-status");
  const btnVoltar = document.getElementById("btn-voltar-painel");

  let unsubscribeAtivo = null;

  const rastreioId = new URLSearchParams(window.location.search).get("id");

  if (rastreioId) {
    if (cardBusca) cardBusca.classList.add("hidden");
    if (btnVoltar) btnVoltar.classList.add("hidden");
  }

  function limparRastreio() {
    if (unsubscribeAtivo) {
      unsubscribeAtivo();
      unsubscribeAtivo = null;
    }
  }

  window.addEventListener("beforeunload", limparRastreio);

  function renderizarEntrega(entrega) {
    mapaContainer.innerHTML = `
      <div style="text-align:center;">
        <p><strong>Cliente:</strong> ${Dom.escapeHtml(entrega.nome)}</p>
        <p style="margin-top:0.5rem;">
          <strong>Status:</strong>
          <span class="status-badge ${Format.statusClass(entrega.status)}">
            ${Dom.escapeHtml(Format.statusLabel(entrega.status))}
          </span>
        </p>
        <p class="mt-1 text-muted" style="font-size:0.875rem;">
          Ao vivo - atualiza automaticamente
        </p>
      </div>
    `;

    const currentStep = STATUS_STEP_INDEX[entrega.status] ?? 0;
    timelineEl.innerHTML = TIMELINE.map((step, i) => {
      const active = i <= currentStep;
      return `
        <div class="flex items-center mt-1"
             style="color:${active ? "var(--success)" : "var(--text-muted)"}">
          <span style="margin-right:0.5rem;">${active ? "OK" : "-"}</span>
          <span>${Dom.escapeHtml(step.label)}</span>
        </div>
      `;
    }).join("");
  }

  function iniciarRastreio(id) {
    if (unsubscribeAtivo) {
      unsubscribeAtivo();
      unsubscribeAtivo = null;
    }

    Dom.setLoading(btnBuscar, true, "Buscando...");
    cardStatus.classList.remove("hidden");
    mapaContainer.innerHTML = `<span class="loading">Conectando em tempo real...</span>`;
    timelineEl.innerHTML = "";

    unsubscribeAtivo = EntregaService.escutarPorId(
      id,
      (entrega) => {
        Dom.setLoading(btnBuscar, false);
        renderizarEntrega(entrega);
      },
      (err) => {
        Dom.setLoading(btnBuscar, false);
        const msg = handleError(err, "Rastrear entrega");
        mapaContainer.innerHTML = `<span class="text-muted">${Dom.escapeHtml(msg)}</span>`;
        unsubscribeAtivo = null;
      },
    );
  }

  if (rastreioId) {
    iniciarRastreio(rastreioId);
  }

  btnBuscar.addEventListener("click", () => {
    const id = document.getElementById("input-rastreio").value.trim();
    if (!id) return Dom.showToast(MENSAGENS.ID_INVALIDO, "error");
    iniciarRastreio(id);
  });
});
