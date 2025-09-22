<template>
    <!-- 右侧对话区 -->
    <div :style="{ ...AICopilotStore.styles.copilotChat, display: AICopilotStore.copilotOpen ? 'flex' : 'none' }">
        <!-- 对话区 - header -->
        <!-- {chatHeader} -->
        <div :style="AICopilotStore.styles.chatHeader">
            <div class="d-flex align-center" :style="AICopilotStore.styles.headerTitle">
                <div class="pt-1">
                    ✨ AI 助手
                </div>
                <Settings></Settings>
            </div>
            <Space :size="0">
                <Button type="text" :icon="h(CloseOutlined)" :style="AICopilotStore.styles.headerButton"
                    @click="AICopilotStore.setCopilotOpen(false)" />
            </Space>
        </div>
        <!-- 对话区 - 消息列表 -->
        <div :style="AICopilotStore.styles.chatList">
            <Bubble.List v-if="messages?.length" :style="{ height: '100%', paddingInline: '16px' }" :items="messages?.map((i: any) => ({
                ...i.message,
                styles: {
                    content: i.status === 'loading' ? AICopilotStore.styles.loadingMessage : {},
                },
                loading: (i.status === 'loading' && !i.message.content),
                typing: i.status === 'loading' ? { step: 2, interval: 20, suffix: h('span', '') } : false,
                messageRender: i.message.role == 'assistant' ? renderMarkdown : null
            }))" :roles="roles" />
            <template v-else>
                <Welcome variant="borderless" title="👋 你好，我是 AI 写作" description="AI 写作的魅力在于它能像人类一样创作文本，并且效率极高。"
                    :style="AICopilotStore.styles.chatWelcome" />
                <Prompts vertical :title="() => '我可以帮忙：'"
                    :items="AICopilotStore.MOCK_QUESTIONS.map((i) => ({ key: i, description: i }))" :style="{
                        'margin-inline': '16px',
                    }" :styles="{
                        title: { fontSize: 14 },
                    }" @item-click="(info) => handleUserSubmit(info?.data?.description as string)" />
            </template>
        </div>

        <!-- 对话区 - 输入框 -->
        <!-- {chatSender} -->
        <div :style="AICopilotStore.styles.chatSend">
            <div :style="AICopilotStore.styles.sendAction">
                <Button :icon="h(AppstoreOutlined)" @click="handleUserSubmit('生成目录')">
                    生成目录
                </Button>
                <Button :icon="h(AppstoreOutlined)" @click="handleUserSubmit('文章提要')">
                    文章提要
                </Button>
                <Button :icon="h(AppstoreOutlined)" @click="handleUserSubmit('关键字')">
                    关键字
                </Button>
            </div>
            <div :style="AICopilotStore.styles.sendAction">
                <Button :icon="h(AppstoreOutlined)" @click="handleUserSubmit('缩编文章')">
                    缩编文章
                </Button>
                <Button :icon="h(AppstoreOutlined)" @click="handleUserSubmit('自动润色')">
                    自动润色
                </Button>
                <Button :icon="h(AppstoreOutlined)" @click="handleUserSubmit('生成大纲')">
                    生成大纲
                </Button>
            </div>
            <!-- 输入框 -->

            <Suggestion :items="() => AICopilotStore.MOCK_SUGGESTIONS"
                @select="(itemVal) => inputValue = `[${itemVal}]:`">
                <template #default="props">
                    <Sender :loading="AICopilotStore.loading" :value="inputValue" allow-speech placeholder="发问题或话题"
                        @change="(v) => {
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
                        }" @key-down="props?.onKeyDown">
                        <template #header>
                            <Sender.Header :open="hasRef" :title="EditorStore.selection" />
                        </template>

                        <template #actions="{ info: { components: { SendButton, LoadingButton, SpeechButton } } }">
                            <div :style="{ display: 'flex', alignItems: 'center', gap: 4 }">
                                <component :is="LoadingButton" v-if="AICopilotStore.loading" type="default"
                                    @click="AICopilotStore.loading = false" />
                                <component :is="SendButton" v-else type="primary" />
                            </div>
                        </template>
                    </Sender>
                </template>
            </Suggestion>
        </div>
    </div>
</template>

<script setup lang="ts">
import {
    AppstoreAddOutlined,
    CloseOutlined,
    CopyOutlined,
    DislikeOutlined,
    LikeOutlined,
    AppstoreOutlined,
    ReloadOutlined,
    ScheduleOutlined,
} from '@ant-design/icons-vue';
import {
    Bubble,
    type Conversation,
    Prompts,
    Sender,
    Suggestion,
    Welcome,
    useXAgent,
    useXChat,
    type BubbleProps,
} from 'ant-design-x-vue';
import { Button, Space, Typography } from 'ant-design-vue';
import { ref, watch, h } from 'vue';
import { useAICopilotStore } from '@/stores/ai-copilot';
import markdownit from 'markdown-it';
import { useEditorStore } from '@/stores/editor';
import { useSettingsStore } from '@/stores/settings';
import Settings from './Settings.vue';
import { AIImageApi } from 'spacegt';
import { v4 as uuid } from 'uuid'

const AICopilotStore = useAICopilotStore()
const EditorStore = useEditorStore()
const SettingsStore = useSettingsStore()

const aliyun_ai_service = import.meta.env.VITE_APP_ALIYUN_AI_SERVICE

defineOptions({ name: 'PlaygroundCopilotSetup' });

const md = markdownit({ html: true, breaks: true });

const renderMarkdown: BubbleProps['messageRender'] =
    (content: string) => h(Typography, null, { default: () => h('div', { innerHTML: md.render(content) }), });

const abortController = ref<AbortController>();

// ==================== State ====================

const messageHistory = ref<Record<string, any>>({});

const sessionList = ref<Conversation[]>(AICopilotStore.MOCK_SESSION_LIST);
const curSession = ref(sessionList.value[0].key);

const inputValue = ref('');

const hasRef = ref(true);

// ==================== Runtime ====================

const [agent] = useXAgent<string, { message: { content: string, role: string } }, { content: string; role: string }>({
    request: async ({ message }, { onSuccess, onUpdate }) => {
        AICopilotStore.loading = true

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
                prompt: `(请使用${SettingsStore.language}回答问题)(不要出现敏感词:${SettingsStore.sensitiveWords})${message.content}`,
            })
        }).then(response => {
            const reader = response?.body?.getReader();
            const decoder = new TextDecoder();

            // 循环读取数据块
            return new ReadableStream({
                start(controller) {
                    function push() {
                        reader?.read().then(async ({ done, value }) => {
                            if (done) {
                                console.log('Stream complete');
                                controller.close();
                                try {
                                    if (EditorStore.selection) {
                                        onUpdate({ content: '部分文章创作完成', role: 'assistant' })
                                        onSuccess([{ content: '部分文章创作完成', role: 'assistant' }])
                                        EditorStore.replaceSelectedText(fullData)
                                    } else if (intention == 'Writing') {
                                        onUpdate({ content: '文章创作完成', role: 'assistant' })
                                        onSuccess([{ content: '文章创作完成', role: 'assistant' }])
                                        EditorStore.writing = fullData
                                        setMessages((prev: any) => [...prev, { id: uuid(), message: { content: "开始生成插图", role: "assistant" }, status: 'success' }])
                                        EditorStore.writing = addImageToSecondLine(EditorStore.writing, `![](/loading.gif)`)
                                        agent.value.request({ message: { content: '根据文章生成插图关键词，要求300字内', role: '' } }, {
                                            onUpdate: function (chunk: { content: string; role: string; }): void { },
                                            onSuccess: async function (chunk: { content: string; role: string; }[]): Promise<void> {
                                                const url = chunk[0].content
                                                EditorStore.writing = addImageToSecondLine(EditorStore.writing, `![插图](${url})`)
                                                setMessages((prev: any) => [...prev, { id: uuid(), message: { content: "插图生成完成", role: "assistant" }, status: 'success' }])
                                            },
                                            onError: function (error: Error): void { }
                                        })
                                    } else if (intention == 'ImgPrompt') {
                                        const text2imageResponse = await AIImageApi.text2image({
                                            prompt: fullData,
                                            n: 1,
                                            size: '1280*720',
                                            seed: 1234,
                                            negative_prompt: ''
                                        })
                                        onSuccess([{ content: text2imageResponse.results[0].url, role: 'assistant' }])
                                    } else {
                                        onSuccess([{ content: fullData, role: 'assistant' }])
                                    }
                                } catch (e) { console.error(e) }
                                AICopilotStore.loading = false
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

                            if (EditorStore.selection) {
                                // 如果是重写部分则不需要替换全部，转到结束后替换部分内容
                            } else if (intention == 'Writing') {
                                EditorStore.writing = fullData
                            } else if (intention == 'ImgPrompt') {
                                // 回复过程中不做处理，结束合成图片
                            } else {
                                onUpdate({ content: fullData, role: 'assistant' })
                            }
                            push();
                        });
                    }
                    push();
                }
            });
        }).catch(error => console.error(error));
    },
});


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
    if (EditorStore.selection) {
        onRequest({
            stream: true,
            message: { content: `${val}:"${EditorStore.selection}"`, role: 'user' },
        });
    } else {
        onRequest({
            stream: true,
            message: { content: val, role: 'user' },
        });
    }

    // session title mock
    if (sessionList.value.find((i) => i.key === curSession.value)?.label === 'New session') {
        const tempList = sessionList.value.map((i) => (i.key !== curSession.value ? i : { ...i, label: val?.slice(0, 20) }));
        sessionList.value = tempList
    }
};

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

function addImageToSecondLine(markdownString: string, imageSyntax: string, altText = '图片') {
    if (markdownString.includes('![](/loading.gif)')) {
        return markdownString.replace('![](/loading.gif)', imageSyntax);
    }
    // 将 Markdown 字符串按行分割成数组
    const lines = markdownString.split('\n');

    // 如果 Markdown 内容不足两行，直接在末尾添加图片
    if (lines.length < 2) {
        lines.push('', imageSyntax); // 确保图片在新的一行
    } else {
        // 否则，在第二行（索引为 1）插入图片
        lines.splice(1, 0, imageSyntax);
    }

    // 将数组重新连接成 Markdown 字符串
    return lines.join('\n');
}
</script>
<style scoped>
:deep(.ant-bubble p:last-child) {
    margin-bottom: 0;
}
</style>