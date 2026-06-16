import { EntregaService } from "../services/EntregaService.js";
import { Dom } from "../utils/dom.js";
import { handleError } from "../utils/errorHandler.js";
import { MENSAGENS } from "../utils/constants.js";

export function initEntregaList(state) {
  let onEditar = null;
  let onLimpar = null;

  function atualizarContadores(entregas) {
    document.getElementById("stat-disponiveis").textContent = entregas.length;
  }

  async function sairParaEntrega(id, button) {
    const entrega = state.entregasCarregadas.find((item) => item.id === id);
    const nome = entrega?.nome ? ` de ${entrega.nome}` : "";

    if (!window.confirm(`Sair para entrega${nome}?`)) {
      return;
    }

    Dom.setLoading(button, true, "Atualizando...");
    try {
      await EntregaService.sairParaEntrega(id);
      Dom.showToast("Status atualizado para Em Rota!", "success");
      carregarEntregas();
    } catch (err) {
      handleError(err, "Sair para entrega", "Erro ao atualizar.");
    } finally {
      Dom.setLoading(button, false);
    }
  }

  async function excluirEntrega(id, button) {
    const entrega = state.entregasCarregadas.find((item) => item.id === id);
    const nome = entrega?.nome ? ` de ${entrega.nome}` : "";

    if (!window.confirm(`Excluir a entrega${nome}? Essa acao nao pode ser desfeita.`)) {
      return;
    }

    Dom.setLoading(button, true, "Excluindo...");
    try {
      await EntregaService.excluir(id);
      if (state.entregaEmEdicao === id && onLimpar) onLimpar();
      Dom.showToast("Entrega excluida.", "success");
      carregarEntregas();
    } catch (err) {
      handleError(err, "Excluir entrega", "Erro ao excluir.");
    } finally {
      Dom.setLoading(button, false);
    }
  }

  function isDisponivel(entrega) {
    return entrega.status === "pendente" && !entrega.loteId;
  }

  async function carregarEntregas() {
    state.listaEntregas.innerHTML = `<li class="loading">Carregando...</li>`;
    try {
      const entregas = await EntregaService.listarTodas();
      state.entregasCarregadas = entregas;
      const disponiveis = entregas.filter(isDisponivel);

      if (!disponiveis.length && !state.entregaParaEditar) {
        state.listaEntregas.innerHTML = `<li class="text-muted">Nenhuma entrega disponivel para lote.</li>`;
        atualizarContadores([]);
        if (state.store) state.store.set("hasPendentesSemLote", false);
        return;
      }

      if (state.entregaParaEditar && !state.edicaoInicialCarregada) {
        const entrega = entregas.find((item) => item.id === state.entregaParaEditar);
        if (entrega) {
          if (onEditar) onEditar(entrega);
        } else {
          Dom.showToast("Entrega para edicao nao encontrada.", "error");
          state.edicaoInicialCarregada = true;
        }
      }

      state.listaEntregas.innerHTML = "";

      if (state.store) state.store.set("hasPendentesSemLote", disponiveis.length > 0);

      disponiveis.forEach((entrega) => {
        const nome = Dom.escapeHtml(entrega.nome);
        const endereco = Dom.escapeHtml(entrega.endereco);
        const id = encodeURIComponent(entrega.id);
        const li = document.createElement("li");
        li.className = "flex justify-between items-center mt-1";
        li.innerHTML = `
          <div>
            <strong>${nome}</strong> - <span class="text-muted">${endereco}</span><br>
            <span class="status-badge status-pendente">Pendente</span>
          </div>
          <div class="delivery-actions">
            <button type="button" class="btn btn-primary btn-sm" data-sair-id="${id}">Sair p/ entrega</button>
            <button type="button" class="btn btn-secondary btn-sm" data-editar-id="${id}">Editar</button>
            <button type="button" class="btn btn-danger btn-sm" data-excluir-id="${id}">Excluir</button>
            <a href="entrega.html?id=${id}" class="btn btn-secondary btn-sm">Abrir</a>
            <a href="rastrear.html?id=${id}" target="_blank" class="btn btn-secondary btn-sm">Link</a>
          </div>
        `;
        state.listaEntregas.appendChild(li);
      });

      atualizarContadores(disponiveis);
    } catch (err) {
      handleError(err, "Carregar entregas", "Erro ao carregar.");
      state.listaEntregas.innerHTML = `<li class="text-muted">Erro ao carregar.</li>`;
    }
  }

  state.listaEntregas.addEventListener("click", async (e) => {
    const btnSair = e.target.closest("[data-sair-id]");
    const btnEditar = e.target.closest("[data-editar-id]");
    const btnExcluir = e.target.closest("[data-excluir-id]");

    if (btnSair) {
      await sairParaEntrega(btnSair.dataset.sairId, btnSair);
      return;
    }

    if (btnEditar) {
      const entrega = state.entregasCarregadas.find((item) => item.id === btnEditar.dataset.editarId);
      if (entrega && onEditar) onEditar(entrega);
      return;
    }

    if (btnExcluir) {
      await excluirEntrega(btnExcluir.dataset.excluirId, btnExcluir);
    }
  });

  return {
    carregarEntregas,
    setOnEditar(fn) { onEditar = fn; },
    setOnLimpar(fn) { onLimpar = fn; },
  };
}
