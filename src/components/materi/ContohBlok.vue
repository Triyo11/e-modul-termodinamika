<script setup lang="ts">
import { computed } from "vue";
import { renderTeksCampuran } from "@/lib/mathText";
import type { BlokContoh } from "@/types/kegiatan";

const props = defineProps<{ blok: BlokContoh }>();
const soalHtml = computed(() => renderTeksCampuran(props.blok.soal));
const langkahHtml = computed(() => props.blok.langkah.map((l) => renderTeksCampuran(l)));
const catatanHtml = computed(() => (props.blok.catatan ? renderTeksCampuran(props.blok.catatan) : ""));
</script>

<template>
  <div class="rounded-xl border border-accent/30 bg-accent/5 p-4">
    <p class="font-semibold text-accent">{{ blok.judul ?? "Contoh soal" }}</p>
    <p class="mt-2 text-body leading-relaxed text-ink-800" v-html="soalHtml"></p>
    <ol class="mt-3 flex list-decimal flex-col gap-1.5 pl-5 text-sm leading-relaxed text-ink-700">
      <li v-for="(l, i) in langkahHtml" :key="i" v-html="l"></li>
    </ol>
    <p v-if="blok.catatan" class="mt-3 border-t text-justify border-accent/20 pt-2 text-sm text-ink-600" v-html="catatanHtml"></p>
  </div>
</template>
