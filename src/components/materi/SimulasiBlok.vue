<script setup lang="ts">
import type { Component } from "vue";
import SimulasiDifusi from "@/components/simulasi/SimulasiDifusi.vue";
import SimulasiEfekRumahKaca from "@/components/simulasi/SimulasiEfekRumahKaca.vue";
import SimulasiEnergiTermal from "@/components/simulasi/SimulasiEnergiTermal.vue";
import SimulasiPartikelGas from "@/components/simulasi/SimulasiPartikelGas.vue";
import type { BlokSimulasi, IdWidgetSimulasi } from "@/types/kegiatan";

const props = defineProps<{ blok: BlokSimulasi }>();

// Semua simulasi adalah widget buatan sendiri (ramah layar sentuh) yang dipilih lewat field `widget`.
const petaWidget: Record<IdWidgetSimulasi, Component> = {
  "partikel-gas": SimulasiPartikelGas,
  difusi: SimulasiDifusi,
  "energi-termal": SimulasiEnergiTermal,
  "efek-rumah-kaca": SimulasiEfekRumahKaca,
};

// Isi JSON tidak diperiksa saat kompilasi, jadi nilai `widget` bisa saja tidak dikenal.
const widget: Component | undefined = petaWidget[props.blok.widget];
if (!widget) console.warn(`Widget simulasi tidak dikenal: ${props.blok.widget}`);
</script>

<template>
  <div class="flex flex-col gap-2">
    <p v-if="blok.judul" class="font-semibold text-ink-800">{{ blok.judul }}</p>

    <div v-if="blok.instruksi?.length" class="rounded-xl bg-ink-100 p-3 text-sm text-ink-700">
      <p class="mb-1.5 font-semibold text-ink-800">Langkah kerja</p>
      <ol class="flex list-decimal flex-col gap-1 pl-5 marker:font-semibold marker:text-accent-1">
        <li v-for="(langkah, i) in blok.instruksi" :key="i">{{ langkah }}</li>
      </ol>
    </div>

    <div v-if="widget" class="mt-2 flex flex-col gap-2 border-t border-ink-200 pt-4">
      <component :is="widget" />
    </div>

    <p v-else class="rounded-xl border border-dashed border-ink-300 bg-white p-4 text-sm text-ink-600">
      Simulasi belum tersedia
    </p>
  </div>
</template>
