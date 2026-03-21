export const DOCENTRACK_REFRESH = 'docentrack-refresh';

export function emitDocentrackRefresh() {
  window.dispatchEvent(new CustomEvent(DOCENTRACK_REFRESH));
}
