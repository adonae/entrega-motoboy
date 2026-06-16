import { AuthService } from "../services/AuthService.js";
import { LoteService } from "../services/LoteService.js";
import { Dom } from "../utils/dom.js";
import { Format } from "../utils/format.js";
import { handleError } from "../utils/errorHandler.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await AuthService.init();
  } catch (err) {
    handleError(err, "Autenticacao");
    document.getElementById("lista-lotes").innerHTML =
      `<li class="text-muted">Erro de autenticacao. Verifique o Firebase Console.</li>`;
    return;
  }

  const listaEl = document.getElementById("lista-lotes");
  const modal = document.getElementById("modal-excluir");
  const msgEl = document.getElementById("modal-mensagem");
  const btnExcluir = document.getElementById("btn-modal-excluir");
  const btnLiberar = document.getElementById("btn-modal-liberar");
  const btnCancelar = document.getElementById("btn-modal-cancelar");

  let loteAcao = null;

  function fecharModal() {
    modal.classList.add("hidden");
    loteAcao = null;
  }

  function abrirModal(lote) {
    loteAcao = lote;
    const nome = lote.nomeDisplay || "Lote";
    msgEl.textContent = `O que fazer com as entregas do ${nome}?`;
    modal.classList.remove("hidden");
  }

  btnCancelar.addEventListener("click", fecharModal);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) fecharModal();
  });

  btnExcluir.addEventListener("click", async () => {
    if (!loteAcao) return;
    const lote = loteAcao;
    fecharModal();
    Dom.setLoading(btnExcluir, true, "Excluindo...");
    try {
      await LoteService.excluir(lote.id);
      Dom.showToast("Lote excluido.", "success");
      await carregarLotes();
    } catch (err) {
      handleError(err, "Excluir lote", "Erro ao excluir lote.");
    } finally {
      Dom.setLoading(btnExcluir, false);
    }
  });

  btnLiberar.addEventListener("click", async () => {
    if (!loteAcao) return;
    const lote = loteAcao;
    fecharModal();
    Dom.setLoading(btnLiberar, true, "Liberando...");
    try {
      await LoteService.liberarPedidos(lote.id);
      Dom.showToast("Pedidos liberados para o painel.", "success");
      await carregarLotes();
    } catch (err) {
      handleError(err, "Liberar pedidos", "Erro ao liberar pedidos.");
    } finally {
      Dom.setLoading(btnLiberar, false);
    }
  });

  async function carregarLotes() {
    listaEl.innerHTML = `<li class="loading">Carregando lotes...</li>`;
    try {
      const lotes = await LoteService.listarTodos();
      if (!lotes.length) {
        listaEl.innerHTML = `<li class="text-muted">Nenhum lote criado ainda.</li>`;
        return;
      }
      listaEl.innerHTML = "";
      lotes.forEach((lote, idx) => {
        const dataCriacao = Format.date(lote.criadoEm);
        const qtd = lote.entregaIds?.length ?? 0;
        const saiu = lote.saiuEm != null;
        const li = document.createElement("li");
        li.className = "flex justify-between items-center mt-1";
        li.style.padding = "0.75rem 0";
        li.style.borderBottom = "1px solid var(--border)";
        lote.nomeDisplay = `Lote ${idx + 1}`;
        li.innerHTML = `
          <div>
            <strong>${lote.nomeDisplay}</strong><br>
            <small class="text-muted">${dataCriacao} &middot; ${qtd} entrega(s)</small>
          </div>
          <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
            <span class="status-badge ${saiu ? "status-saiu_loja" : "status-pendente"}">
              ${saiu ? "Saiu da loja" : "Pendente"}
            </span>
            <a href="lote.html?id=${encodeURIComponent(lote.id)}" class="btn btn-secondary btn-sm">Abrir</a>
            <button type="button" class="btn btn-danger btn-sm" data-excluir-lote-id="${lote.id}">Excluir</button>
          </div>
        `;
        listaEl.appendChild(li);
      });
    } catch (err) {
      handleError(err, "Carregar lotes", "Erro ao carregar lotes.");
      listaEl.innerHTML = `<li class="text-muted">Erro ao carregar.</li>`;
    }
  }

  listaEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-excluir-lote-id]");
    if (!btn) return;
    const loteId = btn.dataset.excluirLoteId;
    const lote = { id: loteId, nomeDisplay: btn.closest("li")?.querySelector("strong")?.textContent || "Lote" };
    abrirModal(lote);
  });

  await carregarLotes();
});
