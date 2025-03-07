//tween.js 선언
declare module '@tweenjs/tween.js' {
  export default TWEEN;

  namespace TWEEN {
    class Tween<T> {
      constructor(object: T, group?: Group);
      to(properties: Partial<T>, duration: number): this;
      easing(easingFunction: (k: number) => number): this;
      onStart(callback: () => void): this;
      onUpdate(callback: (object: T) => void): this;
      onComplete(callback: () => void): this;
      start(time?: number): this;
      stop(): this;
    }

    class Group {
      getAll(): Tween<any>[];
      removeAll(): void;
      add(tween: Tween<any>): void;
      remove(tween: Tween<any>): void;
      update(time?: number, preserve?: boolean): boolean;
    }

    const Easing: {
      Linear: {
        None: (k: number) => number;
      };
      Quadratic: {
        In: (k: number) => number;
        Out: (k: number) => number;
        InOut: (k: number) => number;
      };
      Cubic: {
        In: (k: number) => number;
        Out: (k: number) => number;
        InOut: (k: number) => number;
      };
      Quartic: {
        In: (k: number) => number;
        Out: (k: number) => number;
        InOut: (k: number) => number;
      };
      Quintic: {
        In: (k: number) => number;
        Out: (k: number) => number;
        InOut: (k: number) => number;
      };
      Sinusoidal: {
        In: (k: number) => number;
        Out: (k: number) => number;
        InOut: (k: number) => number;
      };
      Exponential: {
        In: (k: number) => number;
        Out: (k: number) => number;
        InOut: (k: number) => number;
      };
      Circular: {
        In: (k: number) => number;
        Out: (k: number) => number;
        InOut: (k: number) => number;
      };
      Elastic: {
        In: (k: number) => number;
        Out: (k: number) => number;
        InOut: (k: number) => number;
      };
      Back: {
        In: (k: number) => number;
        Out: (k: number) => number;
        InOut: (k: number) => number;
      };
      Bounce: {
        In: (k: number) => number;
        Out: (k: number) => number;
        InOut: (k: number) => number;
      };
    };

    function update(time?: number): boolean;
  }
}