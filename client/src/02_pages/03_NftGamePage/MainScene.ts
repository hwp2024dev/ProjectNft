import Phaser from "phaser";
import axios from "axios";

export interface IItem {
  itemId: string;
  itemName: string;
  type: string;
  emoji?: string;
  quantity: number;
  price: string;
  username: string;
}

export class MainScene extends Phaser.Scene {
  private map!: Phaser.Tilemaps.Tilemap;
  private tileset!: Phaser.Tilemaps.Tileset;
  private groundLayer!: Phaser.Tilemaps.TilemapLayer;
  private player!: Phaser.Physics.Arcade.Sprite;
  private monster!: Phaser.Physics.Arcade.Sprite;
  private monsterHealth = 200;

  private healthBar!: Phaser.GameObjects.Graphics;
  private healthBarText!: Phaser.GameObjects.Text;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private messageText!: Phaser.GameObjects.Text;

  private inventoryText!: Phaser.GameObjects.Text;
  private inventoryVisible: boolean = false; // 인벤토리 창 상태

  private parrySuccess: boolean = false; // 맴버변수 선언. 외부접근 금지
  // 패링 후 공격 보너스 스택 변수 추가 (초기값 0)
  private parryBonusMultiplier: number = 0;

  private finisherKey!: Phaser.Input.Keyboard.Key;
  private commandSequence: string[] = [];
  private lastCommandTime: number = 0;

  // 정지
  private isPaused: boolean = false;
  private pauseText!: Phaser.GameObjects.Text;

  // 게임 내 메시지 출력 함수 추가
  private showMessage(text: string, duration: number = 2000) {
    if (this.messageText) {
        this.messageText.setText(text);
        this.messageText.setVisible(true);

        this.time.delayedCall(duration, () => {
            this.messageText.setVisible(false);
        });
    }
  }

  constructor() {
    super({ key: "MainScene" });
    this.inventory = [];  // 생성자에서 빈 배열로 초기화
  }

  initializeInventory() {
      // 유저 정보 가져오기 (세션에서 user 데이터 확인)
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");

      if (!userData || !userData.username) {
          console.warn("계정 정보 없음. 인벤토리 로드 불가");
          this.showMessage("로그인이 필요합니다. My Page에서 로그인해주세요!", 3000);
          return;
      }

      // 로그인된 유저 확인
      console.log("로그인된 계정:", userData.username);

      // 이전 세션에서 저장된 인벤토리 불러오기
      const savedInventory = JSON.parse(sessionStorage.getItem("inventory") || "[]");
      this.inventory = savedInventory;
      this.updateInventoryUI();
      console.log("게임 시작: 이전 세션 인벤토리 불러옴:", savedInventory);
  }

  async loadUserInventory() {
    try {
        // 세션에서 유저 정보 가져오기
        const userData = JSON.parse(sessionStorage.getItem("user") || "{}");

        if (!userData || !userData.account) {  // `account` 필드 확인
            console.warn("유저 정보 없음. 인벤토리 요청 불가");
            alert("로그인이 필요합니다. My Page에서 로그인해주세요!");
            return;
        }

        const account = userData.account;  // `account` 값 가져오기

        console.log("인벤토리 요청: 계정명:", account);

        // DB에서 유저 계정 기준으로 인벤토리 불러오기
        const response = await axios.get(`http://localhost:5001/api/inventory?account=${account}`);

        if (!response.data.inventory) {
            console.warn("서버에서 받은 인벤토리 데이터가 없습니다.");
            return;
        }

        // 🔹 API 응답 데이터에서 인벤토리 업데이트
        this.inventory = response.data.inventory;

        // 🔹 sessionStorage에도 저장하여 빠른 접근 가능
        sessionStorage.setItem("inventory", JSON.stringify(this.inventory));

        console.log("서버에서 인벤토리 불러옴:", this.inventory);

        // UI 업데이트
        this.updateInventoryUI();
    } catch (error) {
        console.error("인벤토리 불러오기 실패:", error);
        alert("인벤토리를 불러오는 중 문제가 발생했습니다. 네트워크 상태를 확인해주세요.");
    }
  }

  // 1. 이미지, 맵, 애니메이션 등의 리소스를 사전 로드
  preload() {
    // 무기 이미지 로드
    this.load.image("Esword", "/src/03_assets/images/0.{png,jpg,jpeg,svg}");
    this.load.image("mace", "/src/03_assets/images/1.{png,jpg,jpeg,svg}");

    // 타일셋 맵 로드
    this.load.image("tileset_dungeon", "/sprites/tileset_dungeon.png");
    this.load.tilemapTiledJSON("map", "/sprites/test.json");
    
    // 플레이어 스프라이트 로드
    this.load.spritesheet("player_idle", "/sprites/IDLE.png", {frameWidth: 96, frameHeight: 84,});
    this.load.spritesheet("player_walk", "/sprites/WALK.png", {frameWidth: 96, frameHeight: 84,});
    this.load.spritesheet("player_attack", "/sprites/ATTACK1.png", {frameWidth: 96, frameHeight: 84,});
    this.load.spritesheet("player_defend", "/sprites/DEFEND.png", {frameWidth: 96, frameHeight: 84,});

    // 몬스터 스프라이트 로드
    this.load.spritesheet("monster_idle", "/sprites/MIDLE.png", {frameWidth: 320, frameHeight: 320,});
    this.load.spritesheet("monster_walk", "/sprites/MWALK.png", {frameWidth: 320, frameHeight: 320,});
  }
  // 2. 게임 오브젝트(맵, 플레이어 몬스터)를 생성하는 단계
  create() {
    this.initializeInventory(); // 게임 실행 시 인벤토리 불러오기
    this.loadUserInventory(); // 게임 실행 시 DB에서 인벤토리 불러오기

     // 기존 이벤트 리스너 제거 후 다시 추가 (중복 방지)
     window.removeEventListener("inventoryUpdated", () => this.updateInventoryUI());
     window.addEventListener("inventoryUpdated", () => this.updateInventoryUI());
     
    // **sessionStorage에서 인벤토리 불러오기**
    const savedInventory = sessionStorage.getItem("inventory");
    this.inventory = savedInventory ? JSON.parse(savedInventory) : [];

    console.log("게임 시작 시 인벤토리 로드:", this.inventory);

    // **인벤토리 UI 생성 (한 번만)**
    this.inventoryText = this.add.text(
      this.cameras.main.width / 2 - 250, 
      this.cameras.main.height / 2 - 100, 
      "인벤토리: 없음", 
      {
          fontSize: "12px",
          color: "white",
          backgroundColor: "rgba(0, 0, 0, 0.5)",
          padding: { x: 10, y: 5 },
      }
    )
    .setScrollFactor(0)
    .setOrigin(0.5)
    .setDepth(1000)
    .setVisible(false);

    // UI 강제 업데이트 (게임 시작 시에도 반영되도록)
    this.updateInventoryUI();

    // **sessionStorage 변경 감지 리스너 추가**
    window.addEventListener("storage", () => {
      console.log("sessionStorage 변경 감지됨");
      this.updateInventoryUI();
    });

    // **"I" 키 입력 감지 → 인벤토리 토글**
    this.input.keyboard.on("keydown-I", async () => {
      this.inventoryVisible = !this.inventoryVisible;
      this.inventoryText.setVisible(this.inventoryVisible);
      
      if (this.inventoryVisible) {
          await this.loadUserInventory(); // 최신 인벤토리 동기화
      }
      
      console.log(`📦 인벤토리 ${this.inventoryVisible ? "열림" : "닫힘"}`);
    });

    // 키 입력 등록
    this.cursors = this.input.keyboard.createCursorKeys();
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
    this.defendKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);
    this.finisherKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);

    this.input.keyboard.on("keydown", (event: KeyboardEvent) => {
      this.handleCommandInput(event);
    });

    // 화면 크기 가져오기
    const screenWidth = this.scale.width;
    const screenHeight = this.scale.height;

    // 폰트 크기 동적 계산
    const baseFontSize = 12;
    let dynamicFontSize = Math.max(16, Math.min(40, baseFontSize * (screenWidth / 800)));

    this.inventoryText = this.add.text(this.cameras.main.width / 2 - 250, this.cameras.main.height / 2 - 100, "인벤토리: 없음", {
        fontSize: "12px",
        color: "white",
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        padding: { x: 10, y: 5 },
    })
    .setScrollFactor(0)  // 카메라 이동 영향 안 받음
    .setOrigin(0.5)      // 중앙 정렬
    .setDepth(1000)      // UI가 최상단에 보이도록 설정
    .setVisible(false);  // 기본적으로 숨겨두기 (I 키로 토글)

    // 화면 크기 변경 시 위치 업데이트
    this.scale.on("resize", () => {
        this.inventoryText.setX(this.cameras.main.width / 2);  // 화면 중앙 정렬 유지
        this.inventoryText.setY(this.cameras.main.height / 2);
    });

    // **메시지 텍스트 생성 (초기 중앙 배치)** -> 메세지 텍스트 위치 조정
    this.messageText = this.add.text(screenWidth / 2, screenHeight / 2.3, "", {
        fontSize: `${dynamicFontSize}px`,
        color: "black",
        fontStyle: "bold"
    })
    .setOrigin(0.5)
    .setScrollFactor(0) // UI 고정 (카메라 영향 안 받음)
    .setDepth(1000) // UI 우선순위 보장
    .setVisible(true)
    .setX(this.cameras.main.width / 2) // 화면 중앙 정렬
    .setY(this.cameras.main.height / 2 - 50) // 살짝 위로 배치
    .setOrigin(0.5); // 정가운데 정렬

    // **화면 크기 변경 시 UI 자동 조정**
    this.scale.on("resize", (gameSize: { width: number; height: number }) => {
        // 🔹 새로운 폰트 크기 계산 (최소 16px, 최대 40px)
        dynamicFontSize = Math.max(16, Math.min(40, baseFontSize * (gameSize.width / 800)));

        this.messageText.setStyle({ fontSize: `${dynamicFontSize}px` });
        this.cameras.main.centerOn(this.player.x, this.player.y);

        this.cameras.main.setZoom(3);  // 화면 크기 변경 시 동일한 줌 적용

        this.inventoryText.setPosition(this.cameras.main.width / 2 - 1000, this.cameras.main.height / 2);
    });

    // 정지 -> Pause 텍스트 추가 (처음엔 숨김)
    this.pauseText = this.add.text(this.scale.width / 2, this.scale.height / 2, "PAUSED", {
      fontSize: "40px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#000000",
      strokeThickness: 6,
    })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(1000)
    .setVisible(false);

    this.input.keyboard.on("keydown-P", () => {
      this.togglePause();
    });
    

    // ** 1. 맵 설정 **

    // 타일맵 로드
    this.map = this.make.tilemap({ key: "map" });
    // 타일셋 로드
    this.tileset = this.map.addTilesetImage("tileset_dungeon", "tileset_dungeon", 32, 32, 1, 1);
    // Ground 레이어 확인 및 생성
    this.groundLayer = this.map.createLayer("Tile Layer 1", this.tileset, 0, 0);
    // 충돌 적용
    this.groundLayer.setCollisionByProperty({ collides: true });

    // 카메라 설정
    this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    this.cameras.main.centerOn(this.map.widthInPixels / 2, this.map.heightInPixels / 2);

    // 뷰포트 설정 추가 (줌 없이 특정 영역 확대)
    this.cameras.main.setZoom(3);  // 화면 크기 변경 시 동일한 줌 적용

    // ** 2. 애니메이션 설정**
    
    // 플레이어 애니메이션
    this.anims.create({
      key: "player_idle",
      frames: this.anims.generateFrameNumbers("player_idle", { start: 0, end: 6 }),
      frameRate: 5,
      repeat: -1
    });

    this.anims.create({
      key: "player_walk",
      frames: this.anims.generateFrameNumbers("player_walk", { start: 0, end: 6 }),
      frameRate: 10,
      repeat: -1
    });

    this.anims.create({
      key: "player_attack",
      frames: this.anims.generateFrameNumbers("player_attack", { start: 0, end: 5}),
      frameRate: 10,
      repeat: 0,
    });

    this.anims.create({
      key: "player_defend",
      frames: this.anims.generateFrameNumbers("player_defend", { start: 0, end: 5}),
      frameRate: 10,
      repeat: 0,
    });

    // 몬스터 애니메이션
    this.anims.create({
      key: "monster_idle",
      frames: this.anims.generateFrameNumbers("monster_idle", { start: 0, end: 6 }),
      frameRate: 5,
      repeat: -1,
    });

    this.anims.create({
      key: "monster_walk",
      frames: this.anims.generateFrameNumbers("monster_walk", { start: 0, end: 6 }), // 2560크기 프레임화
      frameRate: 10,
      repeat: -1,
    });

    // 맵의 가로, 세로 픽셀 크기 가져오기
    const mapWidth = this.map.widthInPixels;
    const mapHeight = this.map.heightInPixels;

    this.cameras.main.centerOn(mapWidth / 2, mapHeight / 2); // 카메라 중앙 정렬

    // 캐릭터의 시작 좌표 설정 (맵의 중앙)
    const startX = mapWidth / 2 - 15;
    const startY = mapHeight / 2 - 84;
    

    // 플레이어 생성(증앙 배치!)
    this.player = this.physics.add.sprite(startX, startY, "player_idle");
    this.player.setGravityY(30000); // 중력 설정
    this.player.setSize(20, 20); // 충돌 박스 크기 조정
    this.player.setOffset(40, 30); // 충돌 박스 위치 조정

    // 플레이어 계정명 반영
    const myPageUserN = sessionStorage.getItem("user");
    const myPageName = JSON.parse(myPageUserN);
    this.player.name = this.add.text(0, 0, myPageName.username, {
      fontSize: '20px', fill: '#fff',
      fontStyle: 'bold', // 텍스트를 굵게
      stroke: '#000', // 스트로크 색상
      strokeThickness: 1 // 스트로크 두께
    });

    // UI가 고정되도록 설정
    this.inventoryText.setScrollFactor(0);

    // 카메라가 플레이어 따라가도록 설정
    this.cameras.main.startFollow(this.player);
    
    // 카메라 중앙 설정
    this.cameras.main.centerOn(startX, startY);
    
    if (!this.player) {
      console.error("플레이어 스프라이트 생성 실패!");
      return;
    }
    console.log("플레이어 생성 완료!", this.player);

    // 플레이어 생성 완료!
    const monsterX = this.map.widthInPixels / 2 + 100;
    const monsterY = this.map.heightInPixels / 4;
    
    this.monster = this.physics.add.sprite(monsterX, monsterY, "monster_walk");
    this.monster.setScale(0.4);
    this.monster.setSize(100, 180);
    this.monster.setOffset(60, 100);
    this.monster.setGravityY(500);
    this.monster.setImmovable(true); // 몬스터를 충돌 후 밀리지 않도록 설정
    this.monster.setVelocityX(-80); // 처음엔 왼쪽으로 이동
    this.monster.play("monster_walk");
    
    // **체력바 생성**
    this.healthBar = this.add.graphics();
    this.updateHealthBar();
    
    // 바닥과 충돌 설정 (플레이어와 동일하게)
    this.groundLayer.setCollisionByProperty({ collides: true });
    this.physics.add.collider(this.monster, this.groundLayer);

    this.physics.add.collider(this.player, this.monster, () => {
      console.log("충돌 발생!");
      
      // **공격 여부 확인**
      const isAttacking = this.player.anims.currentAnim?.key === "player_attack";

      if (isAttacking) {
          let damage = Phaser.Math.Between(3, 5);
          let isMiss = Math.random() < 0.1;

          if (isMiss) {
              this.showDamageText('❌ 공격이 빗나갔다!!', this.monster.x - 70, this.monster.y - 40, true);
              this.showDamageText(0, this.monster.x, this.monster.y + 10);
              return;
          }

          if (this.parrySuccess) {
            // 패링 후 공격 시 3배 + 추가 스택 (소수점 올림 적용)
            let critDamage = Math.ceil(damage * (3 + this.parryBonusMultiplier));
            this.monsterHealth -= critDamage;

            this.showDamageText(critDamage, this.monster.x - 20, this.monster.y + 10);
            this.showDamageText('💥 Critical Hit!!', this.monster.x - 130, this.monster.y - 30, true);

            // 패링 보너스 0.5배씩 증가 (누적됨)
            this.parryBonusMultiplier += 0.5;

            this.parrySuccess = false; // 패링 효과 초기화 (공격 후 다시 패링해야 적용)
          } else {
              console.log("⚔️ 일반 공격 성공!");
              this.monsterHealth -= damage;
              this.showDamageText(damage, this.monster.x, this.monster.y + 10);
          }

          if (this.monsterHealth <= 0) {
              this.monsterHealth = 0;
              console.log("☠️ 몬스터가 쓰러졌다!");
              this.showDamageText('💀 몬스터 사망!', this.monster.x, this.monster.y - 40, true);
              this.monsterDeathEffect();
              return;
          }

          if (!isMiss) {
              let blinkCount = 2;
              this.time.addEvent({
                  delay: 100,
                  repeat: blinkCount,
                  callback: () => {
                      if (this.monster.tintTopLeft === 0xff0000) {
                          this.monster.clearTint();
                      } else {
                          this.monster.setTint(0xff0000);
                      }
                  },
              });
          }

          this.updateHealthBar();
      }

      // **패링 여부 확인**
      const isParrying = this.player.anims.currentAnim?.key === "player_defend";

      if (isParrying) {
          console.log("패링 성공! 몬스터가 밀려남!");
          this.showDamageText('🛡️ 패링', this.monster.x, this.monster.y - 40, true);

          this.monsterHealth = Math.max(0, this.monsterHealth - 1);
          this.showDamageText(1, this.monster.x, this.monster.y + 10);

          if (this.parryTimeout) {
              this.parryTimeout.remove();
          }

          this.parryTimeout = this.time.delayedCall(1500, () => {
              this.parrySuccess = false;
              console.log("⚠️ 패링 효과가 끝났다...");
              this.showDamageText('⏳ 패링 해제!!', this.monster.x - 50, this.monster.y - 40, true);
          });

          if (this.monsterHealth <= 0) {
              this.monsterHealth = 0;
              this.showDamageText('💀 몬스터 사망!', this.monster.x, this.monster.y - 40, true);
              this.monsterDeathEffect();
              return;
          }

          // 패링 효과: 밀려남
          const pushBackForce = 70 + Math.random() * 130;
          this.tweens.add({
              targets: this.player,
              x: this.player.x + (this.player.flipX ? pushBackForce : -pushBackForce),
              duration: 500,
              ease: "Power2",
              onUpdate: () => {
                  // 닉네임 위치를 계속 갱신
                  this.player.name.setPosition(
                      this.player.x - this.player.name.width / 2,
                      this.player.y - this.player.name.height - 30
                  );
              },
              onComplete: () => {
                  console.log("패링 후 위치 조정 완료");
              }
          });
          const monsterSpeedAfterParry = 50 + Math.random() * 70;
          const monsterMovingLeft = this.monster.body.velocity.x < 0;

          console.log(`몬스터가 ${pushBackForce.toFixed(0)} 만큼 밀려나고, 이후 속도 ${monsterSpeedAfterParry.toFixed(0)}`);

          this.monster.setVelocityX(monsterMovingLeft ? pushBackForce : -pushBackForce);
          this.monster.setTint(0xff0000);

          this.time.delayedCall(200, () => this.monster.setTint(0xffffff));
          this.time.delayedCall(500, () => {
              this.monster.setVelocityX(monsterMovingLeft ? -monsterSpeedAfterParry : monsterSpeedAfterParry);
          });

          console.log("패링이 유지되는 중...");
          this.updateHealthBar();
          this.parrySuccess = true;
          return;
      }

      // **일반 충돌 처리 (공격/패링이 아닌 경우)**
      console.log("일반 충돌: 플레이어가 밀려남");
  
      // 플레이어가 랜덤한 거리로 밀려남
      const playerPushForce = 70 + Math.random() * 80; // 70 ~ 150 랜덤
      this.isBeingPushed = true;
      this.time.delayedCall(0, () => this.isBeingPushed = false);
      const playerFacingLeft = this.player.flipX;
      let newX = this.player.x + (this.monster.body.velocity.x < 0 ? -playerPushForce : playerPushForce);
      
      this.tweens.add({
          targets: this.player,
          x: newX,
          duration: 500,
          ease: "Power2",
          onUpdate: () => {
            // 닉네임 위치를 계속 갱신
            this.player.name.setPosition(
                this.player.x - this.player.name.width / 2,
                this.player.y - this.player.name.height - 30
            );
          },
          onComplete: () => this.player.setFlipX(playerFacingLeft),
      });
  
      const monsterSpeed = 15;
      this.monster.setVelocityX(this.monster.body.velocity.x < 0 ? -monsterSpeed : monsterSpeed);
      this.player.setTint(0xff0000);
      this.time.delayedCall(150, () => {
          this.monster.setTint(0xffffff);
          this.player.setTint(0xffffff);
      });
  
      // 체력바 업데이트
      this.updateHealthBar();
    });

    // 플레이어 키보드 입력 등록 (스페이스바)
    this.cursors = this.input.keyboard.createCursorKeys();
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z)
    this.defendKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.X);

    // 플레이어 애니메이션 실행
    this.player.play("player_idle");

    // 카메라가 플레이어 따라가도록 설정
    this.cameras.main.startFollow(this.player);

    // 충돌 설정
    this.physics.add.collider(this.player, this.groundLayer);

    // 키보드 입력 받기
    this.cursors = this.input.keyboard.createCursorKeys();
  }
  
  updateMyPageUI() {
    let inventory = JSON.parse(sessionStorage.getItem("inventory") || "[]");
    let myPageInventory = document.getElementById("myPageInventory");

    if (!myPageInventory) return;

    // 기존 목록 삭제 후 새로 렌더링
    myPageInventory.innerHTML = "";

    inventory.forEach(item => {
        let itemElement = document.createElement("div");
        itemElement.textContent = `${item.name} (x${item.count})`; // 개수 표시
        myPageInventory.appendChild(itemElement);
    });

    console.log("마이페이지 UI 업데이트됨:", inventory);
  }

  handleCommandInput(event: KeyboardEvent) {
    const now = this.time.now; // `Date.now()` 대신 `this.time.now` 사용
    if (now - this.lastCommandTime > 3000) {
        this.commandSequence = []; // 3초 지나면 입력 리셋
    }
    this.lastCommandTime = now; // `now`로 업데이트

    const keyMap: { [key: string]: string } = {
        ArrowDown: "↓",
        ArrowRight: "→",
        z: "Z" // `z`를 `Z`로 변환해야 함
    };

    const keyPressed = keyMap[event.key];
    if (keyPressed) {
        this.commandSequence.push(keyPressed);
    }
    console.log(`입력된 키: ${event.key}, 변환된 키: ${keyPressed}`);
    console.log(`현재 커맨드 입력: ${this.commandSequence.join(" ")}`);
    // `slice(-3)`로 최근 3개만 확인 → 중간에 다른 입력 들어가도 괜찮음
    if (this.commandSequence.slice(-6).join(" ") === "↓ ↓ ↓ ↓ ↓ Z") {
        this.executeFinisher();
        this.commandSequence = [];
    }
  }

  executeFinisher() {

    // 빨간 화면 연출 추가
    const yelllowScreen = this.add.graphics();
    yelllowScreen.fillStyle(0xffff00, 0.5); // 노랑색, 50% 투명도
    yelllowScreen.fillRect(0, 0, this.scale.width, this.scale.height);
    yelllowScreen.setScrollFactor(0); // 화면 고정

    // 0.5초 후 점점 사라짐
    this.tweens.add({
        targets: yelllowScreen,
        alpha: 0,
        duration: 500,
        ease: "Linear",
        onComplete: () => yelllowScreen.destroy() // 삭제
    });

    // 몬스터 체력 깎기
    this.monsterHealth -= 200;
    this.showDamageText(200, this.monster.x, this.monster.y + 10);
    this.showDamageText("🔥 필살기!!", this.monster.x, this.monster.y - 40, true);
    this.cameras.main.shake(500, 0.01); // 화면 흔들기 추가

    // 몬스터 사망 체크
    if (this.monsterHealth <= 0) {
        this.monsterHealth = 0;
        this.monsterDeathEffect();
    }
    this.updateHealthBar();
  }

  // 3. 몬스터가 공격당할 때 체력 감소
  monsterHit(damage: number) {
    this.monsterHealth -= damage;
    if (this.monsterHealth <= 0) {
        this.monsterHealth = 0;
        this.monsterDeathEffect(); // 사라지는 효과 적용!
        console.log("몬스터가 쓰러졌다!");
    }
    this.updateHealthBar();
  }
  private monsterIsDead: boolean = false;

  // 4. 몬스터가 죽었을때 효과.
  monsterDeathEffect() {
    if (this.monsterIsDead) return;
    this.monsterIsDead = true;

    this.tweens.add({
        targets: this.monster,
        alpha: 0,
        duration: 1000,
        onComplete: () => {
            setTimeout(() => {
                if (this.monster) {
                    console.log("몬스터 완전 삭제!");
                    this.monster.destroy();
                    this.monster = null;
                }

                if (this.healthBar) {
                    console.log("체력바 삭제!");
                    this.healthBar.clear();
                }
                if (this.healthBarText) {
                    this.healthBarText.destroy();
                }
            }, 50);
        }
    });

    // **충돌 제거**
    if (this.monsterCollider) {
        this.physics.world.removeCollider(this.monsterCollider);
        this.monsterCollider = null;
    }

    this.dropItem();
  }

  // 5. 아이템 획득 시스템
  dropItem() {
    console.log("🎁 아이템 드롭 시도...");
    const dropChance = Math.random();
    // 기본 아이템 아이디 값
    const baseId = dropChance < 0.5 ? "sword_01" : "shield_01";
    // 고유값 추가 (예: 타임스탬프)
    const uniqueId = `${baseId}-${Date.now()}`;
    const droppedItem = dropChance < 0.5
      ? { 
          itemId: uniqueId, 
          itemName: "검", 
          type: "Weapon", 
          emoji: "⚔️", 
          quantity: 1,
          price: "100"  
        }
      : { 
          itemId: uniqueId, 
          itemName: "방패", 
          type: "Shield", 
          emoji: "🛡️", 
          quantity: 1,
          price: "50"    
        };
  
    console.log("아이템 획득:", droppedItem);
    this.saveItemToDB(droppedItem);
  }
  
  async saveItemToDB(item: IItem): Promise<void> {
    try {
      const userData = JSON.parse(sessionStorage.getItem("user") || "{}");
      if (!userData || !userData.account) {
        console.error("계정 정보가 없음. 저장 불가");
        alert("로그인 후 아이템을 저장할 수 있습니다.");
        return;
      }
      const account = userData.account;
      console.log("아이템 저장 요청:", { account, item });
      
      const response = await axios.post("http://localhost:5001/api/inventory/add-item", {
        account: account,
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        emoji: item.emoji,   // emoji 필드 추가
        price: item.price      // price 필드 추가
        // type 필드가 필요하면 여기에 추가 (예: type: item.type)
      });
      console.log("아이템 저장 성공 (서버 응답):", response.data);
      this.updateSessionStorage(item);
    } catch (error) {
      console.error("아이템 저장 실패:", error);
    }
  }
  
  updateSessionStorage(item: IItem): void {
    // sessionStorage에서 기존 인벤토리 불러오기
    let inventory: IItem[] = JSON.parse(sessionStorage.getItem("inventory") || "[]");
  
    // 기존 아이템이 있는지 확인 (itemId 기준)
    const existingItem = inventory.find((i: IItem) => i.itemId === item.itemId);
    if (existingItem) {
      existingItem.quantity += item.quantity;
      // price 업데이트 (예: 누적 수량에 따라 price 값도 업데이트)
      // price 값은 상황에 맞게 업데이트 로직을 적용할 수 있습니다.
      // 여기서는 단순히 기존 price 값에 덮어씌우는 예시입니다.
      existingItem.price = item.price;
    } else {
      inventory.push({
        itemName: item.itemName,
        type: item.type,
        quantity: item.quantity,
        emoji: item.emoji || "",
        price: item.price
      });
    }
  
    sessionStorage.setItem("inventory", JSON.stringify(inventory));
    this.inventory = inventory;
    this.updateInventoryUI();
  }

  // **인벤토리 UI 업데이트**
  updateInventoryUI() {
    if (!this.inventoryText) return;

    console.log("인벤토리 UI 업데이트 중...", this.inventory);

    if (!this.inventory || this.inventory.length === 0) {
        this.inventoryText.setText("인벤토리: 없음");
    } else {
        const inventoryTextContent = this.inventory
            .map(item => `ㆍ ${item.itemName} ×${item.quantity}`) // 아이템 이름 + 개수 표시
            .join("\n");

        this.inventoryText.setText(`📦 인벤토리\n${inventoryTextContent}`);
    }
  }

  // 7. 체력바 갱신
  updateHealthBar() {
    // **몬스터가 삭제된 경우 체력바 업데이트 방지**
    if (!this.monster) {
        return;
    }

    this.healthBar.clear();
    
    // 몬스터의 최대 체력 설정
    const maxMonsterHealth = 200; 

    // 기존 체력바 텍스트 제거 (잔상 방지)
    if (this.healthBarText) {
        this.healthBarText.destroy();
    }

    // **체력바 위치 및 크기 조정**
    const healthBarWidth = 100; // 체력바 길이 적절히 조정
    const healthBarHeight = 12; // 기존보다 살짝 두껍게
    const healthBarX = this.monster.x - 30;
    const healthBarY = this.monster.y - 70; // 위치 조정 (너무 위로 안 가도록)

    // 체력바 그래픽 초기화 (기존 잔상 제거)
    this.healthBar.clear();

    // 배경 검은색 (체력바 틀)
    if (this.monsterHealth > 0) { // 체력 0일 때는 안 보이게 처리
        this.healthBar.fillStyle(0x000000);
        this.healthBar.fillRect(healthBarX, healthBarY, healthBarWidth, healthBarHeight);
    }

    // 현재 체력에 비례한 체력바 크기 계산
    const currentHealthWidth = Math.max((this.monsterHealth / maxMonsterHealth) * healthBarWidth, 0);

    // 체력바 빨간색 (현재 체력 반영)
    if (this.monsterHealth > 0) {
        this.healthBar.fillStyle(0xff0000);
        this.healthBar.fillRect(healthBarX, healthBarY, currentHealthWidth, healthBarHeight);
    }

    // **체력 수치를 체력바 위에 표시 (기존 텍스트 제거 후 새로 생성)**
    this.healthBarText = this.add.text(
        healthBarX + healthBarWidth / 2, 
        healthBarY - 15, 
        `${this.monsterHealth} / ${maxMonsterHealth}`, 
        {
            fontSize: "14px",
            color: "#ffffff",
            fontWeight: "bold",
            stroke: "#000000",
            strokeThickness: 3
        }
    ).setOrigin(0.5);
  }

  // 8. 도트 데미지 표시 + 크리티컬 시 카메라 흔들기!
  showDamageText(amount: number | string, x: number, y: number, isStatus: boolean = false) {
    const offsetY = isStatus ? -40 : 10; // 상태 메시지는 위로, 대미지는 아래로

    // 크리티컬 히트 체크 (숫자 크리티컬 or "Critical Hit!!" 메시지)
    const isCritical = amount === "💥 Critical Hit!!" || (typeof amount === "number" && amount >= 10); // 예: 크리티컬 대미지는 10 이상 가정

    // 텍스트 색상 설정
    const textColor = (amount === "❌ 공격이 빗나갔다!!") 
                      ? "#ffff00"  // MISS → 노란색
                      : isCritical && typeof amount === "number"
                      ? "#ff0000"  // 크리티컬 숫자 데미지 → 빨강
                      : (typeof amount === "number") 
                      ? "#ffffff"  // 일반 숫자 데미지 → 흰색
                      : "#ffff00"; // 상태 이상 메시지 → 노란색

    // 크리티컬이면 폰트 크기 2배 (40px), 기본 20px
    const fontSize = isCritical ? "40px" : "20px"; 

    // 숫자 데미지가 0이면 "0" 표시
    const displayAmount = (typeof amount === "number" && amount === 0) ? "0" : amount;

    const damageText = this.add.text(x, y + offsetY, `${displayAmount}`, {  
        font: `${fontSize} Arial`, // 크리티컬이면 글씨 크기 2배!
        color: textColor, 
        fontWeight: "bold",
        stroke: "#000000",
        strokeThickness: 3,
    });

    this.tweens.add({
        targets: damageText,
        y: y + offsetY - 30, // 위로 자연스럽게 떠오름
        alpha: 0,  // 서서히 사라짐
        duration: 2400,
        ease: "Power1",
        onComplete: () => damageText.destroy(),
    });

    // 크리티컬이면 카메라 흔들기 (강한 타격감 연출!)
    if (isCritical) {
        // 빨간 화면 연출 추가
        const redScreen = this.add.graphics();
        redScreen.fillStyle(0xff0000, 0.5); // 빨간색, 50% 투명도
        redScreen.fillRect(0, 0, this.scale.width, this.scale.height);
        redScreen.setScrollFactor(0); // 화면 고정

        // 0.5초 후 점점 사라짐
        this.tweens.add({
            targets: redScreen,
            alpha: 0,
            duration: 500,
            ease: "Linear",
            onComplete: () => redScreen.destroy() // 삭제
        });

        this.cameras.main.shake(200, 0.0005); // 200ms 동안 0.02 강도로 흔들기
    }
  }

// Pause 기능 함수 수정!
private monsterVelocityBeforePause: number = 0;  // 몬스터 속도 저장 변수 추가!

private togglePause() {
    this.isPaused = !this.isPaused;
    console.log(`게임 상태: ${this.isPaused ? "PAUSED" : "RUNNING"}`);

    if (this.isPaused) {
        // ⏸ 게임 정지
        this.pauseText.setVisible(true);
        this.physics.world.pause();  // 물리 정지
        this.time.paused = true;     // 타이머 정지

        // 몬스터 속도 저장 후 멈추기
        this.monsterVelocityBeforePause = this.monster.body.velocity.x;
        this.monster.setVelocity(0);
        this.monster.anims.pause();

        // 플레이어 멈추기
        this.player.setVelocity(0);
        this.player.anims.pause();

    } else {
        // ▶ 게임 재개
        this.pauseText.setVisible(false);
        this.physics.world.resume();  // 물리 재개
        this.time.paused = false;     // 타이머 재개

        // 멈췄던 애니메이션 재생
        this.player.anims.resume();
        this.monster.anims.resume();

        // 몬스터가 원래 속도로 다시 이동
        this.monster.setVelocityX(this.monsterVelocityBeforePause);
    }
}

// 9. 게임내 로직 처리
update() {
  if (this.isPaused) return;  // 🔹 Pause 상태일 때 업데이트 안 함

  this.updateHealthBar();

  // 몹이 일정 높이 이하로 떨어지면 즉사 처리
  // 몬스터가 바닥 아래로 떨어지면 즉사 처리 + "You Win!" 메시지 표시
  if (this.monster && this.monster.y > this.map.heightInPixels + 50) {
    console.log("몬스터가 바닥 아래로 떨어짐! 체력 0 처리");
    this.monsterHealth = 0;
    this.monsterDeathEffect(); // 즉시 사망 처리
    return;
    }

  // **공격/방어 입력을 먼저 체크**
  if (Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      this.player.anims.play("player_attack", true);
      this.player.setVelocity(0);
      
      this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
        this.player.anims.play("player_idle", true);
      });

      return;
  }

  if (Phaser.Input.Keyboard.JustDown(this.defendKey)) {
      this.player.anims.play("player_defend", true);
      this.player.setVelocity(0);
      
      this.player.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
          this.player.anims.play("player_idle", true);
      });

      return;
  }

  // **공격 또는 방어 애니메이션 중이면 입력 무시**
  const currentAnim = this.player.anims.currentAnim?.key;
  if (currentAnim === "player_attack" || currentAnim === "player_defend") {
      return;
  }

  //플레이어 닉네임 실시간 반영 조정
  if(this.player.name){
      this.player.name.setPosition(this.player.x - this.player.name.width / 2,
      this.player.y - this.player.name.height - 30);   
  }
  
  // **이동 입력 처리**
  this.player.setVelocity(0);
  let moving = false;

  if (this.cursors.left.isDown) {
      this.player.setVelocityX(-100);
      this.player.setFlipX(true);
      if (currentAnim !== "player_walk") {
          this.player.anims.play("player_walk", true);
      }
      moving = true;
  } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(100);
      this.player.setFlipX(false);
      if (currentAnim !== "player_walk") {
          this.player.anims.play("player_walk", true);
      }
      moving = true;
  }

  // **아무 입력이 없으면 Idle 상태로 전환**
  if (!moving && currentAnim !== "player_idle") {
      this.player.anims.play("player_idle", true);
  }
}
}