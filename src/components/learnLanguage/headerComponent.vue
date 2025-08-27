<script setup lang="ts">
const props = defineProps<{
  mode: 'list' | 'card';
  categories: { label: string; id: string }[];
}>();

const { categories, mode } = toRefs(props);

const emits = defineEmits<{
  (e: 'update:mode', value: 'list' | 'card'): void;
  (e: 'update:categories', value: { label: string; id: string }[]): void;
}>();

const searchModel = defineModel('search_model', {
  type: String,
  default: '',
});

const categoryModel = defineModel('categorie_model', {
  type: Array as () => { label: string; id: string }[],
  default: () => [],
});

function toggleMode() {
  emits('update:mode', mode.value === 'list' ? 'card' : 'list');
}
</script>

<template>
  <!-- 上方控制列 -->
  <div
    v-if="categories"
    class="sticky-header border rounded-borders border-gray-300 flex flex-col justify-start items-center space-y-3 p-3 bg-white z-10 md:flex-row md:space-y-0 md:space-x-3 md:justify-between mb-3"
  >
    <div class="block relative w-full flex-1">
      <!-- 類別選擇 -->
      <q-select
        filled
        v-model="categoryModel"
        :options="categories"
        option-value="id"
        option-label="label"
        label="選擇類別"
        emit-value
        map-options
        class="col-12 col-sm-12"
      />
    </div>

    <!-- 搜尋框 -->
    <div class="flex items-center flex-grow flex-1 w-full space-x-3">
      <q-input
        filled
        debounce="300"
        label="搜尋句子"
        v-model="searchModel"
        class="block relative max-w-full h-auto flex-1 rounded"
      />

      <!-- 模式切換 -->
      <!-- <q-btn
        dense
        unelevated
        color="primary"
        class="block h-full"
        @click="toggleMode"
        :icon="mode === 'list' ? 'view_module' : 'view_list'"
      /> -->
      <button
        v-ripple="{ early: true }"
        class="btn block relative w-auto h-full p-3 rounded-borders bg-blue-500 cursor-pointer overflow-hidden"
        @click="toggleMode"
      >
        <q-icon size="md" color="white" :name="mode === 'list' ? 'view_module' : 'view_list'" />
      </button>
    </div>
  </div>

  <div v-else>
    <q-card flat class="max-w-full rounded-borders">
      <q-skeleton height="150px" square />
    </q-card>
  </div>
</template>

<style lang="scss" scoped></style>
