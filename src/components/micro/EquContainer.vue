<script setup lang="ts">
import { ref, onMounted } from "vue";
import katex from "katex";
import "katex/dist/katex.min.css";

const mathContainer = ref<HTMLElement | null>(null);

const props = defineProps<{
  rumus: string;
}>();

onMounted(() => {
  katex.render(props.rumus, mathContainer.value!, {
    displayMode: true,
    throwOnError: false,
  });
});
</script>

<template>
  <div ref="mathContainer"></div>
</template>
