<script setup lang="ts">
import BlokRenderer from "./BlokRenderer.vue";
import type { Layar } from "@/types/kegiatan";

defineProps<{ layar: Layar; kegiatanId: string }>();

const labelPeran: Record<string, string> = {
  apersepsi: "Apersepsi",
  konsep: "Konsep",
  penerapan: "Penerapan",
  latihan: "Latihan",
  // Tahap STEM-CTL (skema 2.0)
  konstruktivisme: "Konstruktivisme",
  inkuiri: "Inkuiri",
  bertanya: "Bertanya",
  "masyarakat-belajar": "Masyarakat belajar",
  pemodelan: "Pemodelan",
  refleksi: "Refleksi",
  "penilaian-autentik": "Penilaian autentik",
};

const labelStem: Record<string, string> = {
  S: "Sains",
  T: "Teknologi",
  R: "Rekayasa",
  M: "Matematika",
};
</script>

<template>
  <section class="flex flex-col gap-4">
    <header class="flex flex-col gap-1">
      <div class="flex flex-wrap items-center gap-2">
        <span class="text-xs font-semibold uppercase tracking-wide text-accent">
          {{ labelPeran[layar.tahap ?? layar.peran ?? ""] ?? layar.tahap ?? layar.peran }}
        </span>
        <span
          v-for="s in layar.stem"
          :key="s"
          :title="labelStem[s]"
          class="rounded-full border border-ink-200 bg-white px-2 py-0.5 text-[11px] font-semibold text-ink-600"
        >
          {{ s }}
        </span>
      </div>
      <h2 class="text-xl font-semibold text-ink-900">{{ layar.judul }}</h2>
    </header>

    <BlokRenderer v-for="(b, i) in layar.blok" :key="`${layar.id}-${i}`" :blok="b" :kegiatan-id="kegiatanId" />
  </section>
</template>
