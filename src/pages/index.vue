<template>
  <div :style="AICopilotStore.workareaStyles.copilotWrapper">
    <!-- 左侧工作区 -->
    <div :style="AICopilotStore.workareaStyles.workarea">
      <div :style="AICopilotStore.workareaStyles.workareaHeader">
        <div class="w-100 d-flex" :style="AICopilotStore.workareaStyles.headerTitle">

          <v-icon icon="mdi-ideogram-cjk-variant" size="40"></v-icon>

          <v-divider class="mx-3" vertical></v-divider>

          <h2 class="text-h5 font-weight-bold ml-4"> AI 写作</h2>

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
        <div v-if="!AICopilotStore.copilotOpen" :style="AICopilotStore.workareaStyles.headerButton"
          @click="AICopilotStore.setCopilotOpen(true)">
          ✨ AI 助手
        </div>
      </div>

      <div :class="[AICopilotStore.loading ? 'opacity-70' : '', 'position-relative', 'overflow-hidden']"
        :style="{ ...AICopilotStore.workareaStyles.workareaBody, margin: AICopilotStore.copilotOpen ? '16px' : '16px 48px' }">
        <v-progress-linear v-show="AICopilotStore.loading" class="position-absolute top-0 right-0 left-0"
          indeterminate></v-progress-linear>

        <div :style="AICopilotStore.workareaStyles.bodyContent">
          <Editor v-model="EditorStore.writing"></Editor>
        </div>
      </div>
    </div>
    <AICopilot></AICopilot>
  </div>
</template>

<script lang="ts" setup>
import { useAICopilotStore } from '@/stores/ai-copilot';
import { useEditorStore } from '@/stores/editor';
import { saveAs } from 'file-saver';
import axios from 'axios';
import markdownit from 'markdown-it';

const AICopilotStore = useAICopilotStore()
const EditorStore = useEditorStore()

const file_service = import.meta.env.VITE_APP_FILE_SERVICE
const md = markdownit({ html: true, breaks: true });

async function download(type: string) {
  if (type == 'Markdown') {
    const blob = new Blob([EditorStore.writing], { type: 'text/plain;charset=utf-8' })
    saveAs(blob, 'download.md')
  } else if (type == 'Word') {
    const html = md.render(EditorStore.writing)
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
</script>
