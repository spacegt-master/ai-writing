import { ref } from "vue";
import { defineStore } from "pinia";

export const useSettingsStore = defineStore("settings", () => {
  const drawer = ref(false);
  const language = ref("简体中文");
  const sensitiveWords = ref("");

  return { drawer, language, sensitiveWords };
});
