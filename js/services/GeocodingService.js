const cache = new Map();
const CACHE_MAX = 200;

function cacheSet(key, value) {
  if (cache.size >= CACHE_MAX) {
    const oldest = cache.keys().next().value;
    cache.delete(oldest);
  }
  cache.set(key, value);
}

async function geocodePhoton(address) {
  try {
    const query = encodeURIComponent(
      address.includes("Brasil") ? address : `${address}, Brasil`,
    );
    const response = await fetch(
      `https://photon.komoot.io/api/?q=${query}&limit=1`,
      { headers: { Accept: "application/json" } },
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
}

async function geocodeNominatim(address) {
  try {
    const query = encodeURIComponent(
      address.includes("Brasil") ? address : `${address}, Brasil`,
    );
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1&countrycodes=br&accept-language=pt-BR`,
      { headers: { Accept: "application/json" } },
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
}

function formatStructuredAddress(detalhes) {
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
}

function formatAddressWithoutCep(address) {
  return String(address ?? "")
    .replace(/CEP\s*\d{5}-?\d{3}/i, "")
    .replace(/\s+-\s+/g, ", ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export const GeocodingService = {
  formatStructuredAddress,
  formatAddressWithoutCep,

  async geocode(address) {
    const cleanAddress = String(address ?? "").trim();
    if (!cleanAddress) return null;

    const key = cleanAddress.toLowerCase();
    if (cache.has(key)) return cache.get(key);

    const coords =
      (await geocodePhoton(cleanAddress)) ||
      (await geocodeNominatim(cleanAddress));

    if (coords) cacheSet(key, coords);
    return coords;
  },

  async geocodeEntrega(entrega) {
    const detalhes = entrega.enderecoDetalhes ?? {};
    const candidates = [
      formatStructuredAddress(detalhes),
      entrega.endereco,
      formatAddressWithoutCep(entrega.endereco),
    ].filter(Boolean);

    for (const candidate of [...new Set(candidates)]) {
      const coords = await this.geocode(candidate);
      if (coords) return coords;
    }

    return null;
  },
};
