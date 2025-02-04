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
    category: { name: string; icon: string };
    description: { value: string; icon: string };
    col: number;
    row: number;
    image: string;
  }

  // 이미지 파일 불러오기(Vite)
  const images = import.meta.glob('/src/03_assets/images/*.{png,jpg,jpeg,svg}', { eager: true }) as Record<string, {default:string}>;
  const nftImages = Object.values(images).map((mod) => mod.default); //Object 객체값 처리 -> image 모듈값으로 받아오기에 직접접근
  
  // 테이블 생성
  const table:NFTItem[] = [];

  const cols = 10; // NFT의 열 개수 (가로)
  const rows = 5;  // NFT의 행 개수 (세로)
  const spacingX = 170; // NFT 간격 (가로)
  const spacingY = 205; // NFT 간격 (세로)

  // 중앙 정렬 계산
  const centerX = (cols - 1) * spacingX * 0.5;
  const centerY = (rows - 1) * spacingY * 0.5;

  // NFT 배치 순서를 정확하게 관리
  let index = 0;
  
  // NFT 더미 함수
  const jobList = ['Warrior', 'Archer', 'Lancer', 'Wizard'];

  // 랜덤 직업 반환 함수
  // 직업목록이 동적으로 바뀜으로 Record<string,string>을 사용함.
  const jobIcons: Record<string, string> = {
    Warrior: "🗡️",    // 검
    Archer: "🏹",    // 활
    Lancer: "⚔️",    // 창
    Wizard: "🔮"   // 마법구
  }

  function getRandomJob() {
    const job = jobList[Math.floor(Math.random() * jobList.length)];
    return { name: job, icon: jobIcons[job] };
  }

  // 랜덤 가격 반환 함수 (0.1 ~ 5.0 ETH)
  function getRandomPrice() {
    const priceValue = (Math.random() * 4.9 + 0.1).toFixed(2) + " ETH";
    
    // 가격이 높을수록 아이콘이 변경됨
    let goldStack = "🪙"; // 기본 아이콘 -> 이모지 아이콘
    const price = parseFloat(priceValue);
    
    if (price >= 4) goldStack = "💎"; 
    else if (price >= 3) goldStack = "🟡";
    else if (price >= 2) goldStack = "💰";
    
    return { value: priceValue, icon: goldStack };
  }

  // NFT 테이블 생성 -> nft데이터 내용이 들어있음.
  for (let row = 0; row < rows; row++) { // row 개수 조정
    for (let col = 0; col < cols; col++) { // col 개수 조정
        const imageUrl = nftImages[index]; // NFT 이미지 순서대로 적용
        const job = getRandomJob();
        const price = getRandomPrice();

        const nftItem: NFTItem = {
          type: "NFT",
          category: job, 
          description: price,
          col: col + 1, 
          row: row,
          image: imageUrl,
        };

        table.push(nftItem);
        index++; 
    
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
      //NFT 객체에서 'category'와'description' 직접가져오기.
      details.innerHTML = 
      `
      <strong>${nftItem.category.icon} ${nftItem.category.name}</strong><br>
      ${nftItem.description.icon} ${nftItem.description.value}
      `;
      element.appendChild(details);
      
      // 확대,축소,테두리 색상변경 처리.
      element.addEventListener("click", () => {
        // object[i]를 object 변수에 할당하는 이유:
        // - 각 객체별(object[i])로 userData를 활용하여 개별적인 상태를 저장하고 관리하기 위함.
        const object = objects[i];
      
        // [1] 이미 애니메이션 중이면 실행하지 않음 (중복 클릭 방지)
        // •  아래의 userData는 Three.js의 Object3D 내부에 존재하는 고유 객체
        // •	Mesh, Group, Camera, Light 등 모든 Object3D의 하위 객체에 userData가 기본으로 내장됨
        // •	userData는 기본적으로 빈 객체 {}이지만, 사용자가 원하는 데이터를 추가할 수 있음
        // •  현재는 확대/축소 및 변화하는 애니메이션만 담고자 함.

        if (object.userData.isAnimating) return;
        object.userData.isAnimating = true; // 애니메이션 실행 중 상태 설정
      
        // [2] 현재 확대 상태 확인 (없으면 기본값 false)
        object.userData.isExpanded = object.userData.isExpanded ?? false;
      
        // [3] 원래 크기 & 확대 크기 정의
        const originalScale = { x: 1, y: 1, z: 1 }; // 기본 크기
        const expandedScale = { x: 1.3, y: 1.2, z: 1.3 }; // 확대 크기
      
        // [4] 현재 상태(isExpanded)에 따라 목표 크기 설정
        // - isExpanded = true (확대된 상태) -> 원래 크기로 돌아감
        // - isExpanded = false (축소된 상태) -> 확대 크기로 변경
        const targetScale = object.userData.isExpanded ? originalScale : expandedScale;
      
        // [5] 애니메이션 실행 (확대 & 축소)
        new TWEEN.Tween(object.scale, group) // 객체의 scale 값을 애니메이션 적용
          .to(targetScale, 700) // 700ms 동안 변화
          .easing(TWEEN.Easing.Quartic.Out) // 부드럽게 감속
          .onComplete(() => {
            object.userData.isAnimating = false; // 애니메이션 종료 후 상태 초기화
            object.userData.isExpanded = !object.userData.isExpanded; // 확대 여부 변경
          })
          .start();

          // [6] 테두리 효과 추가 -> 트윈에서 테두리 효과가 먹지 않음으로 css만으로 처리하였다.
          if (!object.userData.isExpanded) {
            // [6-1] 확대될 때 빨간 테두리 추가
            element.style.border = "3px solid red";
            element.style.transition = "border-color 0.5s ease-in-out, border-width 0.5s ease-in-out"; // 부드러운 변화 적용
          } else {
            // [6-2] 축소될 때, 테두리를 점점 투명하게 변경 후 검정색 유지
            element.style.borderColor = "black"; // 테두리 색상을 검정으로 변경
            element.style.borderWidth = "2px"; // 테두리 두께를 원래대로 줄임
          }
      });

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