import { AuthService } from "../services/AuthService.js";
import { LoteRepository } from "../repositories/LoteRepository.js";
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

  async function carregarLotes() {
    listaEl.innerHTML = `<li class="loading">Carregando lotes...</li>`;
    try {
      const lotes = await LoteRepository.listAll();
      if (!lotes.length) {
        listaEl.innerHTML = `<li class="text-muted">Nenhum lote criado ainda.</li>`;
        return;
      }
      listaEl.innerHTML = "";
      lotes.forEach((lote) => {
        const dataCriacao = Format.date(lote.criadoEm);
        const qtd = lote.entregaIds?.length ?? 0;
        const saiu = lote.saiuEm != null;
        const li = document.createElement("li");
        li.className = "flex justify-between items-center mt-1";
        li.style.padding = "0.75rem 0";
        li.style.borderBottom = "1px solid var(--border)";
        li.innerHTML = `
          <div>
            <strong>Lote</strong><br>
            <small class="text-muted">${dataCriacao} &middot; ${qtd} entrega(s)</small>
          </div>
          <div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;">
            <span class="status-badge ${saiu ? "status-saiu_loja" : "status-pendente"}">
              ${saiu ? "Saiu da loja" : "Pendente"}
            </span>
            <a href="lote.html?id=${encodeURIComponent(lote.id)}" class="btn btn-secondary btn-sm">Abrir</a>
          </div>
        `;
        listaEl.appendChild(li);
      });
    } catch (err) {
      handleError(err, "Carregar lotes", "Erro ao carregar lotes.");
      listaEl.innerHTML = `<li class="text-muted">Erro ao carregar.</li>`;
    }
  }

  await carregarLotes();
});
