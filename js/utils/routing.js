export const RoutingUtils = {
  cache: new Map(),
  CACHE_MAX: 200,

  _cacheSet(key, value) {
    if (this.cache.size >= this.CACHE_MAX) {
      const oldest = this.cache.keys().next().value;
      this.cache.delete(oldest);
    }
    this.cache.set(key, value);
  },

  async geocodeEntrega(entrega) {
    const detalhes = entrega.enderecoDetalhes ?? {};
    const candidates = [
      this.formatStructuredAddress(detalhes),
      entrega.endereco,
      this.formatAddressWithoutCep(entrega.endereco),
    ].filter(Boolean);

    for (const candidate of [...new Set(candidates)]) {
      const coords = await this.geocode(candidate);
      if (coords) return coords;
    }

    return null;
  },

  formatStructuredAddress(detalhes) {
    if (!detalhes.rua || !detalhes.cidade || !detalhes.uf) return "";

    return [
      detalhes.rua,
      detalhes.numero,
      detalhes.bairro,
      detalhes.cidade,
      detalhes.uf,
      detalhes.cep,
      "Brasil",
    ]
      .filter(Boolean)
      .join(", ");
  },

  formatAddressWithoutCep(address) {
    return String(address ?? "")
      .replace(/CEP\s*\d{5}-?\d{3}/i, "")
      .replace(/\s+-\s+/g, ", ")
      .replace(/\s{2,}/g, " ")
      .trim();
  },

  async geocode(address) {
    const cleanAddress = String(address ?? "").trim();
    if (!cleanAddress) return null;

    const key = cleanAddress.toLowerCase();
    if (this.cache.has(key)) return this.cache.get(key);

    const coords =
      (await this.geocodePhoton(cleanAddress)) ||
      (await this.geocodeNominatim(cleanAddress));

    this._cacheSet(key, coords);
    return coords;
  },

  async geocodePhoton(address) {
    try {
      const query = encodeURIComponent(
        address.includes("Brasil") ? address : `${address}, Brasil`,
      );
      const response = await fetch(
        `https://photon.komoot.io/api/?q=${query}&limit=1`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      const feature = data?.features?.[0];
      if (feature?.geometry?.coordinates?.length >= 2) {
        return {
          lat: Number.parseFloat(feature.geometry.coordinates[1]),
          lng: Number.parseFloat(feature.geometry.coordinates[0]),
          display: feature.properties?.name ?? address,
        };
      }
      return null;
    } catch (error) {
      console.warn(`[Photon] Falha para "${address}":`, error.message);
      return null;
    }
  },

  async geocodeNominatim(address) {
    try {
      const query = encodeURIComponent(
        address.includes("Brasil") ? address : `${address}, Brasil`,
      );
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=br&accept-language=pt-BR`,
        {
          headers: {
            Accept: "application/json",
          },
        },
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);

      const data = await response.json();
      if (data?.[0]) {
        return {
          lat: Number.parseFloat(data[0].lat),
          lng: Number.parseFloat(data[0].lon),
          display: data[0].display_name,
        };
      }
      return null;
    } catch (error) {
      console.warn(`[Nominatim] Falha para "${address}":`, error.message);
      return null;
    }
  },

  haversine(a, b) {
    const earthRadiusKm = 6371;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const h =
      Math.sin(dLat / 2) ** 2 +
      Math.cos((a.lat * Math.PI) / 180) *
        Math.cos((b.lat * Math.PI) / 180) *
        Math.sin(dLng / 2) ** 2;

    return earthRadiusKm * 2 * Math.asin(Math.sqrt(h));
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

    const unvisited = [...points];
    const route = [];
    let current = origin;

    while (unvisited.length > 0) {
      let nearestIdx = -1;
      let nearestDist = Infinity;

      unvisited.forEach((point, idx) => {
        const distance = this.haversine(current, point);
        if (distance < nearestDist) {
          nearestDist = distance;
          nearestIdx = idx;
        }
      });

      current = unvisited.splice(nearestIdx, 1)[0];
      route.push(current);
    }

    return {
      route,
      distance: this.calculateTotalDistance(origin, route),
    };
  },
};
