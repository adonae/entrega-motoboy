import { AuthService } from "../services/AuthService.js";
import { LoteService } from "../services/LoteService.js";
import { initCepController } from "./CepController.js";
import { initEntregaForm } from "./EntregaForm.js";
import { initEntregaList } from "./EntregaList.js";
import { Dom } from "../utils/dom.js";
import { handleError } from "../utils/errorHandler.js";
import { MENSAGENS } from "../utils/constants.js";

document.addEventListener("DOMContentLoaded", async () => {
  try {
    await AuthService.init();
  } catch (err) {
    handleError(err, "Autenticacao");
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
    criandoLote: false,
  };

  if (!state.form) return;

  const form = initEntregaForm(state);
  const list = initEntregaList(state);

  form.setOnSalvar(list.carregarEntregas);
  list.setOnEditar(form.preencherFormularioParaEdicao);
  list.setOnLimpar(form.limparFormulario);

  initCepController(state);

  const btnCriarLote = document.getElementById("btn-criar-lote");

  list.setOnLoteChanged((hasPendentes) => {
    if (hasPendentes) {
      btnCriarLote.classList.remove("hidden");
    } else {
      btnCriarLote.classList.add("hidden");
    }
  });

  btnCriarLote.addEventListener("click", async () => {
    if (state.criandoLote) return;
    state.criandoLote = true;

    const pendentes = state.entregasCarregadas.filter(
      (e) => e.status === "pendente" && !e.loteId,
    );

    if (!pendentes.length) {
      Dom.showToast(MENSAGENS.SEM_ENTREGAS_PENDENTES, "error");
      state.criandoLote = false;
      return;
    }

    Dom.setLoading(btnCriarLote, true, "Criando lote...");
    try {
      const docRef = await LoteService.criar(pendentes.map((e) => e.id));
      window.location.href = `/lote.html?id=${docRef.id}`;
    } catch (err) {
      handleError(err, "Criar lote", MENSAGENS.ERRO_SALVAR);
    } finally {
      Dom.setLoading(btnCriarLote, false);
      state.criandoLote = false;
    }
  });

  list.carregarEntregas();
});
