<script setup lang="ts">
import { computed, inject, toRaw } from "vue";
import { useRoute } from "vue-router";
import BlokRenderer from "./BlokRenderer.vue";
import RangkumanBlok from "./RangkumanBlok.vue";
import { kegiatanKey } from "@/lib/tabelIsian";
import { nomorWorksheetKey } from "@/lib/worksheet";
import type { Layar } from "@/types/kegiatan";

defineProps<{ layar: Layar; kegiatanId: string }>();

const kegiatan = inject(kegiatanKey, null);
const nomorWorksheet = inject(nomorWorksheetKey, null);

// Panduan guru boleh merujuk blok dengan {id}, mis. "{lkpd-1-12}" atau "{r1-4}".
// Rujukan diganti nomor yang tampil ke murid, mis. "Student e-Worksheet 1.11".
const nomorPerId = computed(() => {
  const peta = new Map<string, string>();
  for (const l of kegiatan?.value.layar ?? []) {
    for (const b of l.blok) {
      const no = nomorWorksheet?.value.get(toRaw(b));
      if (!no) continue;
      if ("id" in b) peta.set(b.id, no);
      if (b.tipe === "tugas-rancangan" || b.tipe === "tugas-rancangan-lanjutan")
        for (const s of b.langkah) peta.set(s.id, no);
    }
  }
  return peta;
});
function teksPanduan(teks: string) {
  return teks.replace(/\{([\w-]+)\}/g, (asli, id: string) => {
    const no = nomorPerId.value.get(id);
    return no ? `Student e-Worksheet ${no}` : asli;
  });
}

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
  S: "Sains (Science)",
  T: "Teknologi (Technology)",
  E: "Rekayasa (Engineering)",
  R: "Rekayasa (Engineering)",
  M: "Matematika (Mathematics)",
};

// Mode guru: buka halaman dengan ?guru=1 agar panduan guru tampil.
const route = useRoute();
const modeGuru = computed(() => route.query.guru !== undefined);
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

    <details
      v-if="modeGuru && (layar.panduanGuru || layar.peranGuru)"
      class="rounded-xl border border-dashed border-ink-300 bg-ink-100 p-3 text-sm text-ink-700"
    >
      <summary class="cursor-pointer font-semibold text-ink-800">Panduan guru</summary>
      <p v-if="layar.peranGuru" class="mt-2">{{ layar.peranGuru }}</p>
      <template v-if="layar.panduanGuru">
        <p class="mt-2 font-semibold text-ink-800">Kegiatan guru</p>
        <ol class="list-decimal pl-5">
          <li v-for="(k, i) in layar.panduanGuru.kegiatan" :key="i">{{ teksPanduan(k) }}</li>
        </ol>
        <template v-if="layar.panduanGuru.pertanyaanPemantik?.length">
          <p class="mt-2 font-semibold text-ink-800">Pertanyaan pemantik</p>
          <ul class="list-disc pl-5">
            <li v-for="(q, i) in layar.panduanGuru.pertanyaanPemantik" :key="i">{{ teksPanduan(q) }}</li>
          </ul>
        </template>
        <template v-if="layar.panduanGuru.antisipasi?.length">
          <p class="mt-2 font-semibold text-ink-800">Antisipasi kesulitan murid</p>
          <ul class="list-disc pl-5">
            <li v-for="(a, i) in layar.panduanGuru.antisipasi" :key="i">{{ teksPanduan(a) }}</li>
          </ul>
        </template>
      </template>
    </details>

    <template v-for="(b, i) in layar.blok" :key="`${layar.id}-${i}`">
      <BlokRenderer
        :blok="b"
        :kegiatan-id="kegiatanId"
        :nomor-worksheet="nomorWorksheet?.get(toRaw(b))"
      />
      <RangkumanBlok v-if="'id' in b && b.id === kegiatan?.rangkuman?.tampilSetelah" />
    </template>
  </section>
</template>
