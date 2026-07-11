import * as THREE from 'three';
import { createShip } from './ship-mesh.js';
import { placement } from './placement.js';

const PAD_Y = 0, ORBIT_Y = 3.2, ORBIT_R = 2.4;

export function createScene(container) {
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
  camera.position.set(0, 2.4, 8);
  camera.lookAt(0, 1.6, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  container.append(renderer.domElement);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x0b1020, 1.2));
  const key = new THREE.DirectionalLight(0xffffff, 1.1); key.position.set(3, 6, 4); scene.add(key);

  const pad = new THREE.Mesh(new THREE.CircleGeometry(4, 48), new THREE.MeshStandardMaterial({ color: 0x111a2e, roughness: 1 }));
  pad.rotation.x = -Math.PI / 2; scene.add(pad);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(ORBIT_R, 0.012, 8, 96), new THREE.MeshBasicMaterial({ color: 0x244066 }));
  ring.position.y = ORBIT_Y; ring.rotation.x = Math.PI / 2; scene.add(ring);

  const ships = new Map(); // callsign -> { group, data, index }
  let angle = 0;

  function update(list) {
    const seen = new Set();
    list.forEach((s, i) => {
      seen.add(s.callsign);
      let rec = ships.get(s.callsign);
      if (!rec || rec.data.color !== s.color) {          // new ship, or colour changed → rebuild
        if (rec) { scene.remove(rec.group); disposeObject3D(rec.group); }
        const group = createShip({ callsign: s.callsign, color: s.color });
        scene.add(group);
        rec = { group };
        ships.set(s.callsign, rec);
      }
      rec.data = s; rec.index = i;
    });
    for (const [callsign, rec] of ships) {
      if (!seen.has(callsign)) { scene.remove(rec.group); disposeObject3D(rec.group); ships.delete(callsign); }
    }
  }

  function place(rec, total) {
    const { zone, t } = placement(rec.data);
    if (zone === 'orbit') {
      const a = angle + (rec.index / Math.max(1, total)) * Math.PI * 2;
      rec.group.position.set(Math.cos(a) * ORBIT_R, ORBIT_Y, Math.sin(a) * ORBIT_R);
    } else {
      const col = rec.index % 8, row = Math.floor(rec.index / 8);
      rec.group.position.set((col - 3.5) * 0.7, PAD_Y + t * (ORBIT_Y - PAD_Y), row * 0.7 - 1);
    }
  }

  let raf = 0;
  const clock = new THREE.Clock();
  function tick() {
    angle += clock.getDelta() * 0.2;
    const total = ships.size;
    for (const rec of ships.values()) place(rec, total);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(tick);
  }
  tick();

  function onResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  window.addEventListener('resize', onResize);

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  function onClick(e) {
    const rect = renderer.domElement.getBoundingClientRect();
    pointer.set(((e.clientX - rect.left) / rect.width) * 2 - 1, -((e.clientY - rect.top) / rect.height) * 2 + 1);
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects([...ships.values()].map((r) => r.group), true);
    if (!hits.length) return;
    let o = hits[0].object;
    while (o && !o.userData.callsign) o = o.parent;
    const rec = o && ships.get(o.userData.callsign);
    if (rec && rec.data.siteUrl && placement(rec.data).zone === 'orbit') window.open(rec.data.siteUrl, '_blank', 'noopener');
  }
  renderer.domElement.addEventListener('click', onClick);

  return {
    update,
    dispose() {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      renderer.domElement.removeEventListener('click', onClick);
      for (const rec of ships.values()) { scene.remove(rec.group); disposeObject3D(rec.group); }
      ships.clear();
      pad.geometry.dispose(); pad.material.dispose();
      ring.geometry.dispose(); ring.material.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}

// Texture-cascading dispose — carried forward from the launchpad M1 fix. The
// label sprites carry a CanvasTexture, so this cascade is load-bearing here.
function disposeObject3D(obj) {
  obj.traverse((node) => {
    if (node.isMesh || node.isSprite) {
      node.geometry?.dispose?.();
      const mats = Array.isArray(node.material) ? node.material : [node.material];
      for (const m of mats) disposeMaterial(m);
    }
  });
}
function disposeMaterial(material) {
  if (!material) return;
  for (const value of Object.values(material)) if (value?.isTexture) value.dispose();
  material.dispose();
}
