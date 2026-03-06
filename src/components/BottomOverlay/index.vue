<template>
  <div class="w-full h-full relative">
    <slot />
    <div
      class="absolute bottom-0 left-0 w-full h-[40%] bg-gradient-to-t from-black/80 to-transparent z-10"
    ></div>
    <div
      class="text-white absolute z-10 bottom-0 left-0 transition-all duration-300 ease-in-out z-20 w-full box-border"
      :class="getCardType()"
    >
      <slot name="footer" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { defineProps, withDefaults } from "vue";
//
//设置卡片边距类型
const props = withDefaults(
  defineProps<{
    size?: "large" | "default" | "small";
  }>(),
  {
    size: "default",
  }
);
const getCardType = () => {
  if (props.size === "large") {
    return "large-card";
  } else if (props.size === "small") {
    return "small-card";
  } else {
    return "card";
  }
};
</script>
