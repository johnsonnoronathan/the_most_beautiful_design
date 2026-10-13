import {staticFile} from 'remotion';

declare global {
  interface Window {
    // Set by the static preview page: inlined assets by path, and a base URL for the rest.
    __STUDIO_ASSETS__?: Record<string, string>;
    __STUDIO_ASSET_BASE__?: string;
  }
}

/** URL of a file under public/, in Remotion (studio/render) and on the preview page. */
export const asset = (path: string) => {
  if (typeof window !== 'undefined') {
    const inlined = window.__STUDIO_ASSETS__?.[path];
    if (inlined) return inlined;
    if (window.__STUDIO_ASSET_BASE__ !== undefined) return window.__STUDIO_ASSET_BASE__ + path;
  }
  return staticFile(path);
};
