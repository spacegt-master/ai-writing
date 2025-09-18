<template>
    <div :style="workareaStyles.copilotWrapper">
        <!-- 左侧工作区 -->
        <div :style="workareaStyles.workarea">
            <div :style="workareaStyles.workareaHeader">
                <div class="w-100 d-flex" :style="workareaStyles.headerTitle">

                    <v-icon icon="mdi-ideogram-cjk-variant"></v-icon>

                    <v-divider class="mx-3" vertical></v-divider>

                    AI 写作

                    <v-spacer></v-spacer>
                    <v-btn class="text-none" variant="text">
                        <v-icon class="mr-2 mt-1" icon="mdi-download" size="18"></v-icon>
                        下载
                        <v-menu activator="parent" location="bottom center" max-width="200" offset="8">
                            <v-card elevation="4" rounded="lg">
                                <v-card-text class="pa-2">
                                    <v-list-item link rounded="lg" @click="download('Word')">
                                        <template #title>
                                            <v-icon class="mr-2" icon="mdi-file-word" size="18"></v-icon>
                                            <span class="text-body-2 font-weight-bold">Word</span>
                                        </template>
                                    </v-list-item>
                                    <v-list-item link rounded="lg" @click="download('Markdown')">
                                        <template #title>
                                            <v-icon class="mr-2" icon="mdi-file-document" size="18"></v-icon>
                                            <span class="text-body-2 font-weight-bold">Markdown</span>
                                        </template>
                                    </v-list-item>
                                </v-card-text>
                            </v-card>
                        </v-menu>
                    </v-btn>
                </div>
                <div v-if="!copilotOpen" :style="workareaStyles.headerButton" @click="setCopilotOpen(true)">
                    ✨ AI 助手
                </div>
            </div>

            <div :class="[agent.isRequesting() ? 'opacity-70' : '', 'position-relative', 'overflow-hidden']"
                :style="{ ...workareaStyles.workareaBody, margin: copilotOpen ? '16px' : '16px 48px' }">
                <v-progress-linear v-show="agent.isRequesting()" class="position-absolute top-0 right-0 left-0"
                    indeterminate></v-progress-linear>

                <div :style="workareaStyles.bodyContent">
                    <Editor v-model="writing"></Editor>
                </div>
            </div>
        </div>
        <!-- 右侧对话区 -->
        <div :style="{ ...styles.copilotChat, display: copilotOpen ? 'flex' : 'none' }">
            <!-- 对话区 - header -->
            <!-- {chatHeader} -->
            <div :style="styles.chatHeader">
                <div :style="styles.headerTitle">
                    ✨ AI 助手
                </div>
                <Space :size="0">
                    <!-- <Button type="text" :icon="h(PlusOutlined)" :style="styles.headerButton"
                        @click="createNewSession" /> -->
                    <!-- <Popover placement="bottom" :overlay-style="{ padding: 0, maxHeight: 600 }">
                        <template #content>
                            <Conversations :items="sessionList?.map((i) =>
                                i.key === curSession ? { ...i, label: `[current] ${i.label}` } : i,
                            )" :active-key="curSession" groupable
                                :styles="{ ...styles.conversations, item: { padding: '0 8px' } }"
                                @active-change="changeConversation" />
                        </template>
<Button type="text" :icon="h(CommentOutlined)" :style="styles.headerButton" />
</Popover> -->
                    <Button type="text" :icon="h(CloseOutlined)" :style="styles.headerButton"
                        @click="setCopilotOpen(false)" />
                </Space>
            </div>
            <!-- 对话区 - 消息列表 -->
            <div :style="styles.chatList">
                <Bubble.List v-if="messages?.length" :style="{ height: '100%', paddingInline: '16px' }" :items="messages?.map((i: any) => ({
                    ...i.message,
                    styles: {
                        content: i.status === 'loading' ? styles.loadingMessage : {},
                    },
                    loading: (i.status === 'loading' && !i.message.content),
                    typing: i.status === 'loading' ? { step: 2, interval: 20, suffix: h('span', '') } : false,
                    messageRender: i.message.role == 'assistant' ? renderMarkdown : null
                }))" :roles="roles" />
                <template v-else>
                    <Welcome variant="borderless" title="👋 你好，我是 AI 写作" description="AI 写作的魅力在于它能像人类一样创作文本，并且效率极高。"
                        :style="styles.chatWelcome" />
                    <Prompts vertical :title="() => '我可以帮忙：'"
                        :items="MOCK_QUESTIONS.map((i) => ({ key: i, description: i }))" :style="{
                            'margin-inline': '16px',
                        }" :styles="{
                            title: { fontSize: 14 },
                        }" @item-click="(info) => handleUserSubmit(info?.data?.description as string)" />
                </template>
            </div>

            <!-- 对话区 - 输入框 -->
            <!-- {chatSender} -->
            <div :style="styles.chatSend">
                <div :style="styles.sendAction">
                    <Button :icon="h(ScheduleOutlined)" @click="handleUserSubmit('生成目录')">
                        生成目录
                    </Button>
                    <Button :icon="h(AppstoreOutlined)" @click="handleUserSubmit('文章提要')">
                        文章提要
                    </Button>
                    <Button :icon="h(AppstoreAddOutlined)" @click="handleUserSubmit('关键字')">
                        关键字
                    </Button>
                </div>
                <!-- 输入框 -->

                <Suggestion :items="() => MOCK_SUGGESTIONS" @select="(itemVal) => inputValue = `[${itemVal}]:`">
                    <template #default="props">
                        <Sender :loading="loading" :value="inputValue" allow-speech placeholder="发信息或选择文件" @change="(v) => {
                            props?.onTrigger(v === '/');
                            inputValue = v;
                        }" @submit="() => {
                            handleUserSubmit(inputValue);
                            inputValue = '';
                        }" @cancel="() => {
                            try {
                                abortController?.abort();
                            } catch (error) {
                                console.error(error);
                            }
                        }" @key-down="props?.onKeyDown" @paste-file="onPasteFile">
                            <template #header>
                                <Sender.Header title="上传文件" :styles="{ content: { padding: 0 } }"
                                    :open="attachmentsOpen" force-render @open-change="val => attachmentsOpen = val">
                                    <Attachments ref="attachmentsRef" :before-upload="() => false" :items="files"
                                        :placeholder="(type) =>
                                            type === 'drop'
                                                ? { title: 'Drop file here' }
                                                : {
                                                    icon: h(CloudUploadOutlined),
                                                    title: '上传文件',
                                                    description: '点击或拖放文件到此区域以上传',
                                                }" @change="({ fileList }) => files = fileList" />
                                </Sender.Header>
                            </template>
                            <template #prefix>
                                <Button type="text" :icon="h(PaperClipOutlined, { style: { fontSize: '18px' } })"
                                    @click="attachmentsOpen = !attachmentsOpen" />
                            </template>
                            <template #actions="{ info: { components: { SendButton, LoadingButton, SpeechButton } } }">
                                <div :style="{ display: 'flex', alignItems: 'center', gap: 4 }">
                                    <component :is="SpeechButton" :style="styles.speechButton" />
                                    <component :is="LoadingButton" v-if="loading" type="default" />
                                    <component :is="SendButton" v-else type="primary" />
                                </div>
                            </template>
                        </Sender>
                    </template>
                </Suggestion>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import {
    AppstoreAddOutlined,
    CloseOutlined,
    CloudUploadOutlined,
    CopyOutlined,
    DislikeOutlined,
    LikeOutlined,
    PaperClipOutlined,
    AppstoreOutlined,
    ReloadOutlined,
    ScheduleOutlined,
    PlusOutlined,
} from '@ant-design/icons-vue';
import {
    Attachments,
    type Attachment,
    Bubble,
    type Conversation,
    Prompts,
    Sender,
    Suggestion,
    Welcome,
    useXAgent,
    useXChat,
    theme,
    type BubbleProps,
} from 'ant-design-x-vue';
import { Button, Space, Typography, message } from 'ant-design-vue';
import { ref, watch, computed, h } from 'vue';
import markdownit from 'markdown-it';
import { useAICopilotStore } from '@/stores/ai-copilot';
import { saveAs } from 'file-saver';
import axios from 'axios';

const aliyun_ai_service = import.meta.env.VITE_APP_ALIYUN_AI_SERVICE
const file_service = import.meta.env.VITE_APP_FILE_SERVICE

defineOptions({ name: 'PlaygroundCopilotSetup' });

const md = markdownit({ html: true, breaks: true });

const renderMarkdown: BubbleProps['messageRender'] = (content: string) =>
    h(Typography, null, {
        default: () => h('div', { innerHTML: md.render(content) }),
    });

const MOCK_SESSION_LIST = [
    {
        key: '5',
        label: 'New session',
        group: 'Today',
    },
    {
        key: '4',
        label: 'What has Ant Design X upgraded?',
        group: 'Today',
    },
    {
        key: '3',
        label: 'New AGI Hybrid Interface',
        group: 'Today',
    },
    {
        key: '2',
        label: 'How to quickly install and import components?',
        group: 'Yesterday',
    },
    {
        key: '1',
        label: 'What is Ant Design X?',
        group: 'Yesterday',
    },
];
const MOCK_SUGGESTIONS = [
    { label: 'Write a report', value: 'report' },
    { label: 'Draw a picture', value: 'draw' },
    {
        label: 'Check some knowledge',
        value: 'knowledge',
        children: [
            { label: 'About React', value: 'react' },
            { label: 'About Ant Design', value: 'antd' },
        ],
    },
];
const MOCK_QUESTIONS = [
    'AI 写作有哪些新功能？',
    'AI 写作包含了哪些组件或模块？',
    '如何快速开始使用 AI 写作？',
];
const AGENT_PLACEHOLDER = '正在生成内容，请稍候 . . .';


const attachmentsRef = ref<InstanceType<typeof Attachments>>();
const abortController = ref<AbortController>();

// ==================== State ====================

const messageHistory = ref<Record<string, any>>({});

const sessionList = ref<Conversation[]>(MOCK_SESSION_LIST);
const curSession = ref(sessionList.value[0].key);

const attachmentsOpen = ref(false);
const files = ref<Attachment[]>([]);

const inputValue = ref('');

const writing = ref(``)

const AICopilotStore = useAICopilotStore()


// ==================== Runtime ====================

const [agent] = useXAgent<string, { message: { content: string, role: string } }, { content: string; role: string }>({
    request: async ({ message }, { onSuccess, onUpdate }) => {
        let fullData: string = ''
        let intention: string = ''

        onUpdate({
            content: '',
            role: 'assistant'
        })
        const url = `${aliyun_ai_service}/api/general-ai/597fa0897c784688b94857e49809ca48`;

        fetch(url, {
            method: 'post',
            headers: {
                "session-id": AICopilotStore.session_id ?? ''
            },
            body: JSON.stringify({
                prompt: message.content,
            })
        }).then(response => {
            const reader = response?.body?.getReader();
            const decoder = new TextDecoder();

            // 循环读取数据块
            return new ReadableStream({
                start(controller) {
                    function push() {
                        reader?.read().then(({ done, value }) => {
                            if (done) {
                                console.log('Stream complete');
                                controller.close();
                                if (intention == 'Writing') {
                                    onUpdate({ content: '文章创作完成', role: 'assistant' })
                                    onSuccess([{ content: '文章创作完成', role: 'assistant' }])
                                    writing.value = fullData
                                } else {
                                    onSuccess([{ content: fullData, role: 'assistant' }])
                                }
                                return;
                            }

                            // 解析事件数据并处理
                            const chunk = decoder.decode(value, { stream: true });
                            const eventSourceEvent = parseEventSourceData(chunk)

                            try {
                                eventSourceEvent.forEach(item => {
                                    if (item.data) {
                                        const output = JSON.parse(item.data)
                                        const data = output.workflow_message
                                        const finish_reason = output.finish_reason

                                        if (data) {
                                            if (data.node_type == 'End') {
                                                if (data?.message?.content) {
                                                    fullData += data.message.content
                                                }
                                            } else if (data.node_type == 'Output') {
                                                if (data?.message?.content) {
                                                    intention = data.message.content
                                                }
                                            }
                                            if (output?.session_id) {
                                                AICopilotStore.session_id = output?.session_id
                                            }
                                        }

                                        if (finish_reason == 'stop') {
                                            fullData = output.text
                                        }
                                    }
                                })
                            } catch (e) {
                                console.error(e)
                            }
                            if (intention == 'Writing') {
                                writing.value = fullData
                            } else {
                                onUpdate({ content: fullData, role: 'assistant' })
                            }
                            push();
                        });
                    }
                    push();
                }
            });
        })
            .catch(error => console.error(error));
    },
});



const loading = agent.value.isRequesting();

const { messages, onRequest, setMessages } = useXChat({
    agent: agent.value,
});
watch(curSession, () => {
    if (curSession.value !== undefined) {
        setMessages(messageHistory.value?.[curSession.value] || []);
    } else {
        setMessages([]);
    }
}, { immediate: true });

watch(
    () => messages.value,
    () => {
        // history mock
        if (messages.value?.length) {
            messageHistory.value = {
                ...messageHistory.value,
                [curSession.value]: messages.value,
            }
        }
    }
);


// ==================== Event ====================
const handleUserSubmit = (val: string) => {
    onRequest({
        stream: true,
        message: { content: val, role: 'user' },
    });

    // session title mock
    if (sessionList.value.find((i) => i.key === curSession.value)?.label === 'New session') {
        const tempList = sessionList.value.map((i) => (i.key !== curSession.value ? i : { ...i, label: val?.slice(0, 20) }));
        sessionList.value = tempList
    }
};

const onPasteFile = (_: File, files: FileList) => {
    for (const file of Array.from(files)) {
        attachmentsRef.value?.upload(file);
    }
    attachmentsOpen.value = true;
};

const createNewSession = () => {
    if (agent.value.isRequesting()) {
        message.error(
            'Message is Requesting, you can create a new conversation after request done or abort it right now...',
        );
        return;
    }

    if (messages.value?.length) {
        const timeNow = new Date().getTime().toString();
        try {
            abortController.value?.abort();
        } catch (error) {
            console.error(error);
        }
        // The abort execution will trigger an asynchronous requestFallback, which may lead to timing issues.
        // In future versions, the sessionId capability will be added to resolve this problem.
        setTimeout(() => {
            sessionList.value = [
                { key: timeNow, label: 'New session', group: 'Today' },
                ...sessionList.value,
            ]
            curSession.value = timeNow;
        }, 100);
    } else {
        message.error('现在是新的对话了。');
    }
}

const changeConversation = async (val: string) => {
    try {
        abortController.value?.abort();
    } catch (error) {
        console.error(error);
    }
    // The abort execution will trigger an asynchronous requestFallback, which may lead to timing issues.
    // In future versions, the sessionId capability will be added to resolve this problem.
    setTimeout(() => {
        curSession.value = val;
    }, 100);
}

const setCopilotOpen = (val: boolean) => copilotOpen.value = val;


// ==================== Style ====================
const { token } = theme.useToken();
const styles = computed(() => {
    return {
        copilotChat: {
            width: '400px',
            display: 'flex',
            flexDirection: 'column',
            background: token.value.colorBgContainer,
            color: token.value.colorText,
        },
        // chatHeader 样式
        chatHeader: {
            height: '52px',
            boxSizing: 'border-box',
            borderBottom: `1px solid ${token.value.colorBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 10px 0 16px',
        },
        headerTitle: {
            'font-weight': 600,
            'font-size': '15px',
        },
        headerButton: {
            width: '32px',
            height: '32px',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            'font-size': '18px',
        },
        conversations: {
            width: '300px',
            '& .ant-conversations-list': {
                paddingInlineStart: 0,
            },
        },
        // chatList 样式
        chatList: {
            overflow: 'auto',
            'padding-block': '16px',
            flex: 1,
        },
        chatWelcome: {
            'margin-inline': '16px',
            padding: '12px 16px',
            'border-radius': '2px 12px 12px 12px',
            'background': token.value.colorBgTextHover,
            'margin-bottom': '16px',
        },
        loadingMessage: {
            'background-image': 'linear-gradient(90deg, #ff6b23 0%, #af3cb8 31%, #53b6ff 89%)',
            'background-size': '100% 2px',
            'background-repeat': 'no-repeat',
            'background-position': 'bottom',
        },
        // chatSend 样式
        chatSend: {
            padding: '12px'
        },
        sendAction: {
            display: 'flex',
            'align-items': 'center',
            'margin-bottom': '12px',
            gap: '8px',
        },
        speechButton: {
            'font-size': '18px',
            color: `${token.value.colorText} !important`,
        },
    } as const;
});
const workareaStyles = computed(() => {
    return {
        copilotWrapper: {
            'min-width': '970px',
            height: '100vh',
            display: 'flex',
        },
        workarea: {
            flex: 1,
            background: token.value.colorBgLayout,
            display: 'flex',
            flexDirection: 'column',
        },
        workareaHeader: {
            'box-sizing': 'border-box',
            height: '52px',
            display: 'flex',
            alignItems: 'center',
            'justify-content': 'space-between',
            padding: '0 48px 0 28px',
            'border-bottom': `1px solid ${token.value.colorBorder}`,
        },
        headerTitle: {
            'font-weight': 600,
            'font-size': '15px',
            'color': token.value.colorText,
            'display': 'flex',
            'align-items': 'center',
            'gap': '8px',
        },
        headerButton: {
            'background-image': 'linear-gradient(78deg, #8054f2 7%, #3895da 95%)',
            'border-radius': '12px',
            height: '24px',
            width: '93px',
            display: 'flex',
            'align-items': 'center',
            'justify-content': 'center',
            color: '#fff',
            cursor: 'pointer',
            'font-size': '12px',
            'font-weight': 600,
            transition: 'all 0.3s',
            '&:hover': {
                'opacity': 0.8,
            },
        },
        workareaBody: {
            flex: 1,
            padding: '16px',
            background: token.value.colorBgContainer,
            borderRadius: '16px',
            minHeight: 0,
        },
        bodyContent: {
            overflow: 'auto',
            height: '100%',
            'padding-right': '10px',
        },
        bodyText: {
            color: token.value.colorText,
            padding: '8px'
        },
    } as const;
});

// ==================== State =================
const copilotOpen = ref<boolean>(true)

const roles: (typeof Bubble.List)['roles'] = {
    assistant: {
        placement: 'start',
        footer: h('div', { style: { display: 'flex' } }, [
            h('Button', { type: 'text', size: 'small', icon: h(ReloadOutlined), onClick: () => { } }),
            h('Button', { type: 'text', size: 'small', icon: h(CopyOutlined), onClick: () => { } }),
            h('Button', { type: 'text', size: 'small', icon: h(LikeOutlined), onClick: () => { } }),
            h('Button', { type: 'text', size: 'small', icon: h(DislikeOutlined), onClick: () => { } }),
        ]),
    },
    user: { placement: 'end' },
}

// ==================== Fn =================

async function download(type: string) {
    if (type == 'Markdown') {
        const blob = new Blob([writing.value], { type: 'text/plain;charset=utf-8' })
        saveAs(blob, 'download.md')
    } else if (type == 'Word') {
        const html = md.render(writing.value)
        const res = await axios({
            method: "post",
            url: `${file_service}/pandoc/html2docx`,
            headers: {
                "Content-Type": "text/plain",
            },
            responseType: "blob",
            data: html,
        });
        saveAs(res.data, 'download.docx')
    }
}

/**
 * 定义 EventSource 事件的接口，便于类型检查。
 */
interface EventSourceEvent {
    type: string;
    data: string;
    id?: string;
    retry?: number;
}

/**
 * 解析 EventSource (SSE) 格式的文本数据流。
 * @param {string} text - 包含一个或多个 SSE 事件的字符串。
 * @returns {EventSourceEvent[]} - 包含解析后事件对象的数组。
 */
function parseEventSourceData(text: string): EventSourceEvent[] {
    // 按两个换行符 \n\n 分割成独立的事件块
    const eventBlocks = text.split('\n\n').filter(block => block.trim() !== '');
    const parsedEvents: EventSourceEvent[] = [];

    for (const block of eventBlocks) {
        const lines = block.split('\n');
        const event: EventSourceEvent = {
            type: 'message',
            data: ''
        };

        let dataLines: string[] = [];

        for (const line of lines) {
            if (line.startsWith('data:')) {
                // 移除 'data:' 前缀并添加到数据行数组
                dataLines.push(line.substring('data:'.length).trim());
            } else if (line.startsWith('event:')) {
                event.type = line.substring('event:'.length).trim();
            } else if (line.startsWith('id:')) {
                event.id = line.substring('id:'.length).trim();
            } else if (line.startsWith('retry:')) {
                event.retry = parseInt(line.substring('retry:'.length).trim(), 10);
            }
        }

        // 将所有 'data' 行拼接成一个完整的字符串
        event.data = dataLines.join('\n');

        parsedEvents.push(event);
    }

    return parsedEvents;
}

</script>
<style scoped>
:deep(.ant-bubble p:last-child) {
    margin-bottom: 0;
}
</style>