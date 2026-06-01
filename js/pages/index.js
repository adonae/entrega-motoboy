import { EntregaService } from "../services/EntregaService.js";
import { ViaCepService } from "../services/ViaCepService.js";
import { Dom } from "../utils/dom.js";
import { Format } from "../utils/format.js";

function getEl(id) {
  const el = document.getElementById(id);
  if (!el) console.warn(`Elemento #${id} nao encontrado no DOM`);
  return el;
}

document.addEventListener("DOMContentLoaded", () => {
  const form = getEl("form-nova-entrega");
  if (!form) return;
  const btnCriar = getEl("btn-criar");
  const btnCancelar = getEl("btn-cancelar");
  const btnBuscarCep = getEl("btn-buscar-cep");
  const listaEntregas = getEl("lista-entregas");
  const tituloForm = document.querySelector("#form-nova-entrega")?.closest(".card")?.querySelector("h2") ?? null;
  const inputCep = getEl("cliente-cep");
  const cepStatus = getEl("cep-status");
  const entregaParaEditar = new URLSearchParams(window.location.search).get("editar");
  const camposEndereco = {
    rua: getEl("cliente-endereco"),
    numero: getEl("cliente-numero"),
    bairro: getEl("cliente-bairro"),
    cidade: getEl("cliente-cidade"),
    uf: getEl("cliente-uf"),
    complemento: getEl("cliente-complemento"),
  };
  let ultimoCepConsultado = "";
  let entregaEmEdicao = null;
  let entregasCarregadas = [];
  let edicaoInicialCarregada = false;
  let cepController = null;

  document.getElementById("cliente-telefone").addEventListener("input", (e) => {
    e.target.value = Format.phone(e.target.value);
  });

  inputCep.addEventListener("input", (e) => {
    e.target.value = Format.cep(e.target.value);
    cepStatus.textContent = "";
    cepStatus.className = "field-hint";

    const cepLimpo = ViaCepService.normalizarCep(e.target.value);
    if (cepLimpo.length === 8 && cepLimpo !== ultimoCepConsultado) {
      consultarCep(cepLimpo);
    }
  });

  inputCep.addEventListener("blur", () => {
    const cepLimpo = ViaCepService.normalizarCep(inputCep.value);
    if (cepLimpo.length === 8 && cepLimpo !== ultimoCepConsultado) {
      consultarCep(cepLimpo);
    }
  });

  btnBuscarCep.addEventListener("click", () => {
    const cepLimpo = ViaCepService.normalizarCep(inputCep.value);
    consultarCep(cepLimpo);
  });

  btnCancelar.addEventListener("click", () => {
    limparFormulario();
    Dom.showToast("Formulario limpo", "info");
  });

  listaEntregas.addEventListener("click", async (e) => {
    const btnEditar = e.target.closest("[data-editar-id]");
    const btnExcluir = e.target.closest("[data-excluir-id]");

    if (btnEditar) {
      const entrega = entregasCarregadas.find((item) => item.id === btnEditar.dataset.editarId);
      if (entrega) preencherFormularioParaEdicao(entrega);
      return;
    }

    if (btnExcluir) {
      await excluirEntrega(btnExcluir.dataset.excluirId, btnExcluir);
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const editando = Boolean(entregaEmEdicao);
    Dom.setLoading(btnCriar, true, editando ? "Atualizando..." : "Salvando...");
    try {
      const dadosEntrega = {
        nome: document.getElementById("cliente-nome").value.trim(),
        telefone: document.getElementById("cliente-telefone").value.trim(),
        endereco: montarEndereco(),
        observacoes: document.getElementById("cliente-obs").value.trim(),
        enderecoDetalhes: obterEnderecoDetalhes(),
      };

      if (editando) {
        await EntregaService.editar(entregaEmEdicao, dadosEntrega);
        Dom.showToast("Entrega atualizada com sucesso!", "success");
      } else {
        await EntregaService.criar(dadosEntrega);
        Dom.showToast("Entrega criada com sucesso!", "success");
      }

      limparFormulario();
      carregarEntregas();
    } catch (err) {
      console.error(err);
      Dom.showToast(err.message || "Erro ao salvar.", "error");
    } finally {
      Dom.setLoading(btnCriar, false);
    }
  });

  function limparFormulario() {
    form.reset();
    entregaEmEdicao = null;
    ultimoCepConsultado = "";
    tituloForm.textContent = "Nova entrega";
    btnCriar.textContent = "Criar entrega";
    btnCancelar.textContent = "Limpar";
    cepStatus.textContent = "";
    cepStatus.className = "field-hint";
    if (window.location.search.includes("editar=")) {
      window.history.replaceState({}, "", "index.html");
    }
  }

  function preencherFormularioParaEdicao(entrega) {
    const detalhes = entrega.enderecoDetalhes ?? {};
    entregaEmEdicao = entrega.id;
    edicaoInicialCarregada = true;

    document.getElementById("cliente-nome").value = entrega.nome ?? "";
    document.getElementById("cliente-telefone").value = Format.phone(entrega.telefone ?? "");
    inputCep.value = detalhes.cep ?? "";
    camposEndereco.rua.value = detalhes.rua ?? entrega.endereco ?? "";
    camposEndereco.numero.value = detalhes.numero ?? "";
    camposEndereco.bairro.value = detalhes.bairro ?? "";
    camposEndereco.cidade.value = detalhes.cidade ?? "";
    camposEndereco.uf.value = detalhes.uf ?? "";
    camposEndereco.complemento.value = detalhes.complemento ?? "";
    document.getElementById("cliente-obs").value = entrega.observacoes ?? "";

    tituloForm.textContent = "Editar entrega";
    btnCriar.textContent = "Salvar alteracoes";
    btnCancelar.textContent = "Cancelar edicao";
    cepStatus.textContent = "Revise os dados antes de salvar.";
    cepStatus.className = "field-hint";
    window.history.replaceState({}, "", `index.html?editar=${encodeURIComponent(entrega.id)}`);
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function excluirEntrega(id, button) {
    const entrega = entregasCarregadas.find((item) => item.id === id);
    const nome = entrega?.nome ? ` de ${entrega.nome}` : "";

    if (!window.confirm(`Excluir a entrega${nome}? Essa acao nao pode ser desfeita.`)) {
      return;
    }

    Dom.setLoading(button, true, "Excluindo...");
    try {
      await EntregaService.excluir(id);
      if (entregaEmEdicao === id) limparFormulario();
      Dom.showToast("Entrega excluida.", "success");
      carregarEntregas();
    } catch (err) {
      console.error(err);
      Dom.showToast(err.message || "Erro ao excluir.", "error");
    } finally {
      Dom.setLoading(button, false);
    }
  }

  async function consultarCep(cep) {
    if (cepController) cepController.abort();
    cepController = new AbortController();

    ultimoCepConsultado = cep;
    cepStatus.textContent = "Buscando endereco...";
    cepStatus.className = "field-hint";
    inputCep.disabled = true;
    Dom.setLoading(btnBuscarCep, true, "...");

    try {
      const endereco = await ViaCepService.buscar(cep, cepController.signal);
      inputCep.value = endereco.cep;
      camposEndereco.rua.value = endereco.logradouro;
      camposEndereco.bairro.value = endereco.bairro;
      camposEndereco.cidade.value = endereco.cidade;
      camposEndereco.uf.value = endereco.uf;
      cepStatus.textContent = "Endereco preenchido. Confira numero e complemento.";
      cepStatus.className = "field-hint success";
      camposEndereco.numero.focus();
    } catch (err) {
      ultimoCepConsultado = "";
      cepStatus.textContent = err.message || "Erro ao buscar CEP.";
      cepStatus.className = "field-hint error";
      Dom.showToast(cepStatus.textContent, "error");
    } finally {
      inputCep.disabled = false;
      Dom.setLoading(btnBuscarCep, false);
    }
  }

  function obterEnderecoDetalhes() {
    return {
      cep: inputCep.value.trim(),
      rua: camposEndereco.rua.value.trim(),
      numero: camposEndereco.numero.value.trim(),
      bairro: camposEndereco.bairro.value.trim(),
      cidade: camposEndereco.cidade.value.trim(),
      uf: camposEndereco.uf.value.trim().toUpperCase(),
      complemento: camposEndereco.complemento.value.trim(),
    };
  }

  function montarEndereco() {
    const detalhes = obterEnderecoDetalhes();
    const complemento = detalhes.complemento ? `, ${detalhes.complemento}` : "";

    return [
      `${detalhes.rua}, ${detalhes.numero}${complemento}`,
      detalhes.bairro,
      `${detalhes.cidade} - ${detalhes.uf}`,
      `CEP ${detalhes.cep}`,
    ]
      .filter(Boolean)
      .join(" - ");
  }

  async function carregarEntregas() {
    listaEntregas.innerHTML = `<li class="loading">Carregando...</li>`;
    try {
      const entregas = await EntregaService.listarTodas();
      entregasCarregadas = entregas;

      if (!entregas.length) {
        listaEntregas.innerHTML = `<li class="text-muted">Nenhuma entrega registrada.</li>`;
        atualizarContadores([]);
        return;
      }

      if (entregaParaEditar && !edicaoInicialCarregada) {
        const entrega = entregas.find((item) => item.id === entregaParaEditar);
        if (entrega) {
          preencherFormularioParaEdicao(entrega);
        } else {
          Dom.showToast("Entrega para edicao nao encontrada.", "error");
          edicaoInicialCarregada = true;
        }
      }

      listaEntregas.innerHTML = "";
      entregas.forEach((entrega) => {
        const nome = Dom.escapeHtml(entrega.nome);
        const endereco = Dom.escapeHtml(entrega.endereco);
        const statusLabel = Dom.escapeHtml(Format.statusLabel(entrega.status));
        const statusClass = Format.statusClass(entrega.status);
        const id = encodeURIComponent(entrega.id);
        const li = document.createElement("li");
        li.className = "flex justify-between items-center mt-1";
        li.innerHTML = `
          <div>
            <strong>${nome}</strong> - <span class="text-muted">${endereco}</span><br>
            <span class="status-badge ${statusClass}">${statusLabel}</span>
          </div>
          <div class="delivery-actions">
            <button type="button" class="btn btn-secondary btn-sm" data-editar-id="${id}">Editar</button>
            <button type="button" class="btn btn-danger btn-sm" data-excluir-id="${id}">Excluir</button>
            <a href="entrega.html?id=${id}" class="btn btn-secondary btn-sm">Abrir</a>
          </div>
        `;
        listaEntregas.appendChild(li);
      });

      atualizarContadores(entregas);
    } catch (err) {
      console.error(err);
      listaEntregas.innerHTML = `<li class="text-muted">Erro ao carregar.</li>`;
    }
  }

  function atualizarContadores(entregas) {
    const contagem = EntregaService.contarPorStatus(entregas);
    document.getElementById("stat-total").textContent = contagem.total;
    document.getElementById("stat-pending").textContent = contagem.pendente;
    document.getElementById("stat-route").textContent = contagem.em_rota;
    document.getElementById("stat-delivered").textContent = contagem.entregue;
  }

  carregarEntregas();
});
