<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from "vue";
import { PhExam, PhX } from "@phosphor-icons/vue";
import KuisBlok from "@/components/materi/KuisBlok.vue";
import { useJawabanTersimpan } from "@/lib/jawabanTersimpan";
import { kunciJawabanPanel, soalKuisPanel } from "@/lib/kuisPanel";
import type { Kegiatan } from "@/types/kegiatan";

/**
 * Panel kuis per KB: tombol "Kuis" mengambang di pojok kanan bawah membuka panel yang
 * bergeser masuk dari sisi kanan layar (HP dan laptop). Panel ditutup lewat tombol ×,
 * ketukan di area gelap di luar panel, atau tombol Esc.
 */
const props = defineProps<{ kegiatan: Kegiatan }>();

const terbuka = ref(false);
const tombolBuka = ref<HTMLButtonElement | null>(null);
const tombolTutup = ref<HTMLButtonElement | null>(null);

const soal = computed(() => soalKuisPanel(props.kegiatan));

// Kemajuan: ref jawaban dipakai bersama dengan KuisBlok (kunci sama), jadi langsung ikut berubah.
const jawaban = computed(() =>
  soal.value.map((s) => ({
    kunci: s.kunci,
    pilihan: useJawabanTersimpan<string | null>(kunciJawabanPanel(props.kegiatan.id, s.id), null),
  })),
);
const terjawab = computed(() => jawaban.value.filter((j) => j.pilihan.value !== null).length);
const benar = computed(() => jawaban.value.filter((j) => j.pilihan.value === j.kunci).length);

function buka() {
  terbuka.value = true;
}
function tutup() {
  terbuka.value = false;
}
function saatTombol(e: KeyboardEvent) {
  if (e.key === "Escape") tutup();
}

watch(terbuka, async (t) => {
  // Halaman di belakang panel tidak ikut tergulir selama panel terbuka.
  document.documentElement.style.overflow = t ? "hidden" : "";
  if (t) {
    window.addEventListener("keydown", saatTombol);
    await nextTick();
    tombolTutup.value?.focus();
  } else {
    window.removeEventListener("keydown", saatTombol);
    tombolBuka.value?.focus();
  }
});

// Pindah KB: panel ditutup.
watch(
  () => props.kegiatan.id,
  () => tutup(),
);

onBeforeUnmount(() => {
  document.documentElement.style.overflow = "";
  window.removeEventListener("keydown", saatTombol);
});
</script>

<template>
  <!-- Tombol mengambang, sejajar dengan tepi kanan kolom aplikasi -->
  <div class="pointer-events-none fixed inset-x-0 bottom-0 z-30 mx-auto flex w-full justify-end p-5 lg:w-2/3">
    <button
      ref="tombolBuka"
      type="button"
      class="tombol-kuis pointer-events-auto flex items-center gap-2 rounded-2xl bg-pastel-peach px-4 py-3 font-bold"
      :aria-expanded="terbuka"
      aria-controls="panel-kuis"
      @click="buka"
    >
      <PhExam :size="22" weight="bold" />
      <span>Kuis</span>
      <span class="rounded-full bg-teks-gelap px-2 py-0.5 text-xs font-bold text-ink-900">
        {{ terjawab }}/{{ soal.length }}
      </span>
    </button>
  </div>

  <!-- Latar gelap di belakang panel; diketuk = panel tertutup -->
  <Transition
    enter-active-class="transition-opacity duration-200"
    enter-from-class="opacity-0"
    leave-active-class="transition-opacity duration-200"
    leave-to-class="opacity-0"
  >
    <div v-if="terbuka" class="fixed inset-0 z-40 bg-black/70" aria-hidden="true" @click="tutup"></div>
  </Transition>

  <!-- Panel samping -->
  <Transition
    enter-active-class="transition-transform duration-250 ease-out"
    enter-from-class="translate-x-full"
    leave-active-class="transition-transform duration-200 ease-in"
    leave-to-class="translate-x-full"
  >
    <aside
      v-if="terbuka"
      id="panel-kuis"
      role="dialog"
      aria-modal="true"
      aria-labelledby="judul-panel-kuis"
      class="panel fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-ink-50"
    >
      <header class="flex items-start gap-3 border-b-[3px] border-brand-dark bg-pastel-peach px-5 py-4 text-teks-gelap">
        <div class="flex flex-1 flex-col gap-0.5">
          <span class="text-xs font-bold uppercase tracking-widest">Kuis KB {{ kegiatan.kb }}</span>
          <h2 id="judul-panel-kuis" class="text-xl font-extrabold leading-tight">{{ kegiatan.judul }}</h2>
          <p class="mt-1 text-sm font-semibold">
            Terjawab {{ terjawab }} dari {{ soal.length }} · Benar {{ benar }}
          </p>
        </div>
        <button
          ref="tombolTutup"
          type="button"
          class="tombol-tutup flex size-10 shrink-0 items-center justify-center rounded-xl bg-ink-900"
          aria-label="Tutup panel kuis"
          @click="tutup"
        >
          <PhX :size="20" weight="bold" class="text-teks-gelap" />
        </button>
      </header>

      <!-- Bilah kemajuan -->
      <div class="h-2 bg-ink-100" aria-hidden="true">
        <div
          class="h-full bg-pastel-mint transition-[width] duration-300"
          :style="{ width: soal.length ? `${(terjawab / soal.length) * 100}%` : '0%' }"
        ></div>
      </div>

      <div class="flex flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-5 py-5">
        <p v-if="!soal.length" class="text-ink-600">Belum ada soal kuis untuk kegiatan belajar ini.</p>
        <section v-for="(s, i) in soal" :key="s.id" class="flex flex-col gap-2" :aria-label="`Soal ${i + 1}`">
          <span class="text-xs font-bold uppercase tracking-widest text-accent-1">Soal {{ i + 1 }}</span>
          <KuisBlok :blok="s" :kegiatan-id="kegiatan.id" :kunci-simpan="kunciJawabanPanel(kegiatan.id, s.id)" />
        </section>
      </div>
    </aside>
  </Transition>
</template>

<style scoped>
.tombol-kuis {
  color: var(--color-teks-gelap);
  border: 3px solid var(--color-brand-dark);
  box-shadow: 4px 4px 0 0 var(--color-brand-dark);
  transition: transform 0.08s, box-shadow 0.08s;
}
.tombol-kuis:hover {
  transform: translate(-1px, -1px);
  box-shadow: 5px 5px 0 0 var(--color-brand-dark);
}
.tombol-kuis:active,
.tombol-kuis.sedang-ditekan {
  transform: translate(4px, 4px);
  box-shadow: 0 0 0 0 var(--color-brand-dark);
}
.panel {
  border-left: 3px solid var(--color-brand-dark);
}
.tombol-tutup {
  border: 2.5px solid var(--color-teks-gelap);
  box-shadow: 3px 3px 0 0 var(--color-teks-gelap);
}
.tombol-tutup:active {
  transform: translate(3px, 3px);
  box-shadow: none;
}
</style>
