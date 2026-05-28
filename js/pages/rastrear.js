import { EntregaService } from "../services/EntregaService.js";
import { Dom } from "../utils/dom.js";
import { Format } from "../utils/format.js";
import { handleError } from "../utils/errorHandler.js";
import { MENSAGENS } from "../utils/constants.js";

const TIMELINE_STEPS = [
  { label: "Pedido criado", status: "pendente" },
  { label: "Saiu para entrega", status: "em_rota" },
  { label: "Em rota", status: "em_rota" },
  { label: "Entregue", status: "entregue" },
];

const STATUS_STEP_INDEX = { pendente: 0, em_rota: 2, entregue: 3 };

document.addEventListener("DOMContentLoaded", () => {
  const btnBuscar = document.getElementById("btn-buscar");
  const cardStatus = document.getElementById("card-status");
  const mapaContainer = document.getElementById("mapa-container");
  const timelineEl = document.getElementById("timeline-status");

  let unsubscribeAtivo = null;

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
    timelineEl.innerHTML = TIMELINE_STEPS.map((step, i) => {
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

  btnBuscar.addEventListener("click", () => {
    const id = document.getElementById("input-rastreio").value.trim();
    if (!id) return Dom.showToast(MENSAGENS.ID_INVALIDO, "error");

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
  });
});
