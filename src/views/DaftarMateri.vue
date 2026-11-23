<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { PhCaretRight } from "@phosphor-icons/vue";
import { cariKegiatanKb, daftarKegiatan } from "@/content";

// Kunci yang sama dengan yang ditulis Materi.vue saat sebuah KB dibuka.
const KUNCI_KB_TERAKHIR = "materi:kb-terakhir";
const router = useRouter();

function bacaKbTerakhir(): number | null {
  try {
    const n = Number(localStorage.getItem(KUNCI_KB_TERAKHIR));
    return cariKegiatanKb(n) ? n : null;
  } catch {
    return null;
  }
}
const kbTerakhir = ref(bacaKbTerakhir());

function buka(kb: number | undefined) {
  if (kb === undefined) return;
  router.push({ name: "materi-kb", params: { kb: String(kb) } });
}
</script>

<template>
  <div class="min-h-dvh bg-ink-50 text-ink-900 font-sans">
    <main class="flex flex-col gap-4 px-5 py-8 pb-40 sm:px-8 lg:px-12">
      <header class="flex flex-col gap-1 pb-4">
        <h1 class="text-2xl font-bold text-ink-900">Daftar materi</h1>
      </header>

      <ol class="flex flex-col gap-3">
        <li v-for="k in daftarKegiatan" :key="k.id">
          <button
            type="button"
            class="flex w-full items-center gap-4 rounded-xl border bg-white p-4 text-left transition-colors hover:border-accent-1/40 hover:bg-ink-50"
            :class="k.kb === kbTerakhir ? 'border-brand' : 'border-ink-200'"
            @click="buka(k.kb)"
          >
            <span
              class="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-lg bg-brand-light text-accent-1"
            >
              <span class="text-[10px] font-semibold uppercase leading-none">KB</span>
              <span class="text-lg font-bold leading-tight">{{ k.kb }}</span>
            </span>
            <span class="flex flex-1 flex-col gap-0.5">
              <span class="font-semibold text-ink-900">{{ k.judul }}</span>
              <span class="flex flex-wrap gap-x-3 text-xs text-ink-500">
                <span v-if="k.alokasiWaktu">{{ k.alokasiWaktu }} menit</span>
                <span v-if="k.kb === kbTerakhir" class="font-semibold text-accent-1">Terakhir dibaca</span>
              </span>
            </span>
            <PhCaretRight :size="18" weight="bold" class="shrink-0 text-ink-500" />
          </button>
        </li>
      </ol>
    </main>
  </div>
</template>
