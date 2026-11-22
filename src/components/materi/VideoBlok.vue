<script setup lang="ts">
import MediaKosong from "./MediaKosong.vue";
import type { BlokVideo } from "@/types/kegiatan";

const props = defineProps<{ blok: BlokVideo }>();
const rasioStyle = { aspectRatio: (props.blok.rasio ?? "16/9").replace("/", " / ") };
</script>

<template>
  <figure class="flex flex-col gap-2">
    <div class="overflow-hidden w-full rounded-xl border border-ink-200 bg-ink-100" :style="rasioStyle">
      <video
        v-if="blok.src"
        :src="blok.src"
        :poster="blok.poster ?? undefined"
        :aria-label="blok.alt"
        controls
        playsinline
        preload="metadata"
        class="h-full w-full object-cover"
      ></video>
      <MediaKosong v-else jenis="video" :alt="blok.alt" />
    </div>
    <figcaption v-if="blok.caption" class="text-sm text-ink-600">
      {{ blok.caption }}
      <span v-if="blok.sumber" class="text-ink-500">· {{ blok.sumber }}</span>
    </figcaption>
  </figure>
</template>
