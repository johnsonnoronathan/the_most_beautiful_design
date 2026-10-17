// Asset imports resolve to URLs, both in Remotion (webpack) and in the Screening Room build (esbuild).
declare module '*.woff2' {
  const url: string;
  export default url;
}
declare module '*.png' {
  const url: string;
  export default url;
}
declare module '*.mp3' {
  const url: string;
  export default url;
}
