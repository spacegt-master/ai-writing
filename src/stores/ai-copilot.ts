import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { theme } from "ant-design-x-vue";

export const useAICopilotStore = defineStore(
  "ai-copilot",
  () => {
    const session_id = ref();
    const loading = ref(false);
    const copilotOpen = ref<boolean>(true);

    const setCopilotOpen = (val: boolean) => (copilotOpen.value = val);

    const { token } = theme.useToken();

    const workareaStyles = computed(() => {
      return {
        copilotWrapper: {
          "min-width": "970px",
          height: "100vh",
          display: "flex",
        },
        workarea: {
          flex: 1,
          background: token.value.colorBgLayout,
          display: "flex",
          flexDirection: "column",
        },
        workareaHeader: {
          "box-sizing": "border-box",
          height: "64px",
          display: "flex",
          alignItems: "center",
          "justify-content": "space-between",
          padding: "0 48px 0 28px",
          "border-bottom": `1px solid ${token.value.colorBorder}`,
        },
        headerTitle: {
          "font-weight": 600,
          "font-size": "15px",
          color: token.value.colorText,
          display: "flex",
          "align-items": "center",
          gap: "8px",
        },
        headerButton: {
          "background-image": "linear-gradient(78deg, #8054f2 7%, #3895da 95%)",
          "border-radius": "20px",
          height: "40px",
          width: "120px",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          color: "#fff",
          cursor: "pointer",
          "font-size": "16px",
          "font-weight": 600,
          transition: "all 0.3s",
          "&:hover": {
            opacity: 0.8,
          },
        },
        workareaBody: {
          flex: 1,
          padding: "16px",
          background: token.value.colorBgContainer,
          borderRadius: "16px",
          minHeight: 0,
        },
        bodyContent: {
          overflow: "auto",
          height: "100%",
          "padding-right": "10px",
        },
        bodyText: {
          color: token.value.colorText,
          padding: "8px",
        },
      } as const;
    });

    const styles = computed(() => {
      return {
        copilotChat: {
          width: "400px",
          display: "flex",
          flexDirection: "column",
          background: token.value.colorBgContainer,
          color: token.value.colorText,
        },
        // chatHeader 样式
        chatHeader: {
          height: "64px",
          boxSizing: "border-box",
          borderBottom: `1px solid ${token.value.colorBorder}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 10px 0 16px",
        },
        headerTitle: {
          "font-weight": 600,
          "font-size": "18px",
        },
        headerButton: {
          width: "32px",
          height: "32px",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
          "font-size": "18px",
        },
        conversations: {
          width: "300px",
          "& .ant-conversations-list": {
            paddingInlineStart: 0,
          },
        },
        // chatList 样式
        chatList: {
          overflow: "auto",
          "padding-block": "16px",
          flex: 1,
        },
        chatWelcome: {
          "margin-inline": "16px",
          padding: "12px 16px",
          "border-radius": "2px 12px 12px 12px",
          background: token.value.colorBgTextHover,
          "margin-bottom": "16px",
        },
        loadingMessage: {
          "background-image":
            "linear-gradient(90deg, #ff6b23 0%, #af3cb8 31%, #53b6ff 89%)",
          "background-size": "100% 2px",
          "background-repeat": "no-repeat",
          "background-position": "bottom",
        },
        // chatSend 样式
        chatSend: {
          padding: "12px",
        },
        sendAction: {
          display: "flex",
          "align-items": "center",
          "margin-bottom": "12px",
          gap: "8px",
        },
        speechButton: {
          "font-size": "18px",
          color: `${token.value.colorText} !important`,
        },
      } as const;
    });

    const MOCK_SESSION_LIST = [
      {
        key: "5",
        label: "New session",
        group: "Today",
      },
      {
        key: "4",
        label: "What has Ant Design X upgraded?",
        group: "Today",
      },
      {
        key: "3",
        label: "New AGI Hybrid Interface",
        group: "Today",
      },
      {
        key: "2",
        label: "How to quickly install and import components?",
        group: "Yesterday",
      },
      {
        key: "1",
        label: "What is Ant Design X?",
        group: "Yesterday",
      },
    ];

    const MOCK_SUGGESTIONS = [
      { label: "Write a report", value: "report" },
      { label: "Draw a picture", value: "draw" },
      {
        label: "Check some knowledge",
        value: "knowledge",
        children: [
          { label: "About React", value: "react" },
          { label: "About Ant Design", value: "antd" },
        ],
      },
    ];
    const MOCK_QUESTIONS = [
      "AI 写作有哪些新功能？",
      "AI 写作包含了哪些组件或模块？",
      "如何快速开始使用 AI 写作？",
    ];

    return {
      session_id,
      workareaStyles,
      styles,
      loading,
      copilotOpen,
      setCopilotOpen,
      MOCK_SESSION_LIST,
      MOCK_SUGGESTIONS,
      MOCK_QUESTIONS,
    };
  },
  {
    persist: true,
  }
);
