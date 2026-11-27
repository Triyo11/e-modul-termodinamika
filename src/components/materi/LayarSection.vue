<script setup lang="ts">
import { computed, inject, toRaw } from "vue";
import { useRoute } from "vue-router";
import BlokRenderer from "./BlokRenderer.vue";
import RangkumanBlok from "./RangkumanBlok.vue";
import { kegiatanKey } from "@/lib/tabelIsian";
import { nomorWorksheetKey } from "@/lib/worksheet";
import { labelTahap } from "@/lib/tahap";
import type { Blok, Layar } from "@/types/kegiatan";

const props = defineProps<{ layar: Layar; kegiatanId: string }>();

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

// ---------- Pengelompokan blok ----------
// Blok materi pembahasan yang berurutan (teks, foto, video, animasi, tabel, rumus, contoh, callout)
// dikumpulkan dalam satu kotak pembahasan. Blok lain (worksheet, simulasi, kuis, dsb.) berdiri sendiri.
const TIPE_PEMBAHASAN = new Set<Blok["tipe"]>(["teks", "gambar", "video", "animasi", "tabel", "rumus", "contoh", "callout"]);
type Kelompok = { pembahasan: boolean; blok: Blok[]; rangkumanSetelah: boolean };

const kelompok = computed<Kelompok[]>(() => {
  const hasil: Kelompok[] = [];
  for (const b of props.layar.blok) {
    const pembahasan = TIPE_PEMBAHASAN.has(b.tipe);
    const akhir = hasil[hasil.length - 1];
    if (pembahasan && akhir?.pembahasan && !akhir.rangkumanSetelah) akhir.blok.push(b);
    else hasil.push({ pembahasan, blok: [b], rangkumanSetelah: false });
    // Rangkuman tampil setelah blok tertentu: kelompok ditutup di blok itu.
    if ("id" in b && b.id === kegiatan?.value.rangkuman?.tampilSetelah) hasil[hasil.length - 1]!.rangkumanSetelah = true;
  }
  return hasil;
});

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
  <section :data-tahap="layar.tahap" class="flex scroll-mt-24 flex-col gap-6 border-t border-ink-200 pt-10">
    <header class="flex flex-col gap-1">
      <div class="flex flex-wrap items-center gap-2">
        <span class="rounded-[10px] border-2 border-brand px-2.5 py-1 text-xs font-semibold uppercase tracking-wide text-ink-900">
          {{ labelTahap[layar.tahap ?? layar.peran ?? ""] ?? layar.tahap ?? layar.peran }}
        </span>
        <span
          v-for="s in layar.stem"
          :key="s"
          :title="labelStem[s]"
          class="rounded-full border border-accent-4/60 bg-surface px-2 py-0.5 text-[11px] font-semibold text-accent-4-teks"
        >
          {{ s }}
        </span>
      </div>
      <h2 class="text-2xl font-semibold leading-snug text-ink-900">{{ layar.judul }}</h2>
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

    <template v-for="(k, i) in kelompok" :key="`${layar.id}-${i}`">
      <div v-if="k.pembahasan" class="kotak-pembahasan flex flex-col gap-5">
        <BlokRenderer v-for="(b, j) in k.blok" :key="j" :blok="b" :kegiatan-id="kegiatanId" />
      </div>
      <BlokRenderer
        v-else
        :blok="k.blok[0]!"
        :kegiatan-id="kegiatanId"
        :nomor-worksheet="nomorWorksheet?.get(toRaw(k.blok[0]!))"
      />
      <RangkumanBlok v-if="k.rangkumanSetelah" />
    </template>
  </section>
</template>
