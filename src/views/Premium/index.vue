<template>
  <div v-if="!globalStore.isMobile" class="page-padding">
    <PremiumHeader :show-suffix="false">
      <template #pro>
        <Premium />
      </template>
      <template #diamonds>
        <PurchaseDiamonds v-if="authStore.isLoggedIn && authStore.userInfo?.is_vip" />
      </template>
    </PremiumHeader>
  </div>
  <div v-else>
    <router-view />
  </div>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useGlobalStore } from "@/stores/global/global";
import { useAuthStore } from "@/stores/auth";
import PremiumHeader from "@/components/Header/Components/Premium.vue";
import PurchaseDiamonds from "./PurchaseDiamonds.vue";
import Premium from "./Premium.vue";
const globalStore = useGlobalStore();
const authStore = useAuthStore();
const selectedPlan = ref(0);
const loading = ref(false);
</script>

<style scoped>
/* 使用 UnoCSS 原子类进行样式定义 */
.n-button {
  @apply rounded-lg;
}

.n-button.primary {
  @apply bg-purple-500 hover:bg-purple-600;
}

.n-button.default {
  @apply bg-gray-700 hover:bg-gray-600;
}

.price-card {
  @apply bg-gray-800 p-4 rounded-lg shadow-md;
}

.discount-badge {
  @apply bg-yellow-500 text-black px-2 py-1 rounded-full;
}

.tips::before {
  content: "•";
  color: #a5d63f;
}
</style>
