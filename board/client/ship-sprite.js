// board/client/ship-sprite.js
// One-time GLB → 2D sprite renders for the race track. Each (shipModel, color)
// pair is rendered once to a small transparent canvas and cached as a data-URL;
// after that the race is plain DOM — no per-frame WebGL. Resolves null when
// WebGL or the models are unavailable; the track shows a tinted glyph instead.
import * as THREE from 'three';
import { createShip, preloadShipTemplates, disposeShip, disposeObject3D } from './ship-mesh.js';

const SIZE = 128; // 2x the largest on-screen box (~26px CSS) so hiDPI stays crisp
const cache = new Map(); // `${shipModel}|${color}` -> Promise<string|null>
let ctx; // lazy { renderer, scene, camera }; null = WebGL unavailable
let templatesPromise; // cache the promise; all sprite renders share one load

function setup() {
  try {
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(SIZE, SIZE);
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1.6, 1.6, 1.6, -1.6, 0.1, 50);
    camera.position.set(0, 0, 10);
    camera.lookAt(0, 0, 0);
    scene.add(new THREE.HemisphereLight(0xffffff, 0x334155, 0.9));
    const key = new THREE.DirectionalLight(0xffffff, 0.9);
    key.position.set(2, 4, 6);
    scene.add(key);
    return { renderer, scene, camera };
  } catch {
    return null;
  }
}

async function render(shipModel, color) {
  templatesPromise ??= preloadShipTemplates();
  const templates = await templatesPromise;
  if (ctx === undefined) ctx = setup();
  if (!ctx) return null;
  const template = templates.get(shipModel) || templates.get('fighter');
  const ship = createShip({ callsign: '', color, shipModel, template });
  // Strip the non-hull extras (label sprite; invisible trail/liveRing meshes):
  // Box3.setFromObject counts them even when invisible, which would inflate the
  // framing below and shrink the hull to a speck in the canvas.
  for (const o of [...ship.children]) {
    if (o.isSprite || o.visible === false) { ship.remove(o); disposeObject3D(o); }
  }
  // 3/4 view, nose toward +x: pure side-on renders these low-poly hulls as a
  // thin sliver — yawing off-axis and pitching the top toward the camera keeps
  // the track direction readable while showing an actual ship silhouette.
  ship.rotation.set(0.55, 1.0, 0);
  ctx.scene.add(ship);
  ship.updateMatrixWorld(true);
  // Frame the camera to the hull so it fills the canvas regardless of model size.
  const box = new THREE.Box3().setFromObject(ship);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());
  const half = (Math.max(size.x, size.y) / 2) * 1.1 || 1.6;
  ctx.camera.left = center.x - half;
  ctx.camera.right = center.x + half;
  ctx.camera.top = center.y + half;
  ctx.camera.bottom = center.y - half;
  ctx.camera.updateProjectionMatrix();
  ctx.renderer.render(ctx.scene, ctx.camera);
  const url = ctx.renderer.domElement.toDataURL('image/png');
  ctx.scene.remove(ship);
  disposeShip(ship);
  return url;
}

export function shipSprite(shipModel, color) {
  const k = `${shipModel}|${color}`;
  if (!cache.has(k)) cache.set(k, render(shipModel, color).catch(() => null));
  return cache.get(k);
}
