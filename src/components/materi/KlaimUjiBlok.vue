<script setup lang="ts">
import { PhArrowSquareOut, PhSealQuestion } from "@phosphor-icons/vue";
import { useJawabanTersimpan } from "@/lib/jawabanTersimpan";
import type { BlokKlaimUji } from "@/types/kegiatan";

const props = defineProps<{ blok: BlokKlaimUji; kegiatanId: string }>();

/** Penilaian per sumber per aspek, mis. { s1: { penulis: "Ya" } }. */
const penilaian = useJawabanTersimpan<Record<string, Record<string, string>>>(
  `${props.kegiatanId}:${props.blok.id}`,
  {},
);

function nilai(sumberId: string, aspekId: string, pilihan: string) {
  penilaian.value = {
    ...penilaian.value,
    [sumberId]: { ...penilaian.value[sumberId], [aspekId]: pilihan },
  };
}

function tanggal(t?: string) {
  if (!t) return "";
  return new Date(t).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}
</script>

<template>
  <div class="flex flex-col gap-4 rounded-xl border border-accent-1/30 bg-accent-1/5 p-4">
    <div class="flex gap-3">
      <PhSealQuestion :size="32" class="shrink-0 text-accent-1" weight="bold" />
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-accent-1">Uji klaim</p>
        <p class="font-semibold text-ink-900">“{{ blok.klaim }}”</p>
        <p v-if="blok.konteks" class="mt-1 text-sm text-ink-600">{{ blok.konteks }}</p>
      </div>
    </div>

    <div v-for="s in blok.sumber" :key="s.id" class="flex flex-col gap-3 rounded-lg border border-ink-200 bg-white p-3">
      <div class="flex flex-col gap-0.5">
        <span class="text-xs font-semibold uppercase text-ink-500">Sumber {{ s.id }}</span>
        <a
          :href="s.url"
          target="_blank"
          rel="noopener"
          class="inline-flex items-center gap-1 font-medium text-accent-1 underline underline-offset-2"
        >
          {{ s.judul }} <PhArrowSquareOut :size="14" />
        </a>
        <span class="text-xs text-ink-500">
          {{ s.penerbit }}<template v-if="s.penulis"> · {{ s.penulis }}</template>
          <template v-if="s.tanggal"> · {{ tanggal(s.tanggal) }}</template>
          <template v-if="s.tanggalPembaruan"> (diperbarui {{ tanggal(s.tanggalPembaruan) }})</template>
        </span>
        <span v-if="s.jenis" class="text-xs text-ink-500">
          {{ s.jenis }}<template v-if="s.bahasa"> · Bahasa {{ s.bahasa }}</template>
        </span>
      </div>

      <div v-for="p in blok.daftarPeriksa" :key="p.id" class="flex flex-col gap-1.5 border-t border-ink-100 pt-2">
        <p class="text-sm text-ink-800">
          <span class="font-semibold">{{ p.aspek }}.</span> {{ p.pertanyaan }}
        </p>
        <div class="flex flex-wrap gap-2">
          <button
            v-for="opsi in blok.pilihanPenilaian"
            :key="opsi"
            type="button"
            class="rounded-lg border px-3 py-1 text-sm transition-colors"
            :class="
              penilaian[s.id]?.[p.id] === opsi
                ? 'border-accent-1 bg-accent-1/10 text-accent-1'
                : 'border-ink-200 text-ink-600 hover:border-accent/60'
            "
            @click="nilai(s.id, p.id, opsi)"
          >
            {{ opsi }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
