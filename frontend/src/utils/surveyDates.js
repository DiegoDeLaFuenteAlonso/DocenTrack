export function todayISODate() {
  return new Date().toISOString().slice(0, 10);
}

/** Encuesta con fecha_inicio / fecha_fin como YYYY-MM-DD */
export function encuestaEnPlazo(encuesta) {
  if (!encuesta?.activa) return false;
  const t = todayISODate();
  return encuesta.fecha_inicio <= t && t <= encuesta.fecha_fin;
}
