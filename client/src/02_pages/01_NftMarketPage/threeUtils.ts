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

// Market을 three.js로 처리.
import * as THREE from 'three';
import TWEEN from '@tweenjs/tween.js';
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls';
import { CSS3DRenderer, CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer';
import styles from './NftMarketPage.module.css';
import { fetchRegisteredNFTs } from "./web3Utils";

// 아이템 스마트컨트렉트 처리.
import { uploadItemToBlockchain } from "./web3Utils";

// three.js logic
export function initThreeScene(
  container: HTMLDivElement,
  handleAddToCart: (nftItem: NftItemType) => void,
  handleRemoveFromCart: (nftItem: NftItemType) => void
) {
  let camera: THREE.PerspectiveCamera, scene: THREE.Scene, renderer: CSS3DRenderer, controls: TrackballControls;
  const objects: CSS3DObject[] = [];
  const targets: { table: THREE.Object3D[] } = { table: [] };

  const group = new TWEEN.Group();
  
  interface NFTItem {
    id: string;
    item_id: string;  // 원래 아이템 ID 추가
    type: string;
    category: { name: string; icon: string };
    description: { value: string; icon: string };
    col: number;
    row: number;
    image: string;
    tokenId: number | null;  // 토큰화된 NFT ID
    isUploaded: boolean;
  }

  // `createNFTElement` 함수 정의 (Three.js 내부 UI 생성)
  function createNFTElement(nftItem: NFTItem) {
    if (!nftItem || !nftItem.category) {
      console.error(" NFT 아이템 생성 오류: 잘못된 데이터", nftItem);
      return document.createElement("div"); // 오류 방지용 빈 요소 반환
    }

    const element = document.createElement("div");
    element.className = styles.element;
    element.dataset.nftId = nftItem.itemId;
    
    // 거래중 상태이면 오버레이 생성
    const overlay = document.createElement("div");
    overlay.style.position = "absolute";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.right = "0";
    overlay.style.bottom = "0";
    overlay.style.backgroundColor = "rgba(128,128,128,0.5)";
    overlay.style.display = nftItem.isTrading ? "block" : "none";
    overlay.innerText = nftItem.isTrading ? "거래중" : "";
    
    element.innerHTML = `
      <div class="${styles.symbol}" style="font-size: 40px; text-align: center;">
        ${nftItem.category.icon || "❓"}
      </div>
      <div class="${styles.details}">
        <strong>${nftItem.category.name || "Unknown"}</strong><br>
        ${nftItem.description?.icon || "💰"} ${nftItem.description?.value || "정보 없음"}
      </div>
    `;
    element.appendChild(overlay);

    // Select 버튼 생성
    const selectButton = document.createElement("button");
    selectButton.textContent = "Select";
    selectButton.style.position = "absolute";
    selectButton.style.bottom = "-30px";
    selectButton.style.left = "50%";
    selectButton.style.transform = "translateX(-50%)";
    selectButton.style.padding = "5px 10px";
    selectButton.style.fontSize = "14px";
    selectButton.style.border = "none";
    selectButton.style.borderRadius = "5px";
    selectButton.style.background = "#007bff";
    selectButton.style.color = "#fff";
    selectButton.style.cursor = "pointer";

    // Select 버튼 이벤트 핸들러 추가
    selectButton.addEventListener("click", (event) => {
        event.stopPropagation();
        handleNFTSelection(element);
    });

    // Select 버튼을 NFT 요소에 추가
    console.log("Select 버튼 생성 중:", selectButton);
    element.appendChild(selectButton);
    console.log("Select 버튼 추가 완료!");
    console.log("NFT 추가됨:", nftItem);
    table.push(nftItem);
    console.log("현재 Three.js NFT 목록:", table);

    return element;
  }

  // Three.js 마켓 아이템 업데이트 시 세션 데이터 사용 → 블록체인 등록 데이터만 반영
  window.updateMarketItems = async (updatedMarket) => {
    console.log("Three.js 내부 마켓 데이터 업데이트됨:", updatedMarket);

    const registeredNFTs = await fetchRegisteredNFTs();

    scene.clear();
    objects.length = 0;

    registeredNFTs.forEach((nftItem, index) => {
        console.log("Three.js 아이템 추가됨:", nftItem);

        const element = createNFTElement(nftItem);
        if (!element) {
            console.warn("⚠️ 유효하지 않은 NFT 데이터:", nftItem);
            return;
        }

        const objectCSS = new CSS3DObject(element);
        objectCSS.position.set(
            (index % 10) * 170 - centerX,
            -Math.floor(index / 10) * 205 + centerY,
            0
        );

        scene.add(objectCSS);
        objects.push(objectCSS);
    });

    console.log("Three.js 마켓 UI 업데이트 완료!");
  };

  console.log("Three.js 마켓 UI 초기화 완료!");

  // NFT 데이터 및 이미지 로드
  const images = import.meta.glob('/src/03_assets/images/*.{png,jpg,jpeg,svg}', { eager: true }) as Record<string, { default: string }>;
  const nftImages = Object.values(images).map((mod) => mod.default);

  const cols = 10;
  const rows = 5;
  const spacingX = 170;
  const spacingY = 205;
  const centerX = (cols - 1) * spacingX * 0.5;
  const centerY = (rows - 1) * spacingY * 0.5;

  // session에서 유저 인벤토리 내용을 불러와 업로드 처리 메서드
  function getUserInventoryNFTs(): NFTItem[] {
    let userInventory = JSON.parse(sessionStorage.getItem("inventory") || "[]");
  
    if (!Array.isArray(userInventory)) {
        console.warn("잘못된 인벤토리 데이터:", userInventory);
        return [];
    }
  
    // 토큰화된 아이템만 포함 (또는 모든 아이템 포함하려면 필터 생략)
    // 예: tokenId가 존재하면 포함하도록 할 수 있음
    // userInventory = userInventory.filter(item => item.tokenId != null);
  
    return userInventory.map((item, index) => ({
      id: item.itemId,  // itemId를 그대로 사용 (이미 문자열이어야 함)
      item_id: item.itemId,
      type: item.type,
      category: { 
        name: item.type, 
        icon: item.emoji || (item.type === "Shield" ? "🛡️" : "⚔️")
      },
      description: { value: `${item.quantity} 개 보유`, icon: "💰" },
      col: index % 10 + 1,
      row: Math.floor(index / 10),
      image: item.imageUrl,  // 만약 imageUrl가 없다면 다른 필드 사용
      tokenId: item.tokenId || null,
      isUploaded: item.isUploaded ?? true,
      isTrading: item.isTrading ?? false,  // 거래중 상태를 포함
      name: item.itemName,
      icon: item.emoji,
      price: item.price,
      priceIcon: "💰",
      imageUrl: item.imageUrl,
    }));
  }

  // 기존 table 배열 초기화 후, targets.table도 동일하게 생성
  const table: NFTItem[] = getUserInventoryNFTs();  // 유저 인벤토리만 반영

  // `targets.table`도 동일한 개수로 생성
  targets.table = table.map((_, index) => {
      const object = new THREE.Object3D();
      object.position.set(
          (index % cols) * spacingX - centerX,
          -Math.floor(index / cols) * spacingY + centerY,
          0
      );
      return object;
  });


  const nftData = getUserInventoryNFTs();
  console.log("불러온 NFT 데이터:", nftData);

  let cartItems: Set<string> = new Set();
  window.updateCartItems = (updatedCart) => {
    cartItems = new Set(updatedCart);
    console.log("Three.js 내부 장바구니 업데이트됨:", Array.from(cartItems));
  };

  let selectedItems: Set<string> = new Set();

  function handleNFTSelection(nftElement: HTMLElement) {
    const nftId = nftElement.dataset.nftId;
    console.log(`클릭한 NFT ID: ${nftId}`);

    const nftItem = table.find((item) => item.itemId === nftId);
    console.log("현재 Three.js NFT 목록:", table);

    if (!nftItem) {
        console.warn(`해당 NFT를 찾을 수 없음: ${nftId}`);
        return;
    }

    console.log(`선택 처리 시작: ${nftId}`);

    if (selectedItems.has(nftId)) {
        console.log(`선택 해제: ${nftId}`);
        nftElement.classList.remove("selected");
        selectedItems.delete(nftId);
        handleRemoveFromCart(nftItem);
    } else {
        console.log(`선택됨: ${nftId}`);
        nftElement.classList.add("selected");
        selectedItems.add(nftId);
        handleAddToCart(nftItem);
    }

    console.log("현재 선택된 아이템:", Array.from(selectedItems));
}

  function init() {
    renderer = new CSS3DRenderer();
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 1, 10000);
    camera.position.z = 1500;
    scene = new THREE.Scene();
    controls = new TrackballControls(camera, renderer.domElement);
    controls.minDistance = 500;
    controls.maxDistance = 6000;
    controls.enabled = true;

    window.addEventListener("resize", onWindowResize);

    function createNFTElement(nftItem: NFTItem) {
      if (!nftItem || !nftItem.category) {
          console.error("NFT 아이템 생성 오류: 잘못된 데이터", nftItem);
          return document.createElement("div");
      }
      
      const element = document.createElement("div");
      element.className = styles.element;
      element.dataset.nftId = nftItem.itemId;
  
      const overlay = document.createElement("div");
      overlay.style.position = "absolute";
      overlay.style.top = "0";
      overlay.style.left = "0";
      overlay.style.right = "0";
      overlay.style.bottom = "0";
      overlay.style.backgroundColor = "rgba(128,128,128,0.5)";
      overlay.style.display = nftItem.isTrading ? "block" : "none";
      overlay.innerText = nftItem.isTrading ? "거래중" : "";
  
      element.innerHTML = `
          <div class="${styles.symbol}" style="font-size: 40px; text-align: center;">
              ${nftItem.category.icon || "❓"}
          </div>
          <div class="${styles.details}">
              <strong>${nftItem.category.name || "Unknown"}</strong><br>
              ${nftItem.description?.icon || "💰"} ${nftItem.description?.value || "정보 없음"}
          </div>
      `;
  
      element.appendChild(overlay);
  
      // NFT 전체를 클릭했을 때 선택 반응하도록 이벤트 추가
      element.addEventListener("click", () => {
          console.log("NFT 박스 클릭됨!:", nftItem);
          handleNFTSelection(element);
      });
  
      // Select 버튼 추가
      const selectButton = document.createElement("button");
      selectButton.textContent = "Select";
      Object.assign(selectButton.style, {
          position: "absolute",
          bottom: "-30px",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "5px 10px",
          fontSize: "14px",
          border: "none",
          borderRadius: "5px",
          background: "#007bff",
          color: "#fff",
          cursor: "pointer"
      });
  
      selectButton.addEventListener("click", (event) => {
          event.stopPropagation(); // NFT 박스 클릭과 중복 방지
          console.log(" Select 버튼 클릭됨!:", nftItem);
          handleNFTSelection(element);
      });
  
      element.appendChild(selectButton);
  
      return element;
    }

    for (let i = 0; i < table.length; i++) {
      const nftItem = table[i];
      const element = createNFTElement(nftItem);
      const objectCSS = new CSS3DObject(element);
      
      objectCSS.position.set(
          Math.random() * 4000 - 2000, 
          Math.random() * 4000 - 2000, 
          Math.random() * 4000 - 2000
      );
  
      scene.add(objectCSS);
      objects.push(objectCSS);
    }
  
    console.log("마켓에 유저 아이템 추가 완료!", getUserInventoryNFTs());

    transform(targets.table, 2000);
  }

  function transform(targets: THREE.Object3D[], duration: number) {
    if (targets.length !== objects.length) {
        console.error("transform 오류: objects와 targets 길이가 일치하지 않음", {
            objectsLength: objects.length,
            targetsLength: targets.length,
        });
        return;
    }

    objects.forEach((object, i) => {
        const target = targets[i];

        if (!target) {
            console.warn(`⚠️ transform 스킵: target[${i}]가 undefined!`);
            return;
        }

        new TWEEN.Tween(object.position, group)
            .to({ x: target.position.x, y: target.position.y, z: target.position.z }, duration)
            .easing(TWEEN.Easing.Exponential.InOut)
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
  console.log("Three.js에 추가할 NFT 데이터:", getUserInventoryNFTs());

  // '스마트컨트렉트'에서 톸튼화 된 아이템 정보를 올려주는 로직
  function createUploadButton(nftItem: NFTItem) {
      const button = document.createElement("button");
      button.textContent = "Upload NFT";
      
      button.addEventListener("click", async () => {
          if (nftItem.isUploaded) {
              alert("이미 업로드된 아이템입니다.");
              return;
          }

          button.textContent = "Uploading...";
          const tokenId = await uploadItemToBlockchain(nftItem);
          
          if (tokenId !== null) {
              nftItem.tokenId = tokenId;
              nftItem.isUploaded = true;
              alert(`NFT 업로드 완료! Token ID: ${tokenId}`);
          } else {
              alert("NFT 업로드 실패!");
          }
          button.textContent = "Upload NFT";
      });

      return button;
  }

  return () => {
    window.removeEventListener('resize', onWindowResize);
    container.removeChild(renderer.domElement);
  };
}

