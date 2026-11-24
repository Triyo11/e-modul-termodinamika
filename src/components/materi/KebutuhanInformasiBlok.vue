<script setup lang="ts">
import { computed } from "vue";
import { renderTeksCampuran } from "@/lib/mathText";
import { useJawabanTersimpan } from "@/lib/jawabanTersimpan";
import type { BlokKebutuhanInformasi } from "@/types/kegiatan";

const props = defineProps<{ blok: BlokKebutuhanInformasi; kegiatanId: string }>();

const pertanyaanHtml = computed(() => renderTeksCampuran(props.blok.pertanyaan));
const barisKosong = () => props.blok.kolom.map(() => "");
const baris = useJawabanTersimpan<string[][]>(
  `${props.kegiatanId}:${props.blok.id}`,
  Array.from({ length: props.blok.jumlahBaris }, barisKosong),
);

function ubah(i: number, j: number, nilai: string) {
  const salinan = baris.value.map((b) => [...b]);
  salinan[i]![j] = nilai;
  baris.value = salinan;
}

function tambahBaris() {
  baris.value = [...baris.value, barisKosong()];
}
</script>

<template>
  <div class="flex flex-col gap-3 rounded-xl border border-ink-200 p-4">
    <p class="font-medium text-ink-800" v-html="pertanyaanHtml"></p>
    <p v-if="blok.petunjuk" class="text-sm text-ink-500">{{ blok.petunjuk }}</p>

    <div class="flex flex-col gap-3">
      <div v-for="(b, i) in baris" :key="i" class="grid grid-cols-1 gap-2 rounded-lg border border-ink-100 p-2.5">
        <label v-for="(k, j) in blok.kolom" :key="j" class="flex flex-col gap-1">
          <span class="text-xs font-medium uppercase tracking-wide text-ink-500">
            {{ k }}<template v-if="j === 0"> #{{ i + 1 }}</template>
          </span>
          <input
            :value="b[j] ?? ''"
            class="rounded-lg border border-ink-200 p-2 text-sm text-ink-800 outline-none focus:border-accent"
            @input="ubah(i, j, ($event.target as HTMLInputElement).value)"
          />
        </label>
      </div>
    </div>

    <button type="button" class="self-start text-sm text-accent-1 underline underline-offset-2" @click="tambahBaris">
      + Tambah baris
    </button>
  </div>
</template>
