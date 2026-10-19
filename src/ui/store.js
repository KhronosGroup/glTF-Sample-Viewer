import { useStore } from "zustand";
import { viewerStore } from "../logic/viewer_store.js";

export { setViewerState } from "../logic/viewer_store.js";

export function useViewerStore(selector) {
    return useStore(viewerStore, selector);
}

/** For reacting to a change rather than rendering from it. Returns an unsubscribe. */
export function subscribeToViewerState(listener) {
    return viewerStore.subscribe(listener);
}
