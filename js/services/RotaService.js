import { RoutingUtils } from "../routing.js";

const RATE_LIMIT_MS = 1100; // Nominatim: 1 req/seg

export const RotaService = {
  async calcular(enderecoOrigem, entregas) {
    if (!entregas.length) {
      throw new Error("Nenhuma entrega para calcular a rota.");
    }

    const origemCoords = await RoutingUtils.geocode(enderecoOrigem);
    if (!origemCoords) {
      throw new Error("Não foi possível geocodificar o ponto de partida.");
    }

    // Geocodifica os destinos com rate limiting amigável ao Nominatim
    const entregasComCoords = [];
    for (let i = 0; i < entregas.length; i++) {
      const coords = await RoutingUtils.geocode(entregas[i].endereco);
      if (coords) {
        entregasComCoords.push({ ...entregas[i], coords });
      }
      if (i < entregas.length - 1) {
        await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
      }
    }

    if (!entregasComCoords.length) {
      throw new Error("Nenhum endereço válido encontrado.");
    }

    const { route, distance } = RoutingUtils.nearestNeighborTSP(
      origemCoords,
      entregasComCoords.map((e) => e.coords),
    );

    // Reconstrói a rota com os dados completos de cada entrega
    const rotaOrdenada = route.map((coords) =>
      entregasComCoords.find(
        (e) => e.coords.lat === coords.lat && e.coords.lng === coords.lng,
      ),
    );

    return { rota: rotaOrdenada, distanciaTotal: distance, origemCoords };
  },

  gerarLinkGoogleMaps(origemCoords, rota) {
    const destino = rota[rota.length - 1].coords;
    const waypoints = rota.map((e) => `${e.coords.lat},${e.coords.lng}`).join("|");
    return `https://www.google.com/maps/dir/?api=1&origin=${origemCoords.lat},${origemCoords.lng}&destination=${destino.lat},${destino.lng}&waypoints=${waypoints}&travelmode=driving`;
  },

  gerarLinkWaze(origemCoords) {
    return `https://waze.com/ul?ll=${origemCoords.lat},${origemCoords.lng}&navigate=yes`;
  },
};
