<!-- components/Card.vue -->
<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface CardProps {
    title?: string
    subtitle?: string
    buttonLabel?: string
    backgroundColor?: string
    showDiamond?: boolean
    diamondSrc?: string
}

const props = withDefaults(defineProps<CardProps>(), {
    title: undefined,
    subtitle: undefined,
    buttonLabel: undefined,
    backgroundColor: 'bg-red-500',
    showDiamond: false,
    diamondSrc: '/path/to/diamond.svg'
})

const emit = defineEmits(['click'])
</script>

<template>
    <div :class="[`rounded-2xl  flex flex-col justify-between `, props.backgroundColor]"
        class="text-white h-[124px] p-[18px] ">
        <div>
            <div class="text-base font-semibold mb-2">{{ title || t('components.advertiseCard.defaultTitle') }}</div>
        <div class="text-sm opacity-80 leading-normal">{{ subtitle || t('components.advertiseCard.defaultSubtitle') }}</div>
        </div>
        <div>
            <div style="background-color: rgba(0, 0, 0, 0.2);"
                class="px-5 py-1 rounded-full relative inline-flex items-center">
                <span class="mr-1">{{ buttonLabel || t('components.advertiseCard.defaultButton') }}</span>
                <svg-icon class="w-5" iconClass="arrow-left" size="18" />
            </div>
        </div>
    </div>
</template>