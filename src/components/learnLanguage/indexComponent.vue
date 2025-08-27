<script setup lang="ts">
import headerComponent from './headerComponent.vue';
import bodyComponent from './bodyComponent.vue';
import type { Sentence, Category } from 'src/types/lang';

// Google Sheet API URL
const sheetApiUrl = import.meta.env.VITE_API_URL;

// Google Sheet ID
const sheetId = import.meta.env.VITE_API_KEY;

// GSheet 型別
type GSheetCell = { v?: string | number | null };
type GSheetRow = { c: GSheetCell[] };
type GSheetData = { table: { rows: GSheetRow[] } };

// Vue State
const categories = ref<Category[]>([]);
const sentences = ref<Sentence[]>([]);
const search = ref<string>('');
const mode = ref<'list' | 'card'>('list');
const category = ref<string>('');
const flippedCards = reactive<{ [key: number]: boolean }>({});
const speaking = ref<{ sentenceId: number; lang: 'zh' | 'idn' } | null>(null);
let utterance: SpeechSynthesisUtterance | null = null;

// 過濾句子
const filteredSentences = computed<Sentence[]>(() =>
  sentences.value.filter(
    (s) =>
      (category.value === '' || s.category === category.value) &&
      (s.zh.toLowerCase().includes(search.value.toLowerCase()) ||
        s.idn.toLowerCase().includes(search.value.toLowerCase())),
  ),
);

// 切換模式
function toggleMode(listenerItem: 'list' | 'card'): 'list' | 'card' {
  mode.value = listenerItem === 'list' ? 'card' : 'list';
  return mode.value;
}

// 語音播放
function toggleVoice(
  s: { id: number; zh: string; idn: string; category?: string },
  lang: 'zh' | 'idn',
) {
  if (speaking.value?.sentenceId === s.id && speaking.value.lang === lang) {
    speechSynthesis.cancel();
    speaking.value = null;
    utterance = null;
    return;
  }

  if (utterance) speechSynthesis.cancel();

  const text = lang === 'zh' ? s.zh : s.idn;
  utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = lang === 'zh' ? 'zh-TW' : 'id-ID';

  utterance.onend = () => {
    if (speaking.value?.sentenceId === s.id && speaking.value.lang === lang) {
      speechSynthesis.speak(utterance!);
    }
  };

  speaking.value = { sentenceId: s.id, lang };
  speechSynthesis.speak(utterance);
  return;
}

function isSpeaking(sentenceId: number, lang: 'zh' | 'idn') {
  return speaking.value?.sentenceId === sentenceId && speaking.value.lang === lang;
}

// 卡片翻面
function toggleFlip(id: number) {
  if (speaking.value) {
    speechSynthesis.cancel();
    speaking.value = null;
    utterance = null;
  }
  flippedCards[id] = !flippedCards[id];
}

// 初始化資料
onMounted(async () => {
  // categories
  const catRes = await fetch(`${sheetApiUrl}/${sheetId}/gviz/tq?tqx=out:json&sheet=categories`);
  let catText = await catRes.text();
  catText = catText.substring(47, catText.length - 2);
  const catDataRaw = (JSON.parse(catText) as GSheetData).table.rows;

  // skip first row (header)
  const catDataRows = catDataRaw.slice(1);
  const catData: Category[] = catDataRows.map((row: GSheetRow) => ({
    id: row.c[0]?.v?.toString() ?? '',
    label: `${row.c[2]?.v?.toString() ?? ''} / ${row.c[3]?.v?.toString() ?? ''}`, // zh / idn
  }));
  categories.value = [{ id: '', label: '全部' }, ...catData];

  // sentences
  const senRes = await fetch(`${sheetApiUrl}/${sheetId}/gviz/tq?tqx=out:json&sheet=sentences`);
  let senText = await senRes.text();
  senText = senText.substring(47, senText.length - 2);
  const senDataRaw = (JSON.parse(senText) as GSheetData).table.rows;
  sentences.value = senDataRaw.map((row: GSheetRow, index: number) => ({
    id: Number(row.c[0]?.v ?? index),
    category: row.c[1]?.v?.toString() ?? '',
    zh: row.c[2]?.v?.toString() ?? '',
    en: row.c[3]?.v?.toString() ?? '',
    idn: row.c[4]?.v?.toString() ?? '',
  }));
});
</script>

<template>
  <div class="block relative w-full h-auto">
    <header-component
      :categories="categories"
      v-model:mode="mode"
      v-model:search="search"
      v-model:category="category"
      @toggleMode="toggleMode"
    />

    <body-component
      :mode="mode"
      :filteredSentences="filteredSentences"
      :isSpeaking="isSpeaking"
      :flippedCards="flippedCards"
      @toggleVoice="toggleVoice"
      @toggleFlip="toggleFlip"
    />
  </div>
</template>
