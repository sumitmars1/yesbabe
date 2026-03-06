<template>
  <div class="sidebar-root">
    <CustomMenu :collapsed="global.sidebarCollapsed" />
  </div>
</template>
<script setup lang="ts">
import CustomMenu from "@/components/CustomMenu/index.vue";
import { useGlobalStore } from "@/stores/global/global";
const global = useGlobalStore();
</script>
<style scoped>
.n-menu .n-menu-item-content:not(.n-menu-item-content--disabled):hover::before {
  background-color: transparent !important;
}
.n-menu
  .n-menu-item-content:not(.n-menu-item-content--disabled):not(
    .n-menu-item-content--selected,
    child-active
  ):focus-within::before {
  background-color: transparent !important;
}
.sidebar-root {
  height: 100%;
  background: var(--c-background);
}
</style>
