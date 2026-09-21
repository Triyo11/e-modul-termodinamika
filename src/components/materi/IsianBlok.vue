<script setup lang="ts">
import { computed, ref } from "vue";
import { renderTeksCampuran } from "@/lib/mathText";
import { useJawabanTersimpan } from "@/lib/jawabanTersimpan";
import type { BlokIsian } from "@/types/kegiatan";

const props = defineProps<{ blok: BlokIsian; kegiatanId: string }>();

const pertanyaanHtml = computed(() => renderTeksCampuran(props.blok.pertanyaan));
const petunjukHtml = computed(() => renderTeksCampuran(props.blok.petunjuk ?? ""));
const jawaban = useJawabanTersimpan(`${props.kegiatanId}:${props.blok.id}`, "");
const sudahDiperiksa = ref(false);

const cocok = computed(() => {
  if (props.blok.format !== "angka" || props.blok.jawabanRujukan === undefined) return null;
  const nilai = Number(jawaban.value);
  if (Number.isNaN(nilai)) return false;
  const toleransi = props.blok.toleransi ?? 0;
  return Math.abs(nilai - props.blok.jawabanRujukan) <= toleransi;
});

function periksa() {
  sudahDiperiksa.value = true;
}
</script>

<template>
  <div class="rounded-xl border border-ink-200 p-4">
    <p class="text-justify font-medium text-ink-800" v-html="pertanyaanHtml"></p>

    <textarea
      v-if="blok.format === 'teks-panjang'"
      v-model="jawaban"
      :rows="blok.baris ?? 3"
      placeholder="Tulis jawaban Anda di sini..."
      class="mt-3 w-full resize-y rounded-lg border border-ink-200 p-2.5 text-md text-ink-800 outline-none focus:border-accent"
    ></textarea>

    <div v-else class="mt-3 flex flex-wrap items-center gap-2">
      <input
        v-model="jawaban"
        type="number"
        :inputmode="(blok.inputmode as any) ?? 'decimal'"
        placeholder="0"
        class="w-32 rounded-lg border border-ink-200 p-2.5 text-sm text-ink-800 outline-none focus:border-accent"
        @change="sudahDiperiksa = false"
      />
      <span v-if="blok.satuan" class="text-sm text-ink-500">{{ blok.satuan }}</span>
      <button
        type="button"
        class="rounded-lg bg-accent px-3 py-2 text-sm font-medium text-accent-1"
        @click="periksa"
      >
        Periksa jawaban
      </button>
      <p v-if="sudahDiperiksa" class="w-full text-sm font-medium" :class="cocok ? 'text-benar' : 'text-salah'">
        {{ cocok ? "Jawaban Anda sesuai rentang yang diharapkan." : "Coba periksa kembali perhitungan Anda." }}
      </p>
    </div>

    <details v-if="blok.petunjuk" class="mt-2 text-sm text-ink-500">
      <summary class="cursor-pointer select-none">Petunjuk</summary>
      <p class="mt-1" v-html="petunjukHtml"></p>
    </details>
  </div>
</template>
