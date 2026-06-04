import { EntregaService } from "../services/EntregaService.js";
import { RotaService } from "../services/RotaService.js";
import { Dom } from "../utils/dom.js";
import { handleError } from "../utils/errorHandler.js";
import { LOJA } from "../utils/constants.js";

document.addEventListener("DOMContentLoaded", () => {
  const btnCalcular = document.getElementById("btn-calcular-rota");
  const listaRota = document.getElementById("lista-rota");
  const cardOtimizada = document.getElementById("card-rota-otimizada");
  const linkWaze = document.getElementById("link-waze");
  const linkGmaps = document.getElementById("link-gmaps");
  const inputLoja = document.getElementById("endereco-loja");

  inputLoja.value = LOJA.ENDERECO;

  btnCalcular.addEventListener("click", async () => {
    Dom.setLoading(btnCalcular, true, "Otimizando rota...");
    listaRota.innerHTML = `<li class="loading">Geocodificando enderecos...</li>`;

    try {
      const entregas = await EntregaService.listarPendentes();
      if (!entregas.length) {
        listaRota.innerHTML = `<li class="text-muted">Nenhuma entrega pendente.</li>`;
        return;
      }

      const { rota, distanciaTotal, origemCoords } = await RotaService.calcular(
        LOJA.ENDERECO,
        entregas,
        LOJA.COORDS,
      );

      listaRota.innerHTML = "";
      rota.forEach((entrega, idx) => {
        const li = document.createElement("li");
        li.className = "flex justify-between items-center mt-1";
        li.innerHTML = `
          <div>
            <strong>${idx + 1}.</strong> ${Dom.escapeHtml(entrega.nome)}<br>
            <small class="text-muted">${Dom.escapeHtml(entrega.endereco)}</small>
          </div>
        `;
        listaRota.appendChild(li);
      });

      linkGmaps.href = RotaService.gerarLinkGoogleMaps(origemCoords, rota);
      linkWaze.href = RotaService.gerarLinkWaze(rota[0].coords);
      cardOtimizada.classList.remove("hidden");
      Dom.showToast(`Rota calculada: ${distanciaTotal.toFixed(1)} km`, "success");
    } catch (err) {
      const message = handleError(err, "Rota", "Erro ao calcular rota");
      listaRota.innerHTML = `<li class="text-muted">${Dom.escapeHtml(message)}</li>`;
    } finally {
      Dom.setLoading(btnCalcular, false);
    }
  });
});
