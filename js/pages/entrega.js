import { EntregaService } from "../services/EntregaService.js";
import { Dom } from "../utils/dom.js";
import { Format } from "../utils/format.js";

document.addEventListener("DOMContentLoaded", () => {
  const entregaId = new URLSearchParams(window.location.search).get("id");
  const cardEntrega = document.getElementById("card-entrega");
  const cardConfirmacao = document.getElementById("card-confirmacao");
  const detalhesEl = document.getElementById("detalhes-entrega");
  const btnConfirmar = document.getElementById("btn-confirmar");

  if (!entregaId) {
    Dom.showError(cardEntrega, "ID nao informado.");
    return;
  }

  async function carregar() {
    try {
      const entrega = await EntregaService.buscarPorId(entregaId);

      cardEntrega.classList.add("hidden");
      cardConfirmacao.classList.remove("hidden");
      detalhesEl.innerHTML = `
        <p><strong>Cliente:</strong> ${Dom.escapeHtml(entrega.nome)}</p>
        <p><strong>Endereco:</strong> ${Dom.escapeHtml(entrega.endereco)}</p>
        <p><strong>Telefone:</strong> ${Dom.escapeHtml(Format.phone(entrega.telefone))}</p>
        <p><strong>Status:</strong>
          <span class="status-badge ${Format.statusClass(entrega.status)}">${Dom.escapeHtml(Format.statusLabel(entrega.status))}</span>
        </p>
      `;

      document.getElementById("form-confirmar").addEventListener("submit", async (e) => {
        e.preventDefault();
        Dom.setLoading(btnConfirmar, true, "Confirmando...");
        try {
          await EntregaService.confirmarEntrega(entregaId, {
            observacoesEntrega: document.getElementById("obs-entrega").value.trim(),
          });
          Dom.showToast("Entrega confirmada!", "success");
          setTimeout(() => (window.location.href = "index.html"), 1500);
        } catch (err) {
          console.error(err);
          Dom.showToast(err.message || "Erro ao confirmar.", "error");
        } finally {
          Dom.setLoading(btnConfirmar, false);
        }
      });
    } catch (err) {
      console.error(err);
      Dom.showError(cardEntrega, err.message || "Falha ao carregar.");
    }
  }

  carregar();
});
