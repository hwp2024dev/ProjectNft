// css 타입선언.
declare module '*.module.css' {
    const classes: { [key: string]: string };
    export default classes;
  }