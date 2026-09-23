<script setup lang="ts">
const props = defineProps<{
  linkPath: string;
}>();
</script>

<template>
  <div
    class="menu-shadow relative flex flex-col gap-1.5 rounded-lg border-2 border-brand-dark bg-brand-light p-2"
  >
    <button
      @click="$router.push({ path: props.linkPath })"
      class="relative z-20 flex flex-col gap-1.5 text-left cursor-pointer"
    >
      <slot />
    </button>
  </div>
</template>

<style scoped>
.menu-shadow {
  box-shadow: var(--shadow);
}
</style>
