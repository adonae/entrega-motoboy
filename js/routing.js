export const RoutingUtils = {
  // Cache simples para geocodificação
  cache: new Map(),

  async geocode(address, userAgent = "EntregasApp/1.0") {
    const key = address.trim().toLowerCase();
    if (this.cache.has(key)) return this.cache.get(key);

    try {
      const query = encodeURIComponent(`${address}, Brasil`);
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
        {
          headers: {
            "Accept-Language": "pt-BR",
            "User-Agent": userAgent,
          },
        },
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (data?.[0]) {
        const coords = {
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon),
          display: data[0].display_name,
        };
        this.cache.set(key, coords);
        return coords;
      }
      return null;
    } catch (error) {
      console.warn(`[Geocoding] Falha para "${address}":`, error.message);
      return null;
    }
  },

  haversine(a, b) {
    const R = 6371; // Raio da Terra em km
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;
    return R * 2 * Math.asin(Math.sqrt(h));
  },

  calculateTotalDistance(origin, route) {
    if (!route?.length) return 0;
    let total = this.haversine(origin, route[0]);
    for (let i = 0; i < route.length - 1; i++) {
      total += this.haversine(route[i], route[i + 1]);
    }
    return total;
  },

  nearestNeighborTSP(origin, points) {
    if (!points?.length) return { route: [], distance: 0 };
    if (points.length === 1)
      return {
        route: [...points],
        distance: this.haversine(origin, points[0]),
      };

    let bestRoute = null;
    let bestDistance = Infinity;
    const starts = [origin, ...points]; // Testa múltiplos pontos de início

    for (const start of starts) {
      const unvisited = [...points];
      const route = [];
      let current = start;

      // Distância inicial: origem → primeiro ponto
      let distance =
        start === origin && points[0]
          ? this.haversine(origin, points[0])
          : this.haversine(origin, start);

      while (unvisited.length > 0) {
        let nearestIdx = -1;
        let nearestDist = Infinity;

        unvisited.forEach((point, idx) => {
          const d = this.haversine(current, point);
          if (d < nearestDist) {
            nearestDist = d;
            nearestIdx = idx;
          }
        });

        if (nearestIdx === -1) break;
        current = unvisited.splice(nearestIdx, 1)[0];
        route.push(current);
        distance += nearestDist;
      }

      // Recalcula distância real para precisão
      const realDistance = this.calculateTotalDistance(origin, route);
      if (realDistance < bestDistance) {
        bestDistance = realDistance;
        bestRoute = [...route];
      }
    }

    return { route: bestRoute, distance: bestDistance };
  },
};