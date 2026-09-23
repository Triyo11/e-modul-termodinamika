<script setup lang="ts">
const informasiUmum = {
  "Nama Penyusun": "Triyo Krismantoro, S.T.",
  "Tahun Penyusunan": "2026",
  Fase: "F",
  Kelas: "XI",
  "Mode Pembelajaran": "Tatap Muka",
  "Alokasi Waktu": "2 x 45 menit",
  "Sumber Belajar":
    "Buku Fisika Kelas XI, Modul Fisika Kelas XI, dan Sumber Belajar Lainnya",
  "Hak Cipta": "© 2026 Triyo Krismantoro",
};
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
        <h2 class="font-bold text-xl text-center pb-4">Informasi Umum</h2>
        <div v-for="(value, key, i) in informasiUmum">
            <div class="grid grid-cols-2 p-2 items-stretch">
                <span :key="i" class="border-2 p-2">{{ key }}</span>
                <span :key="i" class="border-2 p-2">{{ value }}</span>
            </div>
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
