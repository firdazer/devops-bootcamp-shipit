// Pure config core — no browser/node-only imports, so both the CLI gate
// (Node) and the site (Vite) can import it.
export const EMBLEMS = ['comet', 'bolt', 'star', 'ring', 'delta', 'phoenix'];
export const COLOR_RE = /^#[0-9a-fA-F]{6}$/;
export const DEFAULTS = { shipName: 'Nebula Runner', color: '#22d3ee', emblem: 'comet' };

const isObject = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

// Strict — the pre-flight gate. Returns every problem it finds.
export function validateConfig(cfg) {
  if (!isObject(cfg)) return { ok: false, errors: ['config must be a JSON object'] };
  const errors = [];
  const name = typeof cfg.shipName === 'string' ? cfg.shipName.trim() : '';
  if (name.length < 1 || name.length > 24) {
    errors.push('shipName must be a non-empty string of at most 24 characters');
  }
  if (typeof cfg.color !== 'string' || !COLOR_RE.test(cfg.color)) {
    errors.push('color must be a hex string like #22d3ee');
  }
  if (typeof cfg.emblem !== 'string' || !EMBLEMS.includes(cfg.emblem)) {
    errors.push(`emblem must be one of: ${EMBLEMS.join(', ')}`);
  }
  return { ok: errors.length === 0, errors };
}

// Lenient — the browser. Always returns usable params so a bad config
// (which the gate would have blocked anyway) never white-screens the site.
export function toRenderParams(cfg) {
  const raw = isObject(cfg) ? cfg : {};
  const shipName =
    typeof raw.shipName === 'string' && raw.shipName.trim() ? raw.shipName.trim().slice(0, 24) : DEFAULTS.shipName;
  const color = typeof raw.color === 'string' && COLOR_RE.test(raw.color) ? raw.color : DEFAULTS.color;
  const emblem = typeof raw.emblem === 'string' && EMBLEMS.includes(raw.emblem) ? raw.emblem : DEFAULTS.emblem;
  return { shipName, color, emblem };
}
