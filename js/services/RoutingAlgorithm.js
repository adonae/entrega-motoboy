function haversine(a, b) {
  const earthRadiusKm = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;

  return earthRadiusKm * 2 * Math.asin(Math.sqrt(h));
}

function calculateTotalDistance(origin, route) {
  if (!route?.length) return 0;

  let total = haversine(origin, route[0]);
  for (let i = 0; i < route.length - 1; i++) {
    total += haversine(route[i], route[i + 1]);
  }

  return total;
}

function nearestNeighborTSP(origin, points) {
  if (!points?.length) return { route: [], distance: 0 };

  const unvisited = [...points];
  const route = [];
  let current = origin;

  while (unvisited.length > 0) {
    let nearestIdx = -1;
    let nearestDist = Infinity;

    unvisited.forEach((point, idx) => {
      const distance = haversine(current, point);
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
    distance: calculateTotalDistance(origin, route),
  };
}

export const RoutingAlgorithm = { haversine, calculateTotalDistance, nearestNeighborTSP };
