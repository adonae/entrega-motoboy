import { AuthService } from "../services/AuthService.js";
import { LoteService } from "../services/LoteService.js";
import { EntregaService } from "../services/EntregaService.js";
import { Dom } from "../utils/dom.js";
import { Format } from "../utils/format.js";
import { handleError } from "../utils/errorHandler.js";
import { STATUS, MENSAGENS } from "../utils/constants.js";

const params = new URLSearchParams(window.location.search);
const loteId = params.get("id");
const modoMotoboy = params.has("modo");

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await AuthService.init();
  } catch (err) {
    handleError(err, "Autenticacao");
    document.getElementById("card-lote").innerHTML =
      `<p class="text-muted">Erro de autenticacao. Verifique o Firebase Console.</p>`;
    return;
  }

  if (modoMotoboy) {
    document.querySelector("nav")?.classList.add("hidden");
    const btnCopiarLink = document.getElementById("btn-copiar-link-motoboy");
    if (btnCopiarLink) btnCopiarLink.classList.add("hidden");
  }

  const loteInfo = document.getElementById("lote-info");
  const listaEl = document.getElementById("lista-entregas-lote");
  const btnSairLoja = document.getElementById("btn-sair-loja");
  const statusLote = document.getElementById("status-lote");
  const btnCopiarLink = document.getElementById("btn-copiar-link-motoboy");

  if (!loteId) {
    Dom.showError(document.getElementById("card-lote"), "ID do lote nao informado.");
    return;
  }

  let loteAtual = null;

  async function renderizar() {
    try {
      loteAtual = await LoteService.buscarPorId(loteId);
    } catch (err) {
      handleError(err, "Carregar lote");
      Dom.showError(document.getElementById("card-lote"), MENSAGENS.LOTE_NAO_ENCONTRADO);
      return;
    }

    const qtd = loteAtual.entregaIds?.length ?? 0;
    const saiu = loteAtual.saiuEm;
    loteInfo.textContent = `${qtd} entrega(s) no lote`;

    if (saiu) {
      statusLote.textContent = `Saiu da loja em ${Format.date(saiu)}`;
      btnSairLoja.classList.add("hidden");
    } else {
      statusLote.textContent = "Aguardando saida da loja";
      btnSairLoja.classList.remove("hidden");
    }

    if (!modoMotoboy && !saiu) {
      btnCopiarLink.classList.remove("hidden");
    } else {
      btnCopiarLink.classList.add("hidden");
    }

    try {
      const entregas = await LoteService.carregarEntregasDoLote(loteAtual);
      if (!entregas.length) {
        listaEl.innerHTML = `<li class="text-muted">Nenhuma entrega encontrada no lote.</li>`;
        return;
      }

      listaEl.innerHTML = "";
      entregas.forEach((entrega) => {
        const nome = Dom.escapeHtml(entrega.nome);
        const endereco = Dom.escapeHtml(entrega.endereco);
        const statusLabel = Dom.escapeHtml(Format.statusLabel(entrega.status));
        const statusClass = Format.statusClass(entrega.status);
        const id = encodeURIComponent(entrega.id);
        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(entrega.endereco || "")}`;
        const rotaUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(entrega.endereco || "")}&travelmode=driving`;
        const li = document.createElement("li");
        li.className = "flex justify-between items-center mt-1";
        li.innerHTML = `
          <div>
            <strong>${nome}</strong><br>
            <small class="text-muted">${endereco}</small><br>
            <span class="status-badge ${statusClass}">${statusLabel}</span>
          </div>
          <div class="delivery-actions">
            <a href="${rotaUrl}" target="_blank" class="btn btn-primary btn-sm" title="Traçar rota no Maps">Rota</a>
            ${entrega.status === STATUS.SAIU_LOJA
              ? `<button type="button" class="btn btn-primary btn-sm" data-em-rota-id="${id}">Em Rota</button>`
              : ""}
            ${entrega.status === STATUS.EM_ROTA
              ? `<button type="button" class="btn btn-success btn-sm" data-entregue-id="${id}">Entregue</button>`
              : ""}
            <a href="entrega.html?id=${id}${modoMotoboy ? "&modo=motoboy" : ""}" class="btn btn-secondary btn-sm">Detalhes</a>
          </div>
        `;
        listaEl.appendChild(li);
      });
    } catch (err) {
      handleError(err, "Carregar entregas");
    }
  }

  btnCopiarLink.addEventListener("click", () => {
    const link = `${window.location.origin}/lote.html?id=${loteId}&modo=motoboy`;
    navigator.clipboard.writeText(link).then(() => {
      Dom.showToast("Link do motoboy copiado!", "success");
    });
  });

  btnSairLoja.addEventListener("click", async () => {
    if (!window.confirm("Marcar lote como saido da loja?")) return;

    Dom.setLoading(btnSairLoja, true, "Atualizando...");
    try {
      await LoteService.sairLoja(loteId);
      Dom.showToast("Lote marcado como saido da loja!", "success");
      await renderizar();
    } catch (err) {
      handleError(err, "Sair da loja", MENSAGENS.ERRO_SALVAR);
    } finally {
      Dom.setLoading(btnSairLoja, false);
    }
  });

  listaEl.addEventListener("click", async (e) => {
    const btnEmRota = e.target.closest("[data-em-rota-id]");
    const btnEntregue = e.target.closest("[data-entregue-id]");

    if (btnEmRota) {
      const id = btnEmRota.dataset.emRotaId;
      Dom.setLoading(btnEmRota, true, "Atualizando...");
      try {
        await EntregaService.atualizarStatus(id, STATUS.EM_ROTA);
        Dom.showToast("Entrega marcada como Em Rota!", "success");
        await renderizar();
      } catch (err) {
        handleError(err, "Em rota", "Erro ao atualizar.");
      } finally {
        Dom.setLoading(btnEmRota, false);
      }
      return;
    }

    if (btnEntregue) {
      const id = btnEntregue.dataset.entregueId;
      if (!window.confirm("Confirmar entrega?")) return;
      Dom.setLoading(btnEntregue, true, "Confirmando...");
      try {
        await EntregaService.atualizarStatus(id, STATUS.ENTREGUE);
        Dom.showToast("Entrega confirmada!", "success");
        await renderizar();
      } catch (err) {
        handleError(err, "Confirmar entrega", "Erro ao confirmar.");
      } finally {
        Dom.setLoading(btnEntregue, false);
      }
    }
  });

  await renderizar();
});
