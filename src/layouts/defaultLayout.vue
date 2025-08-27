<script setup lang="ts">
import HeaderComponent from '@/components/navbar/headerComponent.vue';

defineProps<{
  className?: string;
}>();
</script>

<template>
  <q-layout view="lHh Lpr lFf">
    <HeaderComponent />

    <q-page-container>
      <q-page padding :class="className">
        <slot />
      </q-page>
    </q-page-container>
  </q-layout>
</template>
