import { ViaCepService } from "../services/ViaCepService.js";
import { Dom } from "../utils/dom.js";
import { Format } from "../utils/format.js";

export function initCepController(state) {
  let cepController = null;
  let cepTimeout = null;

  async function consultarCep(cep) {
    if (cepController) cepController.abort();
    cepController = new AbortController();

    state.ultimoCepConsultado = cep;
    state.cepStatus.textContent = "Buscando endereco...";
    state.cepStatus.className = "field-hint";
    state.inputCep.disabled = true;
    Dom.setLoading(state.btnBuscarCep, true, "...");

    try {
      const endereco = await ViaCepService.buscar(cep, cepController.signal);
      state.inputCep.value = endereco.cep;
      state.camposEndereco.rua.value = endereco.logradouro;
      state.camposEndereco.bairro.value = endereco.bairro;
      state.camposEndereco.cidade.value = endereco.cidade;
      state.camposEndereco.uf.value = endereco.uf;
      state.cepStatus.textContent = "Endereco preenchido. Confira numero e complemento.";
      state.cepStatus.className = "field-hint success";
      state.camposEndereco.numero.focus();
    } catch (err) {
      state.ultimoCepConsultado = "";
      state.cepStatus.textContent = err.message || "Erro ao buscar CEP.";
      state.cepStatus.className = "field-hint error";
      Dom.showToast(state.cepStatus.textContent, "error");
    } finally {
      state.inputCep.disabled = false;
      Dom.setLoading(state.btnBuscarCep, false);
    }
  }

  state.inputCep.addEventListener("input", (e) => {
    e.target.value = Format.cep(e.target.value);
    state.cepStatus.textContent = "";
    state.cepStatus.className = "field-hint";
    const cepLimpo = ViaCepService.normalizarCep(e.target.value);
    if (cepLimpo.length === 8) {
      clearTimeout(cepTimeout);
      cepTimeout = setTimeout(() => {
        if (cepLimpo !== state.ultimoCepConsultado) {
          consultarCep(cepLimpo);
        }
      }, 300);
    } else {
      clearTimeout(cepTimeout);
    }
  });

  state.inputCep.addEventListener("blur", () => {
    const cepLimpo = ViaCepService.normalizarCep(state.inputCep.value);
    if (cepLimpo.length === 8 && cepLimpo !== state.ultimoCepConsultado) {
      consultarCep(cepLimpo);
    }
  });

  state.btnBuscarCep.addEventListener("click", () => {
    const cepLimpo = ViaCepService.normalizarCep(state.inputCep.value);
    consultarCep(cepLimpo);
  });
}
