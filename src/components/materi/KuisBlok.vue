<script setup lang="ts">
import { computed, ref } from "vue";
import { renderTeksCampuran } from "@/lib/mathText";
import { useJawabanTersimpan } from "@/lib/jawabanTersimpan";
import type { BlokKuis } from "@/types/kegiatan";

const props = defineProps<{ blok: BlokKuis; kegiatanId: string }>();

const pertanyaanHtml = computed(() => renderTeksCampuran(props.blok.pertanyaan));
const pembahasanHtml = computed(() => (props.blok.pembahasan ? renderTeksCampuran(props.blok.pembahasan) : ""));

const pilihan = useJawabanTersimpan<string | null>(`${props.kegiatanId}:${props.blok.id}`, null);
const sudahDijawab = ref(pilihan.value !== null);

function pilih(id: string) {
  if (sudahDijawab.value) return;
  pilihan.value = id;
  sudahDijawab.value = true;
}

function kelasOpsi(id: string) {
  if (!sudahDijawab.value) {
    return "border-ink-200 hover:border-accent/60";
  }
  if (id === props.blok.kunci) {
    return "border-benar bg-benar/10 text-benar";
  }
  if (id === pilihan.value) {
    return "border-salah bg-salah/10 text-salah";
  }
  return "border-ink-200 opacity-60";
}
</script>

<template>
  <div class="rounded-xl border border-ink-200 p-4">
    <p class="font-medium text-ink-800" v-html="pertanyaanHtml"></p>

    <div class="mt-3 flex flex-col gap-2">
      <button
        v-for="o in blok.opsi"
        :key="o.id"
        type="button"
        class="flex items-center gap-2 rounded-lg border p-2.5 text-left text-sm transition-colors"
        :class="kelasOpsi(o.id)"
        :disabled="sudahDijawab"
        @click="pilih(o.id)"
      >
        <span
          class="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-ink-300 text-xs font-semibold"
        >
          {{ o.id.toUpperCase() }}
        </span>
        <span>{{ o.teks }}</span>
      </button>
    </div>

    <div v-if="sudahDijawab && blok.pembahasan" class="mt-3 rounded-lg bg-ink-100 p-3 text-sm text-ink-700">
      <p class="font-medium text-ink-800">Pembahasan</p>
      <p class="mt-1 leading-relaxed" v-html="pembahasanHtml"></p>
    </div>
  </div>
</template>
