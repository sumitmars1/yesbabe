<template>
  <div>
    <div
      class="h-[64px] header z-50 bg-soildBackground text-primary fixed top-0 right-0 w-full border-b-hoverBackground border-b-solid border-1px px-pageXPadding box-border"
    >
      <div class="flex items-center w-full h-full">
        <div v-if="global.isMobile" class="w-full">
          <Chat v-if="$route.meta?.headerType === 'Chat'"></Chat>
          <Create v-else-if="$route.meta?.headerType === 'Create'"></Create>
          <MobileDefault v-else-if="$route.meta?.headerType === 'MobileDefault'"></MobileDefault>
          <Premium v-else-if="$route.meta?.headerType === 'Premium'"></Premium>
          <CollectionHeader v-else-if="$route.meta?.headerType === 'CollectionHeader'"></CollectionHeader>
          <Default v-else></Default>
        </div>
        <div v-else class="w-full">
          <Default></Default>
        </div>
      </div>
    </div>
    <!-- Loading bar 通过 createDiscreteApi 创建，定位在 header 底部 -->
  </div>
</template>

<script setup lang="ts">
import { useGlobalStore } from "@/stores/global/global";
import { useThemeStore } from "@/stores/themeStore";
const global = useGlobalStore();
const themeStore = useThemeStore();
</script>
