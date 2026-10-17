<script setup lang="ts">
import type { Ref } from "vue";
import { useJawabanTersimpan } from "@/lib/jawabanTersimpan";
import type { LangkahRancangan } from "@/types/kegiatan";

const props = defineProps<{ langkah: LangkahRancangan; kegiatanId: string; tugasId: string }>();

const labelTahap: Record<string, string> = {
  "menetapkan-masalah": "Menetapkan masalah",
  merancang: "Merancang",
  "analisis-kelayakan": "Analisis kelayakan",
  menyajikan: "Menyajikan",
  memperbaiki: "Memperbaiki",
};

const kolom = props.langkah.kolom ?? [];
const modeTabel = props.langkah.format === "tabel";
const tersimpan = useJawabanTersimpan<string | string[][]>(
  `${props.kegiatanId}:${props.tugasId}:${props.langkah.id}`,
  modeTabel ? Array.from({ length: props.langkah.jumlahBaris ?? 3 }, () => kolom.map(() => "")) : "",
);
const teks = tersimpan as Ref<string>;
const tabel = tersimpan as Ref<string[][]>;

function ubah(i: number, j: number, nilai: string) {
  const salinan = tabel.value.map((b) => [...b]);
  salinan[i]![j] = nilai;
  tabel.value = salinan;
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <span class="text-xs font-semibold uppercase tracking-wide text-accent">
      {{ labelTahap[langkah.tahap] ?? langkah.tahap }}
    </span>
    <p class="text-sm text-ink-800">{{ langkah.instruksi }}</p>

    <div v-if="modeTabel" class="overflow-x-auto">
      <table class="w-full border-collapse text-left text-sm">
        <thead>
          <tr class="border-b border-ink-200">
            <th v-for="k in kolom" :key="k" class="py-2 pr-2 font-semibold text-ink-800">{{ k }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(b, i) in tabel" :key="i" class="border-b border-ink-100">
            <td v-for="(k, j) in kolom" :key="k" class="py-1.5 pr-2">
              <input
                :value="b[j] ?? ''"
                inputmode="decimal"
                :aria-label="`${k} baris ${i + 1}`"
                class="w-full min-w-20 rounded-md border border-ink-200 p-1.5 text-ink-800 outline-none focus:border-accent"
                @input="ubah(i, j, ($event.target as HTMLInputElement).value)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <textarea
      v-else
      v-model="teks"
      rows="4"
      :placeholder="
        langkah.format === 'unggah-atau-teks'
          ? 'Tulis hasil kelompok atau tempel tautan berkas di sini...'
          : 'Tulis jawaban kelompok di sini...'
      "
      class="w-full resize-y rounded-lg border border-ink-200 p-2.5 text-md text-ink-800 outline-none focus:border-accent"
    ></textarea>
  </div>
</template>
