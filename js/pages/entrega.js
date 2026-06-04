import { AuthService } from "../services/AuthService.js";
import { EntregaService } from "../services/EntregaService.js";
import { Dom } from "../utils/dom.js";
import { Format } from "../utils/format.js";
import { handleError } from "../utils/errorHandler.js";

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

  const entregaId = new URLSearchParams(window.location.search).get("id");
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

  function renderizar(entrega) {
    entregaAtual = entrega;
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

    if (entrega.status === "pendente") {
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