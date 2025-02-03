// NFT 거래 객체생성 모듈.
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

// NFT 3D 마켓 페이지를 초기화하는 함수.
export function initThreeScene(container: HTMLDivElement) {
  let camera: THREE.PerspectiveCamera, scene: THREE.Scene, renderer: CSS3DRenderer, controls: TrackballControls;
  const objects: CSS3DObject[] = [];
  const targets: { table: THREE.Object3D[]; sphere: THREE.Object3D[]; helix: THREE.Object3D[]; grid: THREE.Object3D[] } = {
    table: [],
    sphere: [],
    helix: [],
    grid: [],
  };
  // 버전 업데이트에 따른, TWEEN 애니메이션 사용법 변경됨. -> 자세한 내용은 test.html을 참조.
  const group = new TWEEN.Group(); 
  // NFT 객체(테이블) 생성. 
  // -> 변경점: 이미지 담기작업
  interface NFTItem {
    type: string;
    category: string;
    description: string;
    col: number;
    row: number;
    image: string;
  }

  // 이미지 파일 불러오기(Vite)
  const images = import.meta.glob('/src/03_assets/images/*.{png,jpg,jpeg,svg}', { eager: true }) as Record<string, string>;
  const nftImages = Object.values(images).map((mod) => mod.default); //Object 객체값 처리 -> image 모듈값으로 받아오기에 직접접근
  
  // 테이블 생성
  const table:NFTItem[] = [];

  const cols = 10; // NFT의 열 개수 (가로)
  const rows = 5;  // NFT의 행 개수 (세로)
  const spacingX = 140; // NFT 간격 (가로)
  const spacingY = 180; // NFT 간격 (세로)

  // 중앙 정렬 계산
  const centerX = (cols - 1) * spacingX * 0.5;
  const centerY = (rows - 1) * spacingY * 0.5;

  // NFT 배치 순서를 정확하게 관리
  let index = 0;

  // NFT 테이블 생성
  for (let row = 0; row < rows; row++) { // row 개수 조정
    for (let col = 0; col < cols; col++) { // col 개수 조정
        const imageUrl = nftImages[index]; // NFT 이미지 순서대로 적용
        table.push({
          type: 'NFT',
          category: 'NFT_ITEM',
          description: 'TEST the list',
          col: col + 1, // col을 한 줄씩 증가
          row: row,
          image: imageUrl,
        });

        index++; // NFT 순서를 올바르게 증가
    
        // NFT 3D 위치 설정
        const object = new THREE.Object3D();
        object.position.x = col * spacingX - centerX;
        object.position.y = -row * spacingY + centerY; // 원 좌표(0,0)이 좌측 맨위를 말한다. 거기를 x,y축으로 그리면, 위는 + 아래는 -이다. 따라서 음수로 표시해야 아래로 객체들이 랜더링(그려진다)된다.
        object.position.z = 0;
    
        targets.table.push(object);
    }
  }
  //NFT 객체를 Three.js 씬에 추가하는 초기화 함수.
  function init() {
    // 카메라 설정.
    camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 1, 10000);
    // 초기 카메라 거리 설정.
    camera.position.z = 1500;
    // 씬 생성.
    scene = new THREE.Scene();
    // NFT 오브젝트 생성하여 씬에 추가.
    for (let i = 0; i < table.length; i ++) {
      const element = document.createElement('div');
      element.className = styles.element;
      // NFT 번호.
      const number = document.createElement('div');
      number.className = styles.number;
      number.textContent = `${i}`;
      element.appendChild(number);
      number.style.position = 'relative';
      number.style.top = '5px'; // 숫자를 맨위로
      number.style.left = '-45px'; // 숫자를 좌측으로
      number.style.zIndex = '2'; // 이미지보다 위에 배치
      number.style.fontSize = '14px'; // 글자 크기 키우기
      number.style.fontWeight = 'bold'; // 가독성 향상

      // NFT 제목 -> image(캐릭상품)으로 대처
      const symbol = document.createElement('div');
      symbol.className = styles.symbol;
      // NFT 객체 가져오기
      const nftItem = table[i] as NFTItem;
      console.log('NFT Image URL:', nftItem.image);
      // 이미지 태그 생성
      const img = document.createElement('img');
      img.src = nftItem.image as string; // 이미지 URL 적용.
      img.alt = 'NFT Image'; // 접근성을 위한 alt 택스트 추가.
      img.style.width = '100px';
      img.style.height = '100px';
      img.style.marginTop = '-50px';
      
      // symbol에 이미지 추가
      symbol.appendChild(img);
      // 부모요소에 추가
      element.appendChild(symbol);
      // NFT 아이템 설명
      const details = document.createElement('div');
      details.className = styles.details;
      details.innerHTML = `${table[i + 1]}<br>${table[i + 2]}`;
      element.appendChild(details);
      // CSS3D 오브젝트 생성 및 랜덤 초기 위치 설정. 
      // -> three.js에서 html기반 3D공간을 랜더링(그려주는) 기능. -> 이 위에 NFT객체가 그려진다.
      const objectCSS = new CSS3DObject(element);
      // 객체가 첫장면 출현시 랜덤으로 배치되는 것을 만들어준다. -> 이후 'NFT 3D 위치 설정' 주석내용의 로직으로 각 NFT 상품객체가 배치됨.
      objectCSS.position.x = Math.random() * 4000 - 2000;
      objectCSS.position.y = Math.random() * 4000 - 2000;
      objectCSS.position.z = Math.random() * 4000 - 2000;
      scene.add(objectCSS);
      objects.push(objectCSS);
    }

    // CSS3D 랜더러 설정 및 추가.
    renderer = new CSS3DRenderer();
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    // TrackballControls (마우스 조작 기능) 설정.
    controls = new TrackballControls(camera, renderer.domElement);
    controls.minDistance = 500;
    controls.maxDistance = 6000;

    // 윈도우 크기 조절 이벤트 추가.(반응형)
    window.addEventListener('resize', onWindowResize);

    // NFT 오브젝트를 테이블 형식으로 정렬.
    transform(targets.table, 2000);
  }
  // NFT 오브젝트를 주어진 target 위치로 애니메이션 이동
  function transform(targets: THREE.Object3D[], duration: number) {
    objects.forEach((object, i) => {
      const target = targets[i];

      // 위치 애니메이션 (부드럽게 이동)
      new TWEEN.Tween(object.position, group)
        .to({ x: target.position.x, y: target.position.y, z: target.position.z }, duration)
        .easing(TWEEN.Easing.Exponential.InOut)
        .start();

      // 회전 애니메이션
      new TWEEN.Tween(object.rotation, group)
        .to({ x: target.rotation.x, y: target.rotation.y, z: target.rotation.z }, duration)
        .easing(TWEEN.Easing.Quadratic.InOut)
        .start();
    });
  }

  // 윈도우 크기가 변경될 때 호출되는 함수.
  function onWindowResize() {
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(container.clientWidth, container.clientHeight);
  }
  // 씬을 랜더링하는 함수.
  function render() {
    renderer.render(scene, camera);
  }
  // 애니메이션 루프. 
  function animate() {
    requestAnimationFrame(animate);
    // TWEEN 애니메이션 업데이트
    group.update(performance.now());
    // 카메라 컨트롤 업데이트
    controls.update();
    // 씬 렌더링
    render();
  }
  // 초기화 및 애니메이션 설정.
  init();
  animate();
  // 컴포넌트가 언마운트될 때 리소스 정리.
  return () => {
    window.removeEventListener('resize', onWindowResize);
    if (renderer && renderer.domElement && renderer.domElement.parentNode) {
      container.removeChild(renderer.domElement);
    }
  };
}