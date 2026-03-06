<template>
  <n-button
    :size="size"
    :loading="loading"
    :disabled="disabled"
    :round="round"
    :secondary="isSecondary"
    :bordered="computedBordered"
    :text="props.type === 'text'"
    :style="{ color: computedTextColor }"
    :class="buttonClass"
    @click="$emit('click', $event)"
    v-bind="$attrs"
  >
    <slot name="icon"></slot>
    <slot></slot>
  </n-button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";

defineOptions({
  name: "BabeButton",
});

interface PropsItem {
  text?: string;
  loadingText?: string;
  type?: "primary" | "default" | "secondary" | "text" | "warning";
  size?: "small" | "medium" | "large";
  block?: boolean;
  loading?: boolean;
  disabled?: boolean;
  round?: boolean;
  bordered?: boolean;
}

const { t } = useI18n();

const props = withDefaults(defineProps<PropsItem>(), {
  text: "",
  loadingText: "",
  type: "primary",
  size: "large",
  block: false,
  loading: false,
  disabled: false,
  round: true,
  bordered: false,
});

// 计算按钮尺寸
const size = computed(() => {
  if (props.size) return props.size;
  return props.type === "text" ? "small" : "large";
});

// 计算按钮类型
const buttonType = computed(() => {
  if (props.type === "primary") return "primary";
  if (props.type === "default") return "default";
  if (props.type === "secondary") return "default";
  if (props.type === "text") return "default";
  return "primary";
});

// 计算是否为 secondary
const isSecondary = computed(() => {
  return props.type === "secondary";
});

// 计算 bordered 属性
const computedBordered = computed(() => {
  return props.type !== "primary" && props.type !== "text" && props.type !== "warning";
});

// 计算文字颜色
const computedTextColor = computed(() => {
  if (props.type === "primary" || props.type === "warning") {
    return "white";
  }
  return "";
});

// 计算按钮类名
const buttonClass = computed(() => {
  const classes = [];
  if (props.type === "primary") {
    classes.push("bg-gradient-to-r from-[#7562ff] to-[#b462ff]");
    classes.push("border-0");
    classes.push("font-bold");
  }
  if (props.type === "warning") {
    classes.push("!bg-[#FFBF06]");
    classes.push("!border-[#FFBF06]");
    classes.push("shadow-[0_4px_12px_rgba(255,191,6,0.3)]");
    classes.push("active:!bg-[#E6AC05]");
    classes.push("active:!border-[#E6AC05]");
    classes.push("border-0");
    classes.push("font-bold");
    classes.push("transition-all");
    classes.push("duration-300");
  }
  if (props.block) {
    classes.push("w-full");
  }
  // 设置 large 尺寸的高度
  if (props.size === "large") {
    classes.push("h-[46px]");
  }
  // 设置 medium 尺寸的高度
  if (props.size === "medium") {
    classes.push("h-[36px]");
  }

  return classes.join(" ");
});

const emit = defineEmits(["click"]);
</script>

<style scoped lang="scss">
/* 可以在这里添加额外的样式 */
:deep(.n-button) {
  padding: 0 12px;
}
</style>
