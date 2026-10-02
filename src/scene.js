import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { VAULTS } from "./engine.js";
export function createScene(container, onNavigate) {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0, 0);
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.85;
  container.append(renderer.domElement);
  const scene = new T.Scene(),
    camera = new T.PerspectiveCamera(36, 1, 0.1, 100);
  camera.position.set(7, 5.4, 11);
  camera.lookAt(0, 0.25, 0);
  scene.add(new T.HemisphereLight(0xffffff, 0x787086, 3));
  const light = new T.DirectionalLight(0xffffff, 4);
  light.position.set(-3, 8, 7);
  scene.add(light);
  const root = new T.Group();
  scene.add(root);
  const accent = new T.MeshToonMaterial({ color: VAULTS[0].color });
  const white = new T.MeshToonMaterial({ color: 0xf6f4ec });
  const dark = new T.MeshToonMaterial({ color: 0x22202b });
  const gray = new T.MeshToonMaterial({ color: 0xccc7d0 });
  function mesh(geo, mat, parent, x = 0, y = 0, z = 0) {
    const m = new T.Mesh(geo, mat);
    m.position.set(x, y, z);
    parent.add(m);
    const edges = new T.LineSegments(
      new T.EdgesGeometry(geo, 35),
      new T.LineBasicMaterial({ color: 0x19171e }),
    );
    m.add(edges);
    return m;
  }
  const plinth = mesh(
    new T.CylinderGeometry(3.05, 3.25, 0.3, 64),
    dark,
    root,
    0,
    -2.22,
    0,
  );
  mesh(new T.CylinderGeometry(3.03, 3.03, 0.12, 64), accent, root, 0, -2.01, 0);
  for (const x of [-1.05, 1.05])
    for (const z of [-0.6, 0.6])
      mesh(new T.BoxGeometry(0.48, 0.38, 0.48), dark, root, x, -1.71, z);
  mesh(new RoundedBoxGeometry(3, 3.4, 2.25, 3, 0.16), gray, root, 0, 0, -0.12);
  mesh(
    new RoundedBoxGeometry(3.05, 0.33, 2.3, 2, 0.08),
    accent,
    root,
    0,
    -1.38,
    -0.12,
  );
  mesh(
    new RoundedBoxGeometry(2.65, 2.9, 0.03, 2, 0.08),
    dark,
    root,
    0,
    0,
    1.025,
  );
  const hinge = new T.Group();
  hinge.position.set(-1.35, 0, 1.08);
  root.add(hinge);
  const door = new T.Group();
  door.position.x = 1.35;
  hinge.add(door);
  mesh(new RoundedBoxGeometry(2.78, 3.05, 0.22, 3, 0.1), white, door);
  mesh(
    new RoundedBoxGeometry(2.38, 2.61, 0.1, 2, 0.06),
    accent,
    door,
    0,
    0,
    0.16,
  );
  const dial = new T.Group();
  dial.position.set(0, 0.22, 0.37);
  door.add(dial);
  const ring = mesh(new T.CylinderGeometry(0.68, 0.68, 0.16, 64), dark, dial);
  ring.rotation.x = Math.PI / 2;
  const face = mesh(
    new T.CylinderGeometry(0.57, 0.57, 0.17, 64),
    white,
    dial,
    0,
    0,
    0.11,
  );
  face.rotation.x = Math.PI / 2;
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    const tick = mesh(
      new T.BoxGeometry(i % 5 ? 0.025 : 0.045, i % 5 ? 0.05 : 0.11, 0.01),
      dark,
      dial,
      Math.sin(a) * 0.49,
      Math.cos(a) * 0.49,
      0.21,
    );
    tick.rotation.z = -a;
  }
  const knob = mesh(
    new T.CylinderGeometry(0.22, 0.22, 0.23, 32),
    dark,
    dial,
    0,
    0,
    0.27,
  );
  knob.rotation.x = Math.PI / 2;
  mesh(new T.BoxGeometry(0.09, 0.3, 0.03), accent, dial, 0, 0.02, 0.41);
  mesh(
    new RoundedBoxGeometry(0.73, 0.15, 0.2, 2, 0.035),
    dark,
    door,
    0.63,
    -0.8,
    0.4,
  );
  for (const y of [-0.85, 0.85])
    mesh(
      new T.CylinderGeometry(0.1, 0.1, 0.48, 16),
      dark,
      root,
      -1.42,
      y,
      1.12,
    );
  const slot = mesh(
    new T.BoxGeometry(0.6, 0.045, 0.01),
    dark,
    door,
    0,
    1,
    0.235,
  );
  for (const x of [-1.07, 1.07])
    for (const y of [-1.17, 1.17]) {
      const bolt = mesh(
        new T.CylinderGeometry(0.055, 0.055, 0.03, 12),
        dark,
        door,
        x,
        y,
        0.235,
      );
      bolt.rotation.x = Math.PI / 2;
    }
  const floor = mesh(
    new T.CylinderGeometry(3.65, 3.65, 0.03, 64),
    new T.MeshBasicMaterial({
      color: 0xaaa3b5,
      transparent: true,
      opacity: 0.18,
    }),
    scene,
    0,
    -2.4,
    0,
  );
  let targetColor = new T.Color(VAULTS[0].color),
    opened = false,
    running = false,
    targetRotation = 0,
    last = 0;
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const observer = new ResizeObserver(() => {
    const w = container.clientWidth,
      h = container.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.position
      .set(7, 5.4, 11)
      .multiplyScalar(camera.aspect < 0.8 ? 1.13 : 1);
    camera.updateProjectionMatrix();
  });
  observer.observe(container);
  renderer.setAnimationLoop((time) => {
    const dt = Math.min((time - last) / 1000, 0.05);
    last = time;
    accent.color.lerp(targetColor, 0.08);
    hinge.rotation.y = T.MathUtils.damp(
      hinge.rotation.y,
      opened ? -1.9 : 0,
      5,
      dt,
    );
    root.rotation.y = T.MathUtils.damp(root.rotation.y, targetRotation, 5, dt);
    if (!reduced) {
      root.position.y = Math.sin(time * 0.001) * 0.05;
      dial.rotation.z += dt * (running ? 2 : 0.08);
    }
    renderer.render(scene, camera);
  });
  let down = null;
  container.addEventListener("pointerdown", (e) => {
    down = e.clientX;
  });
  container.addEventListener("pointerup", (e) => {
    if (down !== null && Math.abs(e.clientX - down) > 45)
      onNavigate(e.clientX < down ? 1 : -1);
    down = null;
  });
  container.addEventListener("pointercancel", () => {
    down = null;
  });
  return {
    update(index, isOpen, isRunning) {
      targetColor.set(VAULTS[index].color);
      opened = isOpen;
      running = isRunning;
      targetRotation = index * 0.08;
    },
    dispose() {
      observer.disconnect();
      renderer.setAnimationLoop(null);
      scene.traverse((o) => {
        o.geometry?.dispose();
        if (o.material) {
          for (const m of Array.isArray(o.material) ? o.material : [o.material])
            m.dispose();
        }
      });
      renderer.dispose();
    },
  };
}
