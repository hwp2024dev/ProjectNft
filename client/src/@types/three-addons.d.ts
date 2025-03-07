declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera, EventDispatcher, MOUSE, Vector3 } from 'three';

  export class OrbitControls extends EventDispatcher {
    constructor(object: Camera, domElement: HTMLElement);

    object: Camera;
    domElement: HTMLElement;

    enabled: boolean;
    target: Vector3;
    minDistance: number;
    maxDistance: number;
    minZoom: number;
    maxZoom: number;
    minPolarAngle: number;
    maxPolarAngle: number;
    enableDamping: boolean;
    dampingFactor: number;
    enableZoom: boolean;
    zoomSpeed: number;
    enableRotate: boolean;
    rotateSpeed: number;
    enablePan: boolean;
    panSpeed: number;
    screenSpacePanning: boolean;
    autoRotate: boolean;
    autoRotateSpeed: number;

    update(): void;
    dispose(): void;
  }
}
declare module 'three/examples/jsm/libs/tween.module.js' {
  export default class TWEEN {
    static update(time?: number): boolean;
  }
}

declare module 'three/examples/jsm/controls/TrackballControls' {
  import { Camera, EventDispatcher, Vector3 } from 'three';

  export class TrackballControls extends EventDispatcher {
    constructor(camera: Camera, domElement: HTMLElement);

    object: Camera;
    domElement: HTMLElement;

    // 사용자 설정 가능한 속성
    enabled: boolean;
    screen: { left: number; top: number; width: number; height: number };
    rotateSpeed: number;
    zoomSpeed: number;
    panSpeed: number;
    noRotate: boolean;
    noZoom: boolean;
    noPan: boolean;
    staticMoving: boolean;
    dynamicDampingFactor: number;
    minDistance: number; // 추가된 속성
    maxDistance: number; // 추가된 속성
    keys: string[];

    // 메서드
    update(): void;
    reset(): void;
    dispose(): void;

    checkDistances(): void;
    zoomCamera(): void;
    panCamera(): void;
    rotateCamera(): void;
  }
}

declare module 'three/examples/jsm/renderers/CSS3DRenderer' {
  import { Object3D, Scene, Camera } from 'three';

  export class CSS3DObject extends Object3D {
    constructor(element: HTMLElement);
    element: HTMLElement;
  }

  export class CSS3DSprite extends CSS3DObject {
    constructor(element: HTMLElement);
  }

  export class CSS3DRenderer {
    domElement: HTMLElement;

    constructor();

    getSize(): { width: number; height: number };
    render(scene: Scene, camera: Camera): void;
    setSize(width: number, height: number): void;
  }
}