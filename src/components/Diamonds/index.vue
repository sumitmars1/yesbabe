<template>
  <n-button class="h-36px" @click="handleGetDiamond">
    <svg-icon iconClass="diamond" class="mr-2" :size="24"></svg-icon>
    <span class="mr-2">{{ formatNumber(accountInfo?.tokens ?? 0) }}</span>
    <svg-icon iconClass="Plus" :size="10"></svg-icon>
  </n-button>
</template>
<script lang="ts" setup>
import { useRouter } from "vue-router";
import { useCurrency } from "@/composables/useCurrency";
const router = useRouter();
const handleGetDiamond = () => {
  router.push({ path: "/premium/diamonds" });
};
import { useAuthStore } from "@/stores/auth";
import { storeToRefs } from "pinia";
import { onMounted } from "vue";
const { accountInfo } = storeToRefs(useAuthStore());
const { formatNumber } = useCurrency();
onMounted(() => {
  useAuthStore().handleGetAccountInfo();
});
</script>
