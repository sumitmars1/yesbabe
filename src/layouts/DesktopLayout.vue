<template>
  <div class="desktop-root">
    <Header />
    <div class="desktop-main">
      <aside class="sidebar" :style="{ width: sidebarWidth }">
        <SideBar />
      </aside>
      <n-scrollbar class="content">
        <router-view />
      </n-scrollbar>
    </div>
  </div>
  
</template>

<script setup lang="ts">
import Header from "@/components/Header/index.vue";
import SideBar from "@/components/SideBar/index.vue";
import { computed } from "vue";
import { useGlobalStore } from "@/stores/global/global";
const global = useGlobalStore();

const sidebarWidth = computed(() => (global.sidebarCollapsed ? "90px" : "280px"));
</script>

<style scoped>
.desktop-root {
  --app-header-h: 64px;
}
.desktop-main {
  margin-top: var(--app-header-h);
  height: calc(100dvh - var(--app-header-h));
  display: flex;
  overflow: hidden;
  background: var(--c-background);
}
.sidebar {
  border-right: 0.5px solid var(--c-hover-background);
  transition: width 0.3s ease;
}
.content {
  flex: 1;
  height: 100%;
}
</style>

