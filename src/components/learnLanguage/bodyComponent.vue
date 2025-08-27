<script setup lang="ts">
interface Sentence {
  id: number;
  zh: string;
  idn: string;
}

const props = defineProps<{
  mode: 'list' | 'card';
  filteredSentences: Array<{
    id: number;
    zh: string;
    idn: string;
  }>;
  isSpeaking: (id: number, lang: 'zh' | 'idn') => boolean;
  flippedCards: Record<number, boolean>;
}>();

const { mode, filteredSentences, isSpeaking, flippedCards } = toRefs(props);

const emits = defineEmits<{
  (e: 'toggleVoice', sentence: { id: number; zh: string; idn: string }, lang: 'zh' | 'idn'): void;
  (e: 'toggleFlip', id: number): void;
}>();

function toggleVoice(sentence: Sentence, lang: 'zh' | 'idn') {
  emits('toggleVoice', sentence, lang);
}

function toggleFlip(id: number) {
  emits('toggleFlip', id);
}
</script>

<template>
  <div v-if="filteredSentences.length > 0" class="block relative">
    <q-list v-if="mode === 'list'" bordered class="max-w-full rounded-borders">
      <template v-for="(s, idx) in filteredSentences" :key="s.id">
        <q-item clickable v-ripple padding class="q-pa-sm">
          <q-item-section class="flex flex-col items-start justify-start gap-1 w-full py-3 px-6">
            <!-- 中文：左文右鈕 -->
            <div class="flex items-center justify-between w-full space-x-6">
              <q-item-label class="text-h5">{{ s.zh }}</q-item-label>
              <q-btn
                flat
                size="lg"
                :round="!isSpeaking(s.id, 'zh')"
                :icon="isSpeaking(s.id, 'zh') ? 'stop' : 'volume_up'"
                :color="isSpeaking(s.id, 'zh') ? 'red' : 'black'"
                @click.stop="toggleVoice(s, 'zh')"
              />
            </div>

            <!-- 印尼文：左文右鈕 -->
            <div class="row items-center justify-between w-full space-x-6">
              <q-item-label class="text-h5">{{ s.idn }}</q-item-label>
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

        <q-separator
          v-if="idx < filteredSentences.length - 1"
          dark
          spaced
          size="2px"
          color="grey-7"
        />
      </template>
    </q-list>

    <!-- 卡片模式 -->
    <div v-else class="block relative">
      <q-card
        v-for="s in filteredSentences"
        :key="s.id"
        class="flex flex-col relative overflow-hidden py-3 px-6 mb-3"
      >
        <!-- 內部內容維持翻面 + 語音按鈕 -->
        <div class="flip-card" :class="{ flipped: flippedCards[s.id] }">
          <!-- 正面 -->
          <div class="flip-card-front q-card-section">
            <div class="flex justify-between md:grid grid-cols-3">
              <h6
                class="inline-block md:inline-flex items-center text-base font-jhenghei font-bold! truncate max-w-full"
              >
                <span class="text-ellipsis overflow-hidden">{{ s.idn }}</span>
                <q-btn
                  flat
                  size="md"
                  class="relative top-[-2px] ml-3! md:hidden"
                  :round="!isSpeaking(s.id, 'idn')"
                  :icon="isSpeaking(s.id, 'idn') ? 'stop' : 'volume_up'"
                  :color="isSpeaking(s.id, 'idn') ? 'red' : 'black'"
                  @click.stop="toggleVoice(s, 'idn')"
                />
              </h6>

              <div class="flex items-center justify-end md:justify-center w-1/2 md:w-auto">
                <q-btn
                  flat
                  round
                  dense
                  icon="autorenew"
                  color="primary"
                  @click="toggleFlip(s.id)"
                />
              </div>
            </div>
            <!-- <div class="flex flex-row justify-center">
              <q-btn flat round dense icon="autorenew" color="primary" @click="toggleFlip(s.id)" />
            </div> -->
          </div>

          <!-- 背面 -->
          <div class="flip-card-back q-card-section">
            <div class="flex justify-between md:grid grid-cols-3">
              <h6
                class="inline-block md:inline-flex items-center text-base font-jhenghei font-bold! truncate max-w-full"
              >
                <span class="text-ellipsis overflow-hidden">{{ s.zh }}</span>
                <q-btn
                  flat
                  size="md"
                  :round="!isSpeaking(s.id, 'zh')"
                  :icon="isSpeaking(s.id, 'zh') ? 'stop' : 'volume_up'"
                  :color="isSpeaking(s.id, 'zh') ? 'red' : 'black'"
                  @click.stop="toggleVoice(s, 'zh')"
                />
              </h6>

              <div class="flex items-center justify-end md:justify-center w-1/2 md:w-auto">
                <q-btn
                  flat
                  round
                  dense
                  icon="autorenew"
                  color="primary"
                  @click="toggleFlip(s.id)"
                />
              </div>
            </div>
            <!-- <div class="row justify-center q-mt-md">
              <q-btn flat round dense icon="autorenew" color="primary" @click="toggleFlip(s.id)" />
            </div> -->
          </div>
        </div>
      </q-card>
    </div>
  </div>

  <div v-else class="block relative">
    <q-skeleton v-for="index in 5" :key="index" type="text" width="100%" height="50px" />
  </div>
</template>

<style lang="scss" scoped>
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
  height: auto; /* 可調整卡片高度 */

  .flip-card-front,
  .flip-card-back {
    backface-visibility: hidden;
    transition: transform 0.6s;
    transform-style: preserve-3d;
    position: relative;
    top: 0;
    left: 0;
    width: 100%;
    height: auto;
  }

  .flip-card-front {
    background-color: #ffffff;
    z-index: 2;
  }

  .flip-card-back {
    background-color: #f5f5f5;
    transform: translateY(150%);
    z-index: 1;
  }
}

.flip-card.flipped .flip-card-front {
  transform: translateY(-150%);
}

.flip-card.flipped .flip-card-back {
  transform: translateY(0%);
}
</style>
