/** Metro resolves font/image assets to a numeric module reference. */
declare module '*.ttf' {
  const asset: number;
  export default asset;
}
