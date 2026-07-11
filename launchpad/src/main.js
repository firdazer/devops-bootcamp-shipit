import { ship } from './config.js';
import { createScene } from './scene.js';
import { renderOverlay } from './overlay.js';
import { shouldUseFallback, detectWebGL, renderFallback } from './fallback.js';
import './style.css';

const app = document.getElementById('app');
document.title = `${ship.shipName} — Ship`;

const callsign = import.meta.env.VITE_CALLSIGN || '';
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const gl = detectWebGL();

if (shouldUseFallback({ gl, reducedMotion })) {
  renderFallback(app, ship, callsign);
} else {
  const stage = document.createElement('div');
  stage.className = 'stage';
  app.append(stage);
  createScene(stage, ship);
  renderOverlay(app, ship, callsign);
}
