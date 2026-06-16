import { AuthService } from "../services/AuthService.js";
import { EntregaService } from "../services/EntregaService.js";
import { Dom } from "../utils/dom.js";
import { Format } from "../utils/format.js";
import { handleError } from "../utils/errorHandler.js";

const params = new URLSearchParams(window.location.search);
const entregaId = params.get("id");
const modoMotoboy = params.has("modo");

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await AuthService.init();
  } catch (err) {
    handleError(err, "Autenticacao");
    Dom.showError(
      document.getElementById("card-entrega"),
      "Erro de autenticacao. Verifique se o login anonimo esta habilitado no Firebase Console.",
    );
    return;
  }

  const cardEntrega = document.getElementById("card-entrega");
  const cardConfirmacao = document.getElementById("card-confirmacao");
  const detalhesEl = document.getElementById("detalhes-entrega");
  const btnConfirmar = document.getElementById("btn-confirmar");
  const btnSair = document.getElementById("btn-sair-entrega");
  const btnEditar = document.getElementById("btn-editar-entrega");
  const btnExcluir = document.getElementById("btn-excluir-entrega");
  const formConfirmar = document.getElementById("form-confirmar");

  if (!entregaId) {
    Dom.showError(cardEntrega, "ID nao informado.");
    return;
  }

  let entregaAtual = null;

  btnEditar.href = `index.html?editar=${encodeURIComponent(entregaId)}`;

  if (modoMotoboy) {
    btnEditar.classList.add("hidden");
    btnExcluir.classList.add("hidden");
    document.getElementById("nav-entrega")?.classList.add("hidden");
    document.getElementById("btn-voltar-entrega")?.classList.remove("hidden");
  }

  function renderizar(entrega) {
    entregaAtual = entrega;
    cardEntrega.classList.add("hidden");
    cardConfirmacao.classList.remove("hidden");
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(entrega.endereco || "")}`;
    detalhesEl.innerHTML = `
      <p><strong>Cliente:</strong> ${Dom.escapeHtml(entrega.nome)}</p>
      <p><strong>Endereco:</strong> ${Dom.escapeHtml(entrega.endereco)}
        <a href="${mapsUrl}" target="_blank" class="btn btn-primary btn-sm" style="margin-left:0.5rem;">Ver no Maps</a>
      </p>
      <p><strong>Telefone:</strong> ${Dom.escapeHtml(Format.phone(entrega.telefone))}</p>
      <p><strong>Status:</strong>
        <span class="status-badge ${Format.statusClass(entrega.status)}">${Dom.escapeHtml(Format.statusLabel(entrega.status))}</span>
      </p>
    `;

    if (entrega.status === "pendente" && !modoMotoboy) {
      btnSair.classList.remove("hidden");
    } else {
      btnSair.classList.add("hidden");
    }
  }

  btnExcluir.addEventListener("click", async () => {
    if (!window.confirm("Excluir esta entrega? Essa acao nao pode ser desfeita.")) {
      return;
    }

    Dom.setLoading(btnExcluir, true, "Excluindo...");
    try {
      await EntregaService.excluir(entregaId);
      Dom.showToast("Entrega excluida.", "success");
      setTimeout(() => (window.location.href = "index.html"), 800);
    } catch (err) {
      handleError(err, "Excluir entrega", "Erro ao excluir.");
    } finally {
      Dom.setLoading(btnExcluir, false);
    }
  });

  btnSair.addEventListener("click", async () => {
    Dom.setLoading(btnSair, true, "Atualizando...");
    try {
      await EntregaService.sairParaEntrega(entregaId);
      Dom.showToast("Status atualizado para Em Rota!", "success");
      renderizar({ ...entregaAtual, status: "em_rota" });
    } catch (err) {
      handleError(err, "Sair para entrega", "Erro ao atualizar status.");
    } finally {
      Dom.setLoading(btnSair, false);
    }
  });

  formConfirmar.addEventListener("submit", async (e) => {
    e.preventDefault();
    Dom.setLoading(btnConfirmar, true, "Confirmando...");
    try {
      await EntregaService.confirmarEntrega(entregaId, {
        observacoesEntrega: document.getElementById("obs-entrega").value.trim(),
      });
      Dom.showToast("Entrega confirmada!", "success");
      setTimeout(() => (window.location.href = "index.html"), 1500);
    } catch (err) {
      handleError(err, "Confirmar entrega", "Erro ao confirmar.");
    } finally {
      Dom.setLoading(btnConfirmar, false);
    }
  });

  try {
    const entrega = await EntregaService.buscarPorId(entregaId);
    renderizar(entrega);
  } catch (err) {
    handleError(err, "Carregar entrega");
    Dom.showError(cardEntrega, err.message || "Falha ao carregar.");
  }
});