<script setup lang="ts">
import { computed } from "vue";
import EquContainer from "@/components/micro/EquContainer.vue";
import { renderTeksCampuran, renderTexInline } from "@/lib/mathText";
import type { BlokRumus } from "@/types/kegiatan";

const props = defineProps<{ blok: BlokRumus }>();
const keterangan = computed(
  () =>
    props.blok.keterangan?.map((k) => ({
      ...k,
      simbolHtml: Array.isArray(k.simbol)
        ? k.simbol.map((simbol) => renderTexInline(simbol)).join(", ")
        : renderTexInline(k.simbol),
      artiHtml: renderTeksCampuran(k.arti),
    })) ?? [],
);
</script>

<template>
  <div class="rounded-xl border border-ink-200 bg-surface p-4">
    <div class="relative flex items-start gap-3">
      <span
        v-if="blok.nomor"
        class="absolute left-5 top-4 -translate-x-1/2 -translate-y-1/2 shrink-0 rounded-md border border-accent/30 bg-accent/10 px-2 py-1 text-xs font-semibold text-accent"
      >
        {{ blok.nomor }}
      </span>
      <div class="min-w-0 flex-1 overflow-x-auto">
        <EquContainer :rumus="blok.tex" />
      </div>
    </div>
    <!-- Kolom 1 (simbol) selebar simbol terpanjang, sehingga titik dua di kolom 2 lurus dari atas ke bawah -->
    <ul
      v-if="keterangan.length"
      class="mt-3 grid grid-cols-[max-content_auto_minmax(0,1fr)] items-baseline gap-x-1.5 gap-y-1 border-t border-ink-100 pt-3 text-sm text-ink-600"
    >
      <li
        v-for="(k, i) in keterangan"
        :key="`${i}-${k.simbol}`"
        class="col-span-full grid grid-cols-subgrid items-baseline"
      >
        <template v-if="k.simbol">
          <span class="whitespace-nowrap" v-html="k.simbolHtml"></span>
          <span>:</span>
        </template>
        <div :class="k.simbol ? '' : 'col-span-full'">
          <span v-html="k.artiHtml"></span>
          <template v-if="k.satuan && k.satuan !== '-'"> ({{ k.satuan }})</template>
        </div>
      </li>
    </ul>
  </div>
</template>
