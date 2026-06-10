import { GeocodingService } from "./GeocodingService.js";
import { RoutingAlgorithm } from "./RoutingAlgorithm.js";

export const RotaService = {
  async calcular(enderecoOrigem, entregas, origemCoordsFixo = null) {
    if (!entregas.length) {
      throw new Error("Nenhuma entrega para calcular a rota.");
    }

    const origemCoords = origemCoordsFixo ?? (await GeocodingService.geocode(enderecoOrigem));
    if (!origemCoords) {
      throw new Error("Nao foi possivel geocodificar o ponto de partida.");
    }

    const entregasComCoords = [];
    for (let i = 0; i < entregas.length; i++) {
      const coords = await GeocodingService.geocodeEntrega(entregas[i]);
      if (coords) {
        entregasComCoords.push({ ...entregas[i], coords });
      }
    }

    if (!entregasComCoords.length) {
      throw new Error("Nenhum endereco valido encontrado.");
    }

    const pontos = entregasComCoords.map((entrega) => ({
      id: entrega.id,
      ...entrega.coords,
    }));

    const { route, distance } = RoutingAlgorithm.nearestNeighborTSP(
      origemCoords,
      pontos,
    );

    const rotaOrdenada = route.map((ponto) =>
      entregasComCoords.find((entrega) => entrega.id === ponto.id),
    );

    return { rota: rotaOrdenada, distanciaTotal: distance, origemCoords };
  },

  gerarLinkGoogleMaps(origemCoords, rota) {
    if (!rota?.length) {
      return "";
    }
    const destino = rota[rota.length - 1].coords;
    const waypoints = rota
      .slice(0, -1)
      .map((entrega) => `${entrega.coords.lat},${entrega.coords.lng}`)
      .join("|");
    const waypointParam = waypoints ? `&waypoints=${waypoints}` : "";

    return `https://www.google.com/maps/dir/?api=1&origin=${origemCoords.lat},${origemCoords.lng}&destination=${destino.lat},${destino.lng}${waypointParam}&travelmode=driving`;
  },

  gerarLinkWaze(destinoCoords) {
    if (!destinoCoords) {
      return "";
    }
    return `https://waze.com/ul?ll=${destinoCoords.lat},${destinoCoords.lng}&navigate=yes`;
  },
};
