import { EntregaService } from "../services/EntregaService.js";
import { Dom } from "../utils/dom.js";
import { Format } from "../utils/format.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("form-nova-entrega");
  const btnCriar = document.getElementById("btn-criar");
  const btnCancelar = document.getElementById("btn-cancelar");
  const listaEntregas = document.getElementById("lista-entregas");

  document.getElementById("cliente-telefone").addEventListener("input", (e) => {
    e.target.value = Format.phone(e.target.value);
  });

  btnCancelar.addEventListener("click", () => {
    form.reset();
    Dom.showToast("Formulario limpo", "info");
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    Dom.setLoading(btnCriar, true, "Salvando...");
    try {
      await EntregaService.criar({
        nome: document.getElementById("cliente-nome").value.trim(),
        telefone: document.getElementById("cliente-telefone").value.trim(),
        endereco: document.getElementById("cliente-endereco").value.trim(),
        observacoes: document.getElementById("cliente-obs").value.trim(),
      });
      Dom.showToast("Entrega criada com sucesso!", "success");
      form.reset();
      carregarEntregas();
    } catch (err) {
      console.error(err);
      Dom.showToast(err.message || "Erro ao salvar.", "error");
    } finally {
      Dom.setLoading(btnCriar, false);
    }
  });

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
