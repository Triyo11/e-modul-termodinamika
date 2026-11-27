<script setup lang="ts">
import { PhCursorClick } from "@phosphor-icons/vue";

/**
 * Kotak pembungkus widget interaktif (simulasi, diagram p–V, siklus Carnot).
 * Tampil seperti jendela aplikasi: bilah judul biru pastel, garis dan bayangan keras biru.
 * Gaya: .kotak-simulasi di style.css.
 */
defineProps<{ judul?: string }>();
</script>

<template>
  <section class="kotak-simulasi" :aria-label="judul ?? 'Simulasi interaktif'">
    <header class="kepala-simulasi flex items-center gap-3 px-4 py-2.5">
      <span class="flex gap-1.5" aria-hidden="true">
        <span class="titik-jendela bg-pastel-pink"></span>
        <span class="titik-jendela bg-pastel-kuning"></span>
        <span class="titik-jendela bg-pastel-mint"></span>
      </span>
      <span class="flex min-w-0 flex-1 flex-col leading-tight">
        <span class="flex items-center gap-1 text-[11px] font-bold uppercase tracking-widest">
          <PhCursorClick :size="13" weight="bold" /> Simulasi interaktif
        </span>
        <span v-if="judul" class="truncate font-extrabold">{{ judul }}</span>
      </span>
    </header>
    <div class="isi-simulasi flex flex-col gap-3 p-4">
      <slot />
    </div>
  </section>
</template>

<style scoped>
.titik-jendela {
  display: block;
  width: 0.7rem;
  height: 0.7rem;
  border-radius: 9999px;
  border: 2px solid var(--color-teks-gelap);
}
</style>
