<template>
    <v-btn icon="mdi-cog-outline" variant="text" @click="settingsStore.drawer = true"></v-btn>

    <v-navigation-drawer v-model="settingsStore.drawer" temporary location="end" :width="400">
        <v-list-item class="py-4">
            <template #title>
                <div class="text-h6">
                    助手设置
                </div>
            </template>

            <template #append>
                <v-btn density="comfortable" icon="$close" variant="text" @click="settingsStore.drawer = false" />
            </template>
        </v-list-item>

        <v-divider />

        <div class="pa-4">
            <div>
                <div>
                    <strong>回答语言</strong>
                </div>

                <v-select class="my-2" v-model="settingsStore.language"
                    :items="['简体中文', '繁體中文', 'English', '日本語', 'Українська', 'Français', '한국어', 'Português', 'বাংলা', 'Italiano', 'فارسی', 'Русский', 'Čeština', 'Polski']"></v-select>
            </div>

            <div>
                <strong>敏感词</strong>
            </div>

            <v-textarea class="my-2" v-model="settingsStore.sensitiveWords" flat hide-details="auto"
                placeholder="敏感词英文逗号分割" rows="6" variant="solo-filled" />

        </div>

        <template #append>
            <div class="d-flex justify-end px-4 py-2 ga-2">
                <v-btn border class="text-none" flat rounded text="取消" @click="settingsStore.drawer = false" />

                <v-btn class="text-none" color="surface-variant" flat rounded text="确定"
                    @click="settingsStore.drawer = false" />
            </div>
        </template>

    </v-navigation-drawer>
</template>

<script setup lang="ts">
import { useSettingsStore } from '@/stores/settings';


const settingsStore = useSettingsStore()
</script>

<style scoped></style>