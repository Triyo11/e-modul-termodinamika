<script setup lang="ts">
import { type Component, ref } from "vue";
import { PhArrowSquareOut, PhPlay } from "@phosphor-icons/vue";
import SimulasiDifusi from "@/components/simulasi/SimulasiDifusi.vue";
import SimulasiEfekRumahKaca from "@/components/simulasi/SimulasiEfekRumahKaca.vue";
import SimulasiEnergiTermal from "@/components/simulasi/SimulasiEnergiTermal.vue";
import SimulasiPartikelGas from "@/components/simulasi/SimulasiPartikelGas.vue";
import type { BlokSimulasi } from "@/types/kegiatan";

const props = defineProps<{ blok: BlokSimulasi }>();

// Simulasi buatan sendiri (ramah layar sentuh) meniru layar PhET berikut:
// Gas Properties (Ideal/Explore dan Diffusion), Energy Forms and Changes (Intro), dan Greenhouse Effect.
// Simulasi lain tetap disematkan dari PhET.
function pilihSimulasiInternal(): Component | null {
  const { src, judul } = props.blok;
  if (src.includes("gas-properties")) return /diffusion/i.test(judul ?? "") ? SimulasiDifusi : SimulasiPartikelGas;
  if (src.includes("energy-forms-and-changes")) return SimulasiEnergiTermal;
  if (src.includes("greenhouse-effect")) return SimulasiEfekRumahKaca;
  return null;
}
const simulasiInternal = pilihSimulasiInternal();

const rasioStyle = { aspectRatio: (props.blok.rasio ?? "16/10").replace("/", " / ") };
// iframe baru dimuat setelah diketuk agar halaman tetap ringan.
const dimuat = ref(false);
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

    <div v-if="simulasiInternal" class="mt-2 flex flex-col gap-2 border-t border-ink-200 pt-4">
      <component :is="simulasiInternal" />
    </div>

    <div
      v-else
      class="w-full overflow-hidden rounded-xl border border-ink-200 bg-ink-100"
      :style="rasioStyle"
    >
      <iframe
        v-if="dimuat"
        :src="blok.src"
        :title="blok.judul ?? 'Simulasi PhET'"
        class="h-full w-full border-0"
        allowfullscreen
      ></iframe>
      <button
        v-else
        type="button"
        class="flex h-full w-full flex-col items-center justify-center gap-2 text-ink-600 hover:bg-ink-200/60"
        @click="dimuat = true"
      >
        <span class="flex h-14 w-14 items-center justify-center rounded-full bg-accent-1 text-white">
          <PhPlay :size="28" weight="fill" />
        </span>
        <span class="text-sm font-medium">Muat simulasi PhET</span>
      </button>
    </div>

    <a
      :href="blok.src"
      target="_blank"
      rel="noopener"
      class="inline-flex items-center gap-1 self-start text-sm text-accent-1 underline underline-offset-2"
    >
      Buka simulasi PhET di tab baru <PhArrowSquareOut :size="14" />
    </a>
  </div>
</template>
