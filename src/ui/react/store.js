import { useStore } from "zustand";
import { viewerStore } from "../../logic/viewer_store.js";

export { setViewerState } from "../../logic/viewer_store.js";

export function useViewerStore(selector) {
    return useStore(viewerStore, selector);
}
