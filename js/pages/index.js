import { EntregaService } from "../services/EntregaService.js";
import { ViaCepService } from "../services/ViaCepService.js";
import { Dom } from "../utils/dom.js";
import { Format } from "../utils/format.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-nova-entrega");
  const btnCriar = document.getElementById("btn-criar");
  const btnCancelar = document.getElementById("btn-cancelar");
  const listaEntregas = document.getElementById("lista-entregas");
  const inputCep = document.getElementById("cliente-cep");
  const cepStatus = document.getElementById("cep-status");
  const camposEndereco = {
    rua: document.getElementById("cliente-endereco"),
    numero: document.getElementById("cliente-numero"),
    bairro: document.getElementById("cliente-bairro"),
    cidade: document.getElementById("cliente-cidade"),
    uf: document.getElementById("cliente-uf"),
    complemento: document.getElementById("cliente-complemento"),
  };
  let ultimoCepConsultado = "";

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

  btnCancelar.addEventListener("click", () => {
    form.reset();
    ultimoCepConsultado = "";
    cepStatus.textContent = "";
    cepStatus.className = "field-hint";
    Dom.showToast("Formulario limpo", "info");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    Dom.setLoading(btnCriar, true, "Salvando...");
    try {
      await EntregaService.criar({
        nome: document.getElementById("cliente-nome").value.trim(),
        telefone: document.getElementById("cliente-telefone").value.trim(),
        endereco: montarEndereco(),
        observacoes: document.getElementById("cliente-obs").value.trim(),
        enderecoDetalhes: obterEnderecoDetalhes(),
      });
      Dom.showToast("Entrega criada com sucesso!", "success");
      form.reset();
      ultimoCepConsultado = "";
      cepStatus.textContent = "";
      cepStatus.className = "field-hint";
      carregarEntregas();
    } catch (err) {
      console.error(err);
      Dom.showToast(err.message || "Erro ao salvar.", "error");
    } finally {
      Dom.setLoading(btnCriar, false);
    }
  });

  async function consultarCep(cep) {
    ultimoCepConsultado = cep;
    cepStatus.textContent = "Buscando endereco...";
    cepStatus.className = "field-hint";
    inputCep.disabled = true;

    try {
      const endereco = await ViaCepService.buscar(cep);
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
    } finally {
      inputCep.disabled = false;
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

      if (!entregas.length) {
        listaEntregas.innerHTML = `<li class="text-muted">Nenhuma entrega registrada.</li>`;
        atualizarContadores([]);
        return;
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
          <a href="entrega.html?id=${id}" class="btn btn-secondary" style="padding:0.5rem 1rem;">Abrir</a>
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
