import * as THREE from 'three';

// A tiny procedural rocket + a canvas-texture callsign label. The label's
// CanvasTexture is why scene.js's dispose must cascade to textures.
export function createShip({ callsign, color }) {
  const group = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({ color: new THREE.Color(color), metalness: 0.3, roughness: 0.5 });

  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.5, 16), mat);
  group.add(body);
  const nose = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.24, 16), mat);
  nose.position.y = 0.37;
  group.add(nose);

  const label = makeLabel(callsign);
  label.position.y = 0.62;
  group.add(label);

  group.userData = { callsign, color };
  return group;
}

function makeLabel(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 64;
  const ctx = canvas.getContext('2d');
  ctx.font = '28px system-ui, sans-serif';
  ctx.fillStyle = '#dbeafe';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.slice(0, 16), 128, 32);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: texture, transparent: true }));
  sprite.scale.set(1.3, 0.32, 1);
  return sprite;
}
