<template>
  <div class="h-full box-border text-primary bg-background px-cardXPadding py-4 flex flex-col">
    <div class="flex-1 min-h-0">
      <ConsumptionDetailContent :is-page="true" />
    </div>
  </div>
</template>

<script setup lang="ts">
import ConsumptionDetailContent from "@/components/ConsumptionDetailModal/ConsumptionDetailContent.vue";
</script>
