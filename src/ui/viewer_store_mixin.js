import { reactive } from "vue";
import { viewerStore, viewerStateKeys } from "../logic/viewer_store.js";

const computed = {};
for (const key of viewerStateKeys) {
    computed[key] = {
        get() {
            return this.viewerState[key];
        },
        set(value) {
            viewerStore.setState({ [key]: value });
        }
    };
}

/**
 * Throwaway bridge that exposes the vanilla store to Vue's reactivity so the
 * existing template can keep reading and `v-model`-ing these keys unchanged.
 * Deleted once the UI is React.
 */
export const viewerStoreMixin = {
    data() {
        return { viewerState: reactive({ ...viewerStore.getState() }) };
    },
    computed,
    created() {
        this.unsubscribeViewerStore = viewerStore.subscribe((state) => {
            Object.assign(this.viewerState, state);
        });
    },
    unmounted() {
        this.unsubscribeViewerStore?.();
    }
};
