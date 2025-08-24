<template>
  <q-page class="q-pa-md">
    <!-- 上方控制列 -->
    <div class="row q-col-gutter-md q-mb-md sticky-header">
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
        class="col-12 col-sm-3"
      />

      <!-- 搜尋框 -->
      <q-input filled v-model="search" label="搜尋句子" debounce="300" class="col-12 col-sm" />

      <!-- 模式切換 -->
      <div class="col-12 col-sm-auto">
        <q-btn
          color="primary"
          class="full-width"
          @click="toggleMode"
          :label="mode === 'list' ? '切換卡片模式' : '切換清單模式'"
        />
      </div>
    </div>

    <!-- 清單模式 -->
    <q-list v-if="mode === 'list'" bordered class="q-mt-md">
      <q-item v-for="s in filteredSentences" :key="s.id" clickable v-ripple class="q-pa-sm">
        <q-item-section class="col">
          <!-- 中文：左文右鈕 -->
          <div class="row items-center justify-between q-mb-md">
            <q-item-label class="text-h5">{{ s.zh }}</q-item-label>
            <q-btn
              flat
              :round="!isSpeaking(s.id, 'zh')"
              size="lg"
              :icon="isSpeaking(s.id, 'zh') ? 'stop' : 'volume_up'"
              :color="isSpeaking(s.id, 'zh') ? 'red' : 'black'"
              @click.stop="toggleVoice(s, 'zh')"
            />
          </div>

          <!-- 印尼文：左文右鈕 -->
          <div class="row items-center justify-between">
            <q-item-label class="text-h5 text-grey">{{ s.idn }}</q-item-label>
            <q-btn
              flat
              :round="!isSpeaking(s.id, 'idn')"
              size="lg"
              :icon="isSpeaking(s.id, 'idn') ? 'stop' : 'volume_up'"
              :color="isSpeaking(s.id, 'idn') ? 'red' : 'black'"
              @click.stop="toggleVoice(s, 'idn')"
            />
          </div>
        </q-item-section>
      </q-item>
    </q-list>

    <!-- 卡片模式 -->
    <div v-else class="row q-col-gutter-md q-mt-md">
      <q-card v-for="s in filteredSentences" :key="s.id" class="col-12 q-pa-md">
        <!-- 內部內容維持翻面 + 語音按鈕 -->
        <div class="flip-card" :class="{ flipped: flippedCards[s.id] }">
          <!-- 正面 -->
          <div class="flip-card-front q-card-section">
            <div class="row items-center justify-between">
              <div class="text-h5 text-grey">{{ s.idn }}</div>
              <q-btn
                flat
                :round="!isSpeaking(s.id, 'idn')"
                size="lg"
                :icon="isSpeaking(s.id, 'idn') ? 'stop' : 'volume_up'"
                :color="isSpeaking(s.id, 'idn') ? 'red' : 'black'"
                @click.stop="toggleVoice(s, 'idn')"
              />
            </div>
            <div class="row justify-center q-mt-md">
              <q-btn flat round dense icon="autorenew" color="primary" @click="toggleFlip(s.id)" />
            </div>
          </div>

          <!-- 背面 -->
          <div class="flip-card-back q-card-section">
            <div class="row items-center justify-between">
              <div class="text-h5">{{ s.zh }}</div>
              <q-btn
                flat
                :round="!isSpeaking(s.id, 'zh')"
                size="lg"
                :icon="isSpeaking(s.id, 'zh') ? 'stop' : 'volume_up'"
                :color="isSpeaking(s.id, 'zh') ? 'red' : 'black'"
                @click.stop="toggleVoice(s, 'zh')"
              />
            </div>
            <div class="row justify-center q-mt-md">
              <q-btn flat round dense icon="autorenew" color="primary" @click="toggleFlip(s.id)" />
            </div>
          </div>
        </div>
      </q-card>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive } from 'vue';
import type { Sentence, Category } from 'src/types/lang';

const categories = ref<Category[]>([]);
const sentences = ref<Sentence[]>([]);
const search = ref<string>('');
const mode = ref<'list' | 'card'>('list');

// 初始化資料
onMounted(async () => {
  const [catRes, senRes] = await Promise.all([
    fetch('/data/categories.json'),
    fetch('/data/sentences.json'),
  ]);
  const catData: Category[] = await catRes.json();
  // 在最前面加上「全部」
  categories.value = [{ id: '', label: '全部' }, ...catData];
  sentences.value = await senRes.json();
});

// 預設值 = 全部 (id = '')
const category = ref<string>('');

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

const flippedCards = reactive<{ [key: number]: boolean }>({});

function toggleFlip(id: number) {
  // 翻面時停止播放
  if (speaking.value) {
    speechSynthesis.cancel();
    speaking.value = null;
    utterance = null;
  }
  flippedCards[id] = !flippedCards[id];
}
</script>

<style scoped>
.sticky-header {
  position: sticky;
  top: 50px;
  z-index: 10;
  background: white;
  /* 可加 box-shadow 增加浮起感 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
}

.flip-card {
  perspective: 1000px;
  position: relative;
  width: 100%;
  height: 150px; /* 可調整卡片高度 */
}

.flip-card-front,
.flip-card-back {
  backface-visibility: hidden;
  transition: transform 0.6s;
  transform-style: preserve-3d;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.flip-card-front {
  background-color: #ffffff;
  z-index: 2;
}

.flip-card-back {
  background-color: #f5f5f5;
  transform: rotateY(180deg);
  z-index: 1;
}

.flip-card.flipped .flip-card-front {
  transform: rotateY(180deg);
}

.flip-card.flipped .flip-card-back {
  transform: rotateY(0deg);
}
</style>
