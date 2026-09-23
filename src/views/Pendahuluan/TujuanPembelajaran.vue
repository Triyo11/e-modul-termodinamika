<script setup lang="ts">
const tujuanPembelajaran = [
  "Peserta didik dapat menerapkan teori kinetik gas untuk menganalisis sifat-sifat gas.",
  "Peserta didik dapat menganalisis berbagai hukum gas yang membentuk persamaan gas ideal.",
];
</script>

<template>
  <div class="min-h-dvh bg-ink-50 text-brand-dark font-sans px-5 py-6 pb-40">
    <div
      class="h-40 lg:h-80 flex flex-col items-center justify-center rounded-xl border border-ink-200 bg-accent-2 mb-4 p-8 lg:p-24"
    >
      <img
        src="@/assets/logo fix.png"
        alt="E-modul Fisika"
        class="h-full w-full object-contain"
      />
    </div>

    <main
      class="flex flex-col gap-4 rounded-xl border-2 border-brand-dark bg-white p-4 content-shadow"
    >
      <section>
        <h2 class="font-bold text-xl text-center pb-4">Tujuan Pembelajaran</h2>
        <div v-for="(v, i) in tujuanPembelajaran" class="px-4 text-justify hyphens-auto">
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
  box-shadow: var(--shadow);
}
</style>
