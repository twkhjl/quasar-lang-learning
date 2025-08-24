<template>
  <q-page class="q-pa-md">
    <div class="row q-gutter-md items-center">
      <!-- 類別選擇 -->
      <q-select
        filled
        v-model="category"
        :options="categories"
        option-value="id"
        option-label="label"
        label="選擇類別"
        emit-value
        map-options
      />

      <!-- 搜尋框 -->
      <q-input filled v-model="search" label="搜尋句子" debounce="300" class="col" />

      <!-- 模式切換 -->
      <q-btn
        color="primary"
        @click="toggleMode"
        :label="mode === 'list' ? '切換卡片模式' : '切換清單模式'"
      />
    </div>

    <!-- 清單模式 -->
    <q-list v-if="mode === 'list'" bordered class="q-mt-md">
      <q-item v-for="s in filteredSentences" :key="s.id" clickable v-ripple class="q-pa-sm">
        <!-- 中文與印尼文句子，中印間距加大 -->
        <q-item-section class="col">
          <q-item-label class="text-h5 q-mb-md">{{ s.zh }}</q-item-label>
          <q-item-label class="text-h5">{{ s.idn }}</q-item-label>
        </q-item-section>

        <!-- 喇叭圖示放右邊，中文與印尼文各自一個 -->
        <q-item-section side class="justify-end">
          <!-- 中文 -->
          <q-btn
            flat
            :round="!isSpeaking(s.id, 'zh')"
            size="lg"
            :icon="isSpeaking(s.id, 'zh') ? 'stop' : 'volume_up'"
            :color="isSpeaking(s.id, 'zh') ? 'red' : 'black'"
            class="q-mr-sm"
            @click="toggleVoice(s, 'zh')"
          />

          <!-- 印尼文 -->
          <q-btn
            flat
            :round="!isSpeaking(s.id, 'idn')"
            size="lg"
            :icon="isSpeaking(s.id, 'idn') ? 'stop' : 'volume_up'"
            :color="isSpeaking(s.id, 'idn') ? 'red' : 'black'"
            @click="toggleVoice(s, 'idn')"
          />
        </q-item-section>
      </q-item>
    </q-list>

    <!-- 卡片模式 -->
    <div v-else class="row q-col-gutter-md q-mt-md">
      <q-card v-for="s in filteredSentences" :key="s.id" class="col-12 col-sm-6 col-md-4 q-pa-md">
        <q-card-section>
          <!-- 中文 -->
          <div class="row items-center justify-between q-mb-md">
            <div class="text-h5">{{ s.zh }}</div>
            <q-btn
              flat
              :round="!isSpeaking(s.id, 'zh')"
              size="lg"
              :icon="isSpeaking(s.id, 'zh') ? 'stop' : 'volume_up'"
              :color="isSpeaking(s.id, 'zh') ? 'red' : 'black'"
              @click="toggleVoice(s, 'zh')"
            />
          </div>

          <!-- 印尼文 -->
          <div class="row items-center justify-between">
            <div class="text-h5 text-grey">{{ s.idn }}</div>
            <q-btn
              flat
              :round="!isSpeaking(s.id, 'idn')"
              size="lg"
              :icon="isSpeaking(s.id, 'idn') ? 'stop' : 'volume_up'"
              :color="isSpeaking(s.id, 'idn') ? 'red' : 'black'"
              @click="toggleVoice(s, 'idn')"
            />
          </div>
        </q-card-section>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { Sentence, Category } from 'src/types/lang';

const categories = ref<Category[]>([]);
const sentences = ref<Sentence[]>([]);
const category = ref<string>('');
const search = ref<string>('');
const mode = ref<'list' | 'card'>('list');

// 初始化資料
onMounted(async () => {
  const [catRes, senRes] = await Promise.all([
    fetch('/data/categories.json'),
    fetch('/data/sentences.json'),
  ]);
  categories.value = await catRes.json();
  sentences.value = await senRes.json();
});

const filteredSentences = computed<Sentence[]>(() =>
  sentences.value.filter(
    (s) =>
      (category.value === '' || s.category === category.value) &&
      (s.zh.includes(search.value) || s.idn.includes(search.value)),
  ),
);

function toggleMode(): void {
  mode.value = mode.value === 'list' ? 'card' : 'list';
}

// ===== 循環播放控制 =====
const speaking = ref<{ sentenceId: number; lang: 'zh' | 'idn' } | null>(null);
let utterance: SpeechSynthesisUtterance | null = null;

function toggleVoice(s: Sentence, lang: 'zh' | 'idn') {
  // 如果已經在播放同一句同語言，停止播放
  if (speaking.value?.sentenceId === s.id && speaking.value.lang === lang) {
    speechSynthesis.cancel();
    speaking.value = null;
    utterance = null;
    return;
  }

  // 停掉其他播放
  if (utterance) speechSynthesis.cancel();

  const text = lang === 'zh' ? s.zh : s.idn;

  utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'zh' ? 'zh-TW' : 'id-ID';

  // 循環播放
  utterance.onend = () => {
    if (speaking.value?.sentenceId === s.id && speaking.value.lang === lang) {
      speechSynthesis.speak(utterance!);
    }
  };

  speaking.value = { sentenceId: s.id, lang };
  speechSynthesis.speak(utterance);
}

function isSpeaking(sentenceId: number, lang: 'zh' | 'idn') {
  return speaking.value?.sentenceId === sentenceId && speaking.value.lang === lang;
}
</script>
