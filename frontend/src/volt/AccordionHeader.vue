<template>
    <AccordionHeader
        unstyled
        :pt="theme"
        :ptOptions="{
            mergeProps: ptViewMerge
        }"
    >
        <template #toggleicon="{ active }">
            <ChevronDownIcon v-if="active" />
            <ChevronUpIcon v-else />
        </template>
        <slot></slot>
    </AccordionHeader>
</template>

<script setup lang="ts">
import ChevronUpIcon from '@primevue/icons/chevronup';
import ChevronDownIcon from '@primevue/icons/chevrondown';
import AccordionHeader, { type AccordionHeaderPassThroughOptions, type AccordionHeaderProps } from 'primevue/accordionheader';
import { ref } from 'vue';
import { ptViewMerge } from './utils';

interface Props extends /* @vue-ignore */ AccordionHeaderProps {}
defineProps<Props>();

const theme = ref<AccordionHeaderPassThroughOptions>({
    root: `cursor-pointer disabled:pointer-events-none disabled:opacity-60 flex items-center justify-between p-[1.125rem] font-semibold
        bg-surface-0
        text-surface-500
        hover:text-surface-700
        p-active:text-surface-700
        transition-colors duration-200
        focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-[-1px] focus-visible:outline-primary`
});
</script>
