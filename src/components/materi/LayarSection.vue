<script setup lang="ts">
import BlokRenderer from "./BlokRenderer.vue";
import type { Layar } from "@/types/kegiatan";

defineProps<{ layar: Layar; kegiatanId: string }>();

const labelPeran: Record<string, string> = {
  apersepsi: "Apersepsi",
  konsep: "Konsep",
  penerapan: "Penerapan",
  latihan: "Latihan",
};
</script>

<template>
  <section class="flex flex-col gap-4">
    <header class="flex flex-col gap-1">
      <span class="text-xs font-semibold uppercase tracking-wide text-accent">
        {{ labelPeran[layar.peran] ?? layar.peran }}
      </span>
      <h2 class="text-xl font-semibold text-ink-900">{{ layar.judul }}</h2>
    </header>

    <BlokRenderer v-for="(b, i) in layar.blok" :key="`${layar.id}-${i}`" :blok="b" :kegiatan-id="kegiatanId" />
  </section>
</template>
