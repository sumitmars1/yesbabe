<template>
  <svg
    :class="[svgClass]"
    aria-hidden="true"
    :style="{
      width: `${props.width || props.size}px`,
      height: `${props.height || props.size}px`,
      fill: color,
    }"
  >
    <use :xlink:href="iconName" :fill="color" />
  </svg>
</template>

<script setup lang="ts">
import { computed, withDefaults } from "vue";
const props = withDefaults(
  defineProps<{
    iconClass: string;
    className?: string;
    color?: string;
    size?: number;
    width?: number;
    height?: number;
  }>(),
  {
    iconClass: "",
    className: "",
    color: "",
    size: 16,
    width: undefined,
    height: undefined,
  }
);
const iconName = computed(() => `#icon-${props.iconClass}`);
const svgClass = computed(() => {
  if (props.className) {
    return `svg-icon ${props.className}`;
  }
  return "svg-icon";
});
</script>

<style scope lang="scss">
.sub-el-icon,
.nav-icon {
  display: inline-block;
  font-size: 15px;
  margin-right: 12px;
  position: relative;
}

.svg-icon {
  //width: 1em;
  // height: 1em;
  position: relative;
  fill: currentColor;
  vertical-align: -2px;
}
</style>
