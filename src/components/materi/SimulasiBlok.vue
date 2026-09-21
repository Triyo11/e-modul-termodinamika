<script setup lang="ts">
import SimulasiPartikelGas from "./SimulasiPartikelGas.vue";
import type { BlokSimulasi } from "@/types/kegiatan";

const props = defineProps<{ blok: BlokSimulasi }>();
// const rasioStyle = props.blok.rasio ? { aspectRatio: props.blok.rasio.replace("/", " / ") } : undefined;
</script>

<template>
  <div class="flex flex-col gap-2">
    <p v-if="blok.judul" class="font-semibold text-ink-800">{{ blok.judul }}</p>
    <!-- <div class="overflow-hidden rounded-xl border border-ink-200 bg-ink-100" :style="rasioStyle">
      <iframe :src="blok.src" :title="blok.judul ?? 'Simulasi'" class="h-full w-full border-0" loading="lazy" allowfullscreen></iframe>
    </div> -->
    <div class="mt-2 flex flex-col gap-2 border-t border-ink-200 pt-4">
      <!-- <p class="font-semibold text-ink-800">Coba versi interaktif di e-modul ini</p> -->
      <SimulasiPartikelGas />
    </div>
    <p v-if="blok.instruksi" class="text-sm text-ink-600">{{ blok.instruksi }}</p>
    <a :href="blok.src" target="_blank" rel="noopener" class="self-start text-sm text-accent underline underline-offset-2">
      Buka simulasi phet di tab baru
    </a>
  </div>
</template>
