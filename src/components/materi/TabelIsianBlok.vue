<script setup lang="ts">
import { computed } from "vue";
import { useJawabanTersimpan } from "@/lib/jawabanTersimpan";
import { formatAngka, isiAwal, nilaiBaris, type BarisTabel } from "@/lib/tabelIsian";
import type { BlokTabelIsian, KolomTabelIsian } from "@/types/kegiatan";

const props = defineProps<{ blok: BlokTabelIsian; kegiatanId: string }>();

const baris = useJawabanTersimpan<BarisTabel[]>(
  `${props.kegiatanId}:${props.blok.id}`,
  Array.from({ length: props.blok.jumlahBaris }, () => ({})),
);

const hasil = computed(() => baris.value.map((b) => nilaiBaris(props.blok.kolom, b)));

function ubah(i: number, kunci: string, nilai: string) {
  const salinan = baris.value.map((b) => ({ ...b }));
  while (salinan.length <= i) salinan.push({});
  salinan[i]![kunci] = nilai;
  baris.value = salinan;
}

function label(k: KolomTabelIsian) {
  return k.satuan && k.satuan !== "-" ? `${k.label} (${k.satuan})` : k.label;
}
</script>

<template>
  <div class="flex flex-col gap-2 rounded-xl border border-ink-200 p-4">
    <p v-if="blok.judul" class="font-semibold text-ink-800">{{ blok.judul }}</p>
    <p v-if="blok.instruksi" class="text-sm text-ink-600">{{ blok.instruksi }}</p>

    <div class="overflow-x-auto">
      <table class="w-full border-collapse text-left text-sm">
        <thead>
          <tr class="border-b border-ink-200">
            <th class="py-2 pr-2 font-semibold text-ink-500">No.</th>
            <th v-for="k in blok.kolom" :key="k.kunci" class="py-2 pr-2 font-semibold text-ink-800">
              {{ label(k) }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(_, i) in blok.jumlahBaris" :key="i" class="border-b border-ink-100">
            <td class="py-1.5 pr-2 text-ink-500">{{ i + 1 }}</td>
            <td v-for="(k, j) in blok.kolom" :key="k.kunci" class="py-1.5 pr-2">
              <span v-if="isiAwal(blok, i, j) !== undefined" class="block p-1.5 font-medium text-ink-800">
                {{ isiAwal(blok, i, j) }}
              </span>
              <span v-else-if="k.tipe === 'hitung'" class="block rounded-md bg-ink-100 p-1.5 text-ink-600">
                {{ formatAngka(hasil[i]?.[k.kunci] ?? null) }}
              </span>
              <input
                v-else
                :value="baris[i]?.[k.kunci] ?? ''"
                type="text"
                :inputmode="k.tipe === 'angka' ? 'decimal' : 'text'"
                :aria-label="`${label(k)} baris ${i + 1}`"
                class="w-full min-w-20 rounded-md border border-ink-200 p-1.5 text-ink-800 outline-none focus:border-accent"
                @input="ubah(i, k.kunci, ($event.target as HTMLInputElement).value)"
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="blok.kolom.some((k) => k.tipe === 'hitung')" class="text-xs text-ink-400">
      Kolom abu-abu dihitung otomatis dari isian Anda.
    </p>
  </div>
</template>
