<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount } from "vue";
import type { BlokAnimasi } from "@/types/kegiatan";
import { renderTeksCampuran } from "@/lib/mathText";

const props = defineProps<{ blok: BlokAnimasi }>();

const mp4 = computed(() => props.blok.mp4);
const webm = computed(() => props.blok.webm);
const poster = computed(() => props.blok.poster);
const alt = computed(() => renderTeksCampuran(props.blok.alt));
const caption = computed(() => renderTeksCampuran(props.blok.caption ?? ""));
const sumber = computed(() => renderTeksCampuran(props.blok.sumber ?? ""));
const rasio = computed(() => props.blok.rasio ?? "4/3");

const video = ref<HTMLVideoElement | null>(null);
const berjalan = ref(false);
const dijedaManual = ref(false);
let kurangiGerak = false;
let observer: IntersectionObserver | undefined;

function putar() {
  video.value
    ?.play()
    .then(() => (berjalan.value = true))
    .catch(() => (berjalan.value = false));
}

function jeda() {
  video.value?.pause();
  berjalan.value = false;
}

function ketuk() {
  if (berjalan.value) {
    jeda();
    dijedaManual.value = true;
  } else {
    dijedaManual.value = false;
    putar();
  }
}

onMounted(() => {
  kurangiGerak = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Putar hanya saat setengah bagian video terlihat; jeda saat digulir keluar.
  observer = new IntersectionObserver(
    ([entri]) => {
      if (!entri.isIntersecting) return jeda();
      if (!kurangiGerak && !dijedaManual.value) putar();
    },
    { threshold: 0.5 },
  );
  if (video.value) observer.observe(video.value);
});

onBeforeUnmount(() => observer?.disconnect());
</script>

<template>
  <figure class="my-6">
    <!-- Latar putih tetap di mode gelap: diperlakukan sebagai "kartu gambar" seperti di buku teks -->
    <div
      class="w-full h-96 relative overflow-hidden rounded-xl bg-transparent ring-2 ring-ink-500"
      :style="{ aspectRatio: rasio }"
    >
      <video
        ref="video"
        class="h-full w-full object-contain"
        :poster="poster"
        :aria-label="alt"
        muted
        loop
        playsinline
        preload="none"
      >
        <source v-if="webm" :src="webm" type="video/webm" />
        <source :src="mp4" type="video/mp4" />
      </video>

      <!-- Seluruh area video bisa diketuk; ikon hanya penanda status -->
      <button
        type="button"
        class="absolute inset-0 flex items-end justify-end p-3"
        :aria-label="berjalan ? 'Jeda animasi' : 'Putar animasi'"
        @click="ketuk"
      >
        <span
          class="flex h-11 w-11 items-center justify-center rounded-full bg-ink-900/70 text-white transition-opacity"
          :class="berjalan ? 'opacity-40' : 'opacity-100'"
        >
          <svg
            viewBox="0 0 24 24"
            class="h-5 w-5"
            fill="currentColor"
            aria-hidden="true"
          >
            <path v-if="berjalan" d="M6 5h4v14H6zM14 5h4v14h-4z" />
            <path v-else d="M8 5v14l11-7z" />
          </svg>
        </span>
      </button>
    </div>

    <figcaption
      v-if="caption || sumber"
      class="mt-2 text-sm text-center leading-relaxed text-ink-600"
    >
      <span v-if="caption" class="block" v-html="caption"></span>
      <span v-if="sumber" class="mt-0.5 block text-xs"
        >Sumber: {{ sumber }}</span
      >
    </figcaption>
  </figure>
</template>
