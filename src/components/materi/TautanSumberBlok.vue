<script setup lang="ts">
import { PhArrowSquareOut } from "@phosphor-icons/vue";
import type { BlokTautanSumber } from "@/types/kegiatan";

defineProps<{ blok: BlokTautanSumber }>();
</script>

<template>
  <div class="flex flex-col gap-2 rounded-xl border border-ink-200 bg-white p-4">
    <p class="font-semibold text-ink-800">{{ blok.judul ?? "Sumber terpercaya" }}</p>
    <ul class="flex flex-col gap-3">
      <li v-for="s in blok.daftar" :key="s.url" class="flex flex-col gap-0.5">
        <a
          :href="s.url"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-1 font-medium text-accent-1 underline underline-offset-2"
        >
          {{ s.judul }} <PhArrowSquareOut :size="14" />
        </a>
        <span class="text-xs text-ink-500">
          {{ s.penerbit }}<template v-if="s.bahasa"> · Bahasa {{ s.bahasa }}</template>
        </span>
        <span v-if="s.kegunaan" class="text-sm text-ink-700">{{ s.kegunaan }}</span>
      </li>
    </ul>
  </div>
</template>
