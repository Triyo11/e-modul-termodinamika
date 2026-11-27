<script setup lang="ts">
import JudulEmodul from "@/components/JudulEmodul.vue";

// Halaman About: informasi umum e-modul dan capaian pembelajaran.
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
  <div class="min-h-dvh bg-ink-50 text-ink-900 font-sans px-5 py-6 pb-16 sm:px-8 lg:px-12">
    <JudulEmodul ringkas class="mb-8" />

    <div class="flex flex-col gap-8">
      <section class="rounded-xl bg-surface p-4 sm:p-5" aria-labelledby="judul-informasi-umum">
        <h2 id="judul-informasi-umum" class="pb-4 text-xl font-bold">Informasi Umum</h2>
        <dl class="flex flex-col">
          <div
            v-for="(value, key) in informasiUmum"
            :key="key"
            class="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 border-t-2 border-ink-200 py-2.5 first:border-t-0"
          >
            <dt class="font-semibold text-ink-600">{{ key }}</dt>
            <dd class="text-ink-900">{{ value }}</dd>
          </div>
        </dl>
      </section>

      <section class="rounded-xl bg-surface p-4 sm:p-5" aria-labelledby="judul-capaian">
        <h2 id="judul-capaian" class="pb-4 text-xl font-bold">Capaian Pembelajaran</h2>
        <div class="flex flex-col gap-3">
          <p class="text-ink-700">
            Capaian pembelajaran diadaptasi dari
            <a
              href="https://guru.kemendikdasmen.go.id/dokumen/74r6Yln0zK"
              class="font-semibold text-accent-1 underline"
              >BSKAP Nomor 046/H/KR/2025</a
            >. Setelah mempelajari modul ini, peserta didik diharapkan mampu:
          </p>
          <blockquote class="rounded-lg border-l-4 border-pastel-mint bg-ink-100 px-4 py-3 italic text-ink-900">
            "Murid mampu memahami konsep kalor dan termodinamika serta penerapannya untuk mengidentifikasi
            fenomena dan menganalisis dampak dari perubahan iklim."
          </blockquote>
        </div>
      </section>
    </div>
  </div>
</template>
