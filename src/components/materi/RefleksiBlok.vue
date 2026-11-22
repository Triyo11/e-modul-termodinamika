<script setup lang="ts">
import { PhArrowsClockwise } from "@phosphor-icons/vue";
import { useJawabanTersimpan } from "@/lib/jawabanTersimpan";
import type { BlokRefleksi } from "@/types/kegiatan";

const props = defineProps<{ blok: BlokRefleksi; kegiatanId: string }>();

const jawabanAwal = useJawabanTersimpan<string>(`${props.kegiatanId}:${props.blok.tinjauUlang ?? ""}`, "");
const jawaban = useJawabanTersimpan<string[]>(
  `${props.kegiatanId}:${props.blok.id}`,
  props.blok.pertanyaan.map(() => ""),
);

function ubah(i: number, nilai: string) {
  const salinan = [...jawaban.value];
  salinan[i] = nilai;
  jawaban.value = salinan;
}
</script>

<template>
  <div class="flex flex-col gap-3 rounded-xl border border-brand-dark/20 bg-brand-light p-4">
    <div class="flex items-center gap-2 text-brand-dark">
      <PhArrowsClockwise :size="24" weight="bold" />
      <p class="font-semibold">Refleksi</p>
    </div>

    <div v-if="blok.tinjauUlang" class="rounded-lg border border-ink-200 bg-white p-3">
      <p v-if="blok.pengantar" class="text-xs font-medium uppercase tracking-wide text-ink-500">{{ blok.pengantar }}</p>
      <p v-if="jawabanAwal" class="mt-1 whitespace-pre-line font-serif text-sm italic text-ink-700">
        “{{ jawabanAwal }}”
      </p>
      <p v-else class="mt-1 text-sm text-ink-500">Anda belum menuliskan dugaan awal di layar pertama.</p>
    </div>

    <label v-for="(p, i) in blok.pertanyaan" :key="i" class="flex flex-col gap-1.5">
      <span class="text-base font-medium text-ink-800">{{ p }}</span>
      <textarea
        :value="jawaban[i] ?? ''"
        rows="3"
        placeholder="Tulis refleksi Anda di sini..."
        class="w-full resize-y rounded-lg border border-ink-200 bg-white p-2.5 text-md text-ink-800 outline-none focus:border-accent"
        @input="ubah(i, ($event.target as HTMLTextAreaElement).value)"
      ></textarea>
    </label>
  </div>
</template>
