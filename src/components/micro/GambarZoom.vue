<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from "vue";

const props = defineProps<{
  src: string;
  alt: string;
  caption?: string;
  /** Lebar asli gambar dalam piksel, dipakai sebagai batas atas zoom 1x di layar lebar. */
  lebarAsli?: number;
}>();

const ZOOM_MIN = 1;
const ZOOM_MAX = 4;
const ZOOM_STEP = 0.5;

const terbuka = ref(false);
const zoom = ref(ZOOM_MIN);

const lebarGambar = computed(
  () => `calc(${zoom.value} * min(100%, ${props.lebarAsli ?? 900}px))`
);

function buka() {
  zoom.value = ZOOM_MIN;
  terbuka.value = true;
}

function tutup() {
  terbuka.value = false;
}

function ubahZoom(delta: number) {
  zoom.value = Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, zoom.value + delta));
}

function toggleZoom() {
  zoom.value = zoom.value > ZOOM_MIN ? ZOOM_MIN : 2.5;
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === "Escape") tutup();
}

watch(terbuka, (aktif) => {
  document.body.style.overflow = aktif ? "hidden" : "";
  if (aktif) window.addEventListener("keydown", onKeydown);
  else window.removeEventListener("keydown", onKeydown);
});

onBeforeUnmount(() => {
  document.body.style.overflow = "";
  window.removeEventListener("keydown", onKeydown);
});
</script>

<template>
  <figure class="flex flex-col gap-2">
    <button
      type="button"
      @click="buka"
      class="relative block w-full cursor-zoom-in rounded-xl border border-ink-200 bg-white p-2 hover:border-ink-400"
    >
      <img
        :src="src"
        :alt="alt"
        class="mx-auto block max-h-[60vh] w-auto max-w-full object-contain"
      />
      <span
        class="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-brand-dark/85 px-3 py-1 text-xs font-semibold text-white"
      >
        <span class="material-symbols-outlined text-base!">zoom_in</span>
        Ketuk untuk memperbesar
      </span>
    </button>
    <figcaption v-if="caption" class="text-sm text-ink-600">
      {{ caption }}
    </figcaption>
  </figure>

  <Teleport to="body">
    <div
      v-if="terbuka"
      role="dialog"
      aria-modal="true"
      :aria-label="alt"
      class="fixed inset-0 z-50 flex flex-col bg-brand-dark/95"
    >
      <div
        class="flex items-center justify-between gap-2 px-3 py-2 text-white pt-[max(0.5rem,env(safe-area-inset-top))]"
      >
        <p class="pl-2 text-xs text-ink-200">
          Cubit atau ketuk dua kali untuk memperbesar
        </p>
        <div class="flex items-center gap-1">
          <button
            type="button"
            aria-label="Perkecil"
            :disabled="zoom <= ZOOM_MIN"
            @click="ubahZoom(-ZOOM_STEP)"
            class="flex size-11 items-center justify-center rounded-lg hover:bg-white/15 disabled:opacity-40"
          >
            <span class="material-symbols-outlined">zoom_out</span>
          </button>
          <button
            type="button"
            aria-label="Perbesar"
            :disabled="zoom >= ZOOM_MAX"
            @click="ubahZoom(ZOOM_STEP)"
            class="flex size-11 items-center justify-center rounded-lg hover:bg-white/15 disabled:opacity-40"
          >
            <span class="material-symbols-outlined">zoom_in</span>
          </button>
          <button
            type="button"
            aria-label="Tutup"
            @click="tutup"
            class="flex size-11 items-center justify-center rounded-lg hover:bg-white/15"
          >
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
      </div>

      <div
        class="flex-1 overflow-auto p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
        @click.self="tutup"
      >
        <img
          :src="src"
          :alt="alt"
          @dblclick="toggleZoom"
          :style="{ width: lebarGambar }"
          class="mx-auto block h-auto max-w-none rounded-lg bg-white"
          :class="zoom > ZOOM_MIN ? 'cursor-zoom-out' : 'cursor-zoom-in'"
        />
      </div>
    </div>
  </Teleport>
</template>
