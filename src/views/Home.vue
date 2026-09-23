<script setup lang="ts">
import ButtonLink from "@/components/micro/ButtonLink.vue";

const pendahuluanList = [
  {
    title: "Identitas",
    description: "Informasi tentang e-modul ini",
    linkName: "informasi-umum",
  },
  {
    title: "Capaian Pembelajaran",
    description: "Hal yang akan dicapai setelah mempelajari e-modul ini",
    linkName: "capaian-pembelajaran",
  },
  {
    title: "Tujuan Pembelajaran",
    description: "Tujuan pembelajaran yang ingin dicapai",
    linkName: "tujuan-pembelajaran",
  },
  {
    title: "Peta Konsep",
    description: "Peta konsep materi yang akan dipelajari",
    linkName: "peta-konsep",
  },
  {
    title: "Prasyarat",
    description:
      "Pengetahuan yang harus dimiliki sebelum mempelajari e-modul ini",
    linkName: "prasyarat",
  },
  {
    title: "Petunjuk Penggunaan",
    description: "Cara menggunakan e-modul ini",
    linkName: "petunjuk-penggunaan",
  },
];
</script>

<!-- Shell.vue -->
<template>
  <div class="min-h-dvh bg-ink-50 text-ink-900">
    <main class="px-5 py-6 pb-40">
      <div
        class="h-40 lg:h-80 flex flex-col items-center justify-center rounded-xl border border-ink-200 bg-accent-2 mb-4 p-8 lg:p-24"
      >
        <img
          src="@/assets/logo fix.png"
          alt="E-modul Fisika"
          class="h-full w-full object-contain"
        />
      </div>
      <div
        class="grid grid-cols-1 gap-6 rounded-xl border border-ink-200 bg-white p-4"
      >
        <div
          v-for="(item, index) in pendahuluanList"
          :key="index"
          class="flex flex-col gap-2"
        >
          <ButtonLink :linkPath="`/${item.linkName}`">
            <h2 class="text-lg font-semibold text-ink-900">
              {{ item.title }}
            </h2>
            <p class="text-sm text-ink-600">
              {{ item.description }}
            </p>
          </ButtonLink>
        </div>
      </div>
    </main>
  </div>
</template>
