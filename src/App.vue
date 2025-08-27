<script lang="ts" setup>
import { useWindowSize } from '@vueuse/core';

const { height } = useWindowSize();

const route = useRoute();
const layouts: Record<string, Component> = {
  default: defineAsyncComponent(() => import('./layouts/defaultLayout.vue')),
};
</script>

<template>
  <q-layout container view="lHh lpr lFf" :style="{ height: `${height}px` }" class="shadow-2">
    <component :is="layouts[(route.meta.layout as string) || 'default']">
      <router-view />
    </component>
  </q-layout>
</template>
