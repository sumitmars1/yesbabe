<template>
  <n-upload
    action="https://www.mocky.io/v2/5e4bafc63100007100d8b70f"
    :default-file-list="fileList"
  >
    <slot> </slot>
  </n-upload>
</template>

<script lang="ts" setup>
import { ref } from "vue";

const fileList = ref([]);
</script>
<style></style>
