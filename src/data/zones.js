export const ZONES = [
  { name: 'Centro Histórico', lat: -12.0464, lng: -77.0428 },
  { name: 'La Merced', lat: -12.0508, lng: -77.0351 },
  { name: 'Parque Central', lat: -12.0572, lng: -77.0365 },
  { name: 'Los Pinos', lat: -12.0618, lng: -77.0288 },
  { name: 'El Carmen', lat: -12.0650, lng: -77.0450 },
  { name: 'San Pedro', lat: -12.0400, lng: -77.0310 },
  { name: 'Santa Teresita', lat: -12.0700, lng: -77.0380 },
  { name: 'Col. América', lat: -12.0525, lng: -77.0500 }
];

export const getCoordinatesForZone = (zoneName) => {
  const zone = ZONES.find(z => z.name === zoneName);
  return zone ? { lat: zone.lat, lng: zone.lng } : { lat: null, lng: null };
};
