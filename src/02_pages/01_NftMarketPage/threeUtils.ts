// This NftMarketPage is based on the [Three.js CSS3D Periodic Table Example](https://github.com/mrdoob/three.js/blob/master/examples/css3d_periodictable.html).

// - Copyright (c) 2010-2023 three.js authors
// - Licensed under [MIT License](https://opensource.org/licenses/MIT)

// Based on Three.js CSS3D Periodic Table Example
// -Copyright (c) 2010-2023 three.js authors-
// License: MIT
// Source: https://github.com/mrdoob/three.js/blob/master/examples/css3d_periodictable.html

// -Customized for portfolio use-
// -Copyright (c) 2025 Hyunwoo Park-

import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
import styles from './NftMarketPage.module.css';

export function initThreeScene(container: HTMLDivElement) {
  let camera: THREE.PerspectiveCamera, scene: THREE.Scene, renderer: CSS3DRenderer, controls: TrackballControls;
  const objects: CSS3DObject[] = [];
  const targets: { table: THREE.Object3D[]; sphere: THREE.Object3D[]; helix: THREE.Object3D[]; grid: THREE.Object3D[] } = {
    table: [],
    sphere: [],
    helix: [],
    grid: [],
  };

  const group = new TWEEN.Group();

  const table: (string | number)[] = [];
  // NFT 테이블 객체 생성
  for (let row = 1; row <= 10; row++) { // 20 rows
    for (let col = 1; col <= 18; col++) { // 18 columns
      table.push('NFT', 'NFT_ITEM', 'TEST the list', col, row);
    }
  }
  //NFT 그려주기. 기타는 다음커밋때, 주석 달아줄 예정.
  function init() {
    camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 1, 10000);
    camera.position.z = 3000;

    scene = new THREE.Scene();
    scene.background = new THREE.Color('black');

    for (let i = 0; i < table.length; i += 5) {
      const element = document.createElement('div');
      element.className = styles.element;

      const number = document.createElement('div');
      number.className = styles.number;
      number.textContent = `${i / 5 + 1}`;
      element.appendChild(number);

      const symbol = document.createElement('div');
      symbol.className = styles.symbol;
      symbol.textContent = table[i] as string;
      element.appendChild(symbol);

      const details = document.createElement('div');
      details.className = styles.details;
      details.innerHTML = `${table[i + 1]}<br>${table[i + 2]}`;
      element.appendChild(details);

      const objectCSS = new CSS3DObject(element);
      objectCSS.position.x = Math.random() * 4000 - 2000;
      objectCSS.position.y = Math.random() * 4000 - 2000;
      objectCSS.position.z = Math.random() * 4000 - 2000;
      scene.add(objectCSS);

      objects.push(objectCSS);

      const object = new THREE.Object3D();
      object.position.x = (table[i + 3] as number) * 140 - 1330;
      object.position.y = -(table[i + 4] as number) * 180 + 990;
      object.position.z = 0;

      targets.table.push(object);
    }

    // Set up the renderer
    renderer = new CSS3DRenderer();
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // Initialize the controls
    controls = new TrackballControls(camera, renderer.domElement);
    controls.minDistance = 500;
    controls.maxDistance = 6000;

    window.addEventListener('resize', onWindowResize);

    transform(targets.table, 2000); // Initial transformation to the table layout
  }

  function transform(targets: THREE.Object3D[], duration: number) {
    objects.forEach((object, i) => {
      const target = targets[i];

      new TWEEN.Tween(object.position, group)
        .to({ x: target.position.x, y: target.position.y, z: target.position.z }, duration)
        .easing(TWEEN.Easing.Exponential.InOut)
        .start();

      new TWEEN.Tween(object.rotation, group)
        .to({ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, duration)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();
    });
  }

  function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }

  function render() {
    renderer.render(scene, camera);
  }

  function animate() {
    requestAnimationFrame(animate);
    group.update(performance.now());
    controls.update();
    render();
  }

  init();
  animate();

  return () => {
    window.removeEventListener('resize', onWindowResize);
    if (renderer && renderer.domElement && renderer.domElement.parentNode) {
      container.removeChild(renderer.domElement);
    }
  };
}