<script setup lang="ts">
import { PhImage, PhVideoCamera } from "@phosphor-icons/vue";

defineProps<{ jenis: "gambar" | "video"; alt: string }>();
</script>

<template>
  <div
    class="flex h-full w-full flex-col items-center justify-center gap-2 border-2 border-dashed border-ink-300 p-4 text-center text-ink-500"
    role="img"
    :aria-label="alt"
  >
    <PhVideoCamera v-if="jenis === 'video'" :size="32" />
    <PhImage v-else :size="32" />
    <p class="text-sm">{{ alt }}</p>
    <span class="rounded-full bg-periksa/10 px-2 py-0.5 text-xs font-medium text-periksa">Media belum tersedia</span>
  </div>
</template>
