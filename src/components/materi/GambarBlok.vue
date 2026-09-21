<script setup lang="ts">
import type { BlokGambar } from "@/types/kegiatan";

const props = defineProps<{ blok: BlokGambar }>();
const rasioStyle = props.blok.rasio ? { aspectRatio: props.blok.rasio.replace("/", " / ") } : undefined;
</script>

<template>
  <figure class="flex flex-col gap-2">
    <div class="overflow-hidden max-h-80 lg:max-h-96 w-full rounded-xl border border-ink-200 bg-ink-100" :style="rasioStyle">
      <img :src="blok.src" :alt="blok.alt" class="h-full w-full object-cover" loading="lazy" />
    </div>
    <figcaption v-if="blok.caption" class="text-sm text-ink-600">
      {{ blok.caption }}
      <span v-if="blok.sumber" class="text-ink-400">· {{ blok.sumber }}</span>
    </figcaption>
  </figure>
</template>
