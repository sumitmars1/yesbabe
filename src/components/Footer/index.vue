<template>
  <div class="fixed bottom-0 w-full bg-sidebarBackground z-1000 border-t-hoverBackground border-t-solid border-1px">
    <div class="text-primary h-[64px]">
      <n-grid :cols="menuStore.menuOptions.length" class="h-full">
        <n-gi v-for="item in menuStore.menuOptions">
          <div
            class="flex flex-col justify-center items-center h-full cursor-pointer"
            :style="{
              opacity: menuStore.activeKey === item.key ? 1 : 0.4,
            }"
            @click="handleChangeRoute(item)"
          >
            <svg-icon :iconClass="item.iconName" size="24" />
            <div class="text-xs mt-1 whitespace-nowrap overflow-hidden text-ellipsis">
              {{ item.labelName }}
            </div>
          </div>
        </n-gi>
      </n-grid>
    </div>
  </div>
</template>
<script setup lang="ts">
import { useMenuStore } from "@/stores/menu";
const menuStore = useMenuStore();
import { useRouter } from "vue-router";
const router = useRouter();
const handleChangeRoute = (item: any) => {
  router.push({ path: item.routerPath });
};
</script>
<style scoped></style>
