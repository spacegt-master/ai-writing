import { ref } from "vue";
import { defineStore } from "pinia";

export const useEditorStore = defineStore(
  "editor",
  () => {
    const writing = ref("");

    return { writing };
  },
  {
    persist: true,
  }
);
