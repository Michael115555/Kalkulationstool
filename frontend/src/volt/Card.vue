<template>
    <Card
        unstyled
        :pt="theme"
        :ptOptions="{
            mergeProps: ptViewMerge
        }"
    >
        <template v-for="(_, slotName) in $slots" #[slotName]="slotProps">
            <slot :name="slotName" v-bind="slotProps ?? {}" />
        </template>
    </Card>
</template>

<script setup lang="ts">
import Card, { type CardPassThroughOptions, type CardProps } from 'primevue/card';
import { ref } from 'vue';
import { ptViewMerge } from './utils';

interface Props extends /* @vue-ignore */ CardProps {}
defineProps<Props>();

const theme = ref<CardPassThroughOptions>({
    root: `flex flex-col rounded-xl
        bg-surface-0
        text-surface-700
        shadow-md`,
    header: ``,
    body: `p-5 flex flex-col gap-2`,
    caption: `flex flex-col gap-2`,
    title: `font-medium text-xl`,
    subtitle: `text-surface-500`,
    content: ``,
    footer: ``
});
</script>
