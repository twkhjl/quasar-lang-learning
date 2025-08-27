import type { RouteRecordRaw } from 'vue-router';

import HomagePage from '@/pages/indexPage.vue';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: HomagePage,
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('@/pages/errorNotFound.vue'),
  },
];

export default routes;
