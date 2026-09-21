<script setup lang="ts">
const props = defineProps<{
  namebutton: string;
  pathbutton: string;
}>();
</script>

<template>
  <button
    @click="() => $router.push({ name: pathbutton })"
    class="flex-1 min-h-11 flex items-center justify-center cursor-pointer
      hover:bg-ink-100 active:bg-ink-200"
  >
    <span class="text-md font-sans font-semibold">{{ namebutton }}</span>
  </button>
</template>
