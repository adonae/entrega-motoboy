import { AuthService } from "../services/AuthService.js";
import { initCepController } from "./CepController.js";
import { initEntregaForm } from "./EntregaForm.js";
import { initEntregaList } from "./EntregaList.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await AuthService.init();
  } catch (err) {
    console.error(err);
    document.getElementById("lista-entregas").innerHTML =
      `<li class="text-muted">Erro de autenticacao. Verifique se o login anonimo esta habilitado no Firebase Console.</li>`;
    return;
  }

  const $ = (id) => document.getElementById(id);

  const state = {
    form: $("form-nova-entrega"),
    btnCriar: $("btn-criar"),
    btnCancelar: $("btn-cancelar"),
    btnBuscarCep: $("btn-buscar-cep"),
    listaEntregas: $("lista-entregas"),
    tituloForm:
      document.querySelector("#form-nova-entrega")?.closest(".card")?.querySelector("h2") ?? null,
    inputCep: $("cliente-cep"),
    cepStatus: $("cep-status"),
    camposEndereco: {
      rua: $("cliente-endereco"),
      numero: $("cliente-numero"),
      bairro: $("cliente-bairro"),
      cidade: $("cliente-cidade"),
      uf: $("cliente-uf"),
      complemento: $("cliente-complemento"),
    },
    entregaParaEditar: new URLSearchParams(window.location.search).get("editar"),
    ultimoCepConsultado: "",
    entregaEmEdicao: null,
    entregasCarregadas: [],
    edicaoInicialCarregada: false,
  };

  if (!state.form) return;

  const form = initEntregaForm(state);
  const list = initEntregaList(state);

  form.setOnSalvar(list.carregarEntregas);
  list.setOnEditar(form.preencherFormularioParaEdicao);
  list.setOnLimpar(form.limparFormulario);

  initCepController(state);

  list.carregarEntregas();
});
