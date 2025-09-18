import { defineStore } from "pinia";
import { ref } from "vue";

export const useAICopilotStore = defineStore("ai-copilot", () => {
  const session_id = ref();
  return { session_id };
});
