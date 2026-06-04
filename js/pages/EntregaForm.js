import { EntregaService } from "../services/EntregaService.js";
import { Dom } from "../utils/dom.js";
import { Format } from "../utils/format.js";
import { handleError } from "../utils/errorHandler.js";

export function initEntregaForm(state) {
  let onSalvar = null;

  function limparFormulario() {
    state.form.reset();
    state.entregaEmEdicao = null;
    state.ultimoCepConsultado = "";
    state.tituloForm.textContent = "Nova entrega";
    state.btnCriar.textContent = "Criar entrega";
    state.btnCancelar.textContent = "Limpar";
    state.cepStatus.textContent = "";
    state.cepStatus.className = "field-hint";
    if (window.location.search.includes("editar=")) {
      window.history.replaceState({}, "", "index.html");
    }
  }

  function preencherFormularioParaEdicao(entrega) {
    const detalhes = entrega.enderecoDetalhes ?? {};
    state.entregaEmEdicao = entrega.id;
    state.edicaoInicialCarregada = true;

    document.getElementById("cliente-nome").value = entrega.nome ?? "";
    document.getElementById("cliente-telefone").value = Format.phone(entrega.telefone ?? "");
    state.inputCep.value = detalhes.cep ?? "";
    state.camposEndereco.rua.value = detalhes.rua ?? entrega.endereco ?? "";
    state.camposEndereco.numero.value = detalhes.numero ?? "";
    state.camposEndereco.bairro.value = detalhes.bairro ?? "";
    state.camposEndereco.cidade.value = detalhes.cidade ?? "";
    state.camposEndereco.uf.value = detalhes.uf ?? "";
    state.camposEndereco.complemento.value = detalhes.complemento ?? "";
    document.getElementById("cliente-obs").value = entrega.observacoes ?? "";

    state.tituloForm.textContent = "Editar entrega";
    state.btnCriar.textContent = "Salvar alteracoes";
    state.btnCancelar.textContent = "Cancelar edicao";
    state.cepStatus.textContent = "Revise os dados antes de salvar.";
    state.cepStatus.className = "field-hint";
    window.history.replaceState({}, "", `index.html?editar=${encodeURIComponent(entrega.id)}`);
    state.form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function obterEnderecoDetalhes() {
    return {
      cep: state.inputCep.value.trim(),
      rua: state.camposEndereco.rua.value.trim(),
      numero: state.camposEndereco.numero.value.trim(),
      bairro: state.camposEndereco.bairro.value.trim(),
      cidade: state.camposEndereco.cidade.value.trim(),
      uf: state.camposEndereco.uf.value.trim().toUpperCase(),
      complemento: state.camposEndereco.complemento.value.trim(),
    };
  }

  document.getElementById("cliente-telefone").addEventListener("input", (e) => {
    e.target.value = Format.phone(e.target.value);
  });

  state.btnCancelar.addEventListener("click", () => {
    limparFormulario();
    Dom.showToast("Formulario limpo", "info");
  });

  state.form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const editando = Boolean(state.entregaEmEdicao);
    Dom.setLoading(state.btnCriar, true, editando ? "Atualizando..." : "Salvando...");
    try {
      const dadosEntrega = {
        nome: document.getElementById("cliente-nome").value.trim(),
        telefone: document.getElementById("cliente-telefone").value.trim(),
        observacoes: document.getElementById("cliente-obs").value.trim(),
        enderecoDetalhes: obterEnderecoDetalhes(),
      };

      if (editando) {
        await EntregaService.editar(state.entregaEmEdicao, dadosEntrega);
        Dom.showToast("Entrega atualizada com sucesso!", "success");
      } else {
        const docRef = await EntregaService.criar(dadosEntrega);
        const linkRastreio = `${window.location.origin}/rastrear.html?id=${docRef.id}`;
        Dom.showLinkCriado(linkRastreio);
      }

      limparFormulario();
      if (onSalvar) onSalvar();
    } catch (err) {
      handleError(err, "Salvar entrega", "Erro ao salvar.");
    } finally {
      Dom.setLoading(state.btnCriar, false);
    }
  });

  return {
    limparFormulario,
    preencherFormularioParaEdicao,
    setOnSalvar(fn) { onSalvar = fn; },
  };
}
