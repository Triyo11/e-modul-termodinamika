<script setup lang="ts">
import JudulEmodul from "@/components/JudulEmodul.vue";
const tujuanPembelajaran = [
  "Peserta didik dapat menerapkan teori kinetik gas untuk menganalisis sifat-sifat gas.",
  "Peserta didik dapat menganalisis berbagai hukum gas yang membentuk persamaan gas ideal.",
];
</script>

<template>
  <div class="min-h-dvh text-brand-dark font-sans px-5 py-6 pb-16">
    <JudulEmodul ringkas class="mb-6" />

    <main
      class="flex flex-col gap-4 rounded-xl border-2 border-brand-dark bg-surface p-4 content-shadow"
    >
      <section>
        <h2 class="font-bold text-xl text-center pb-4">Tujuan Pembelajaran</h2>
        <div v-for="(v, i) in tujuanPembelajaran" class="px-4 hyphens-auto">
            <li :key="i">
                {{ v }}
            </li>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.content-shadow {
  box-shadow: var(--shadow-display);
}
</style>
