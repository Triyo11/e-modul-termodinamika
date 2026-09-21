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
      simbolHtml: renderTexInline(k.simbol),
      artiHtml: renderTeksCampuran(k.arti),
    })) ?? [],
);
</script>

<template>
  <div class="rounded-xl border border-ink-200 bg-white p-4">
    <div class="flex items-start gap-3">
      <span
        v-if="blok.nomor"
        class="shrink-0 rounded-md border border-accent/30 bg-accent/10 px-2 py-1 text-xs font-semibold text-accent"
      >
        {{ blok.nomor }}
      </span>
      <div class="min-w-0 flex-1 overflow-x-auto">
        <EquContainer :rumus="blok.tex" />
      </div>
    </div>
    <ul v-if="keterangan.length" class="mt-3 flex flex-col gap-1 border-t border-ink-100 pt-3 text-sm text-ink-600">
      <li v-for="k in keterangan" :key="k.simbol" class="flex flex-wrap items-baseline gap-1.5">
        <span v-html="k.simbolHtml"></span>
        <span>: <span v-html="k.artiHtml"></span><template v-if="k.satuan && k.satuan !== '-'"> ({{ k.satuan }})</template></span>
      </li>
    </ul>
  </div>
</template>
