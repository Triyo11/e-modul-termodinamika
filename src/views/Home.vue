<script setup lang="ts">
import ButtonMenu from "@/components/micro/ButtonMenu.vue";

const pendahuluanList = [
  {
    title: "Identitas",
    description: "Informasi tentang e-modul ini",
  },
  {
    title: "Capaian Pembelajaran",
    description: "Hal yang akan dicapai setelah mempelajari e-modul ini",
  },
  {
    title: "Tujuan Pembelajaran",
    description: "Tujuan pembelajaran yang ingin dicapai",
  },
  {
    title: "Peta Konsep",
    description: "Peta konsep materi yang akan dipelajari",
  },
  {
    title: "Prasyarat",
    description:
      "Pengetahuan yang harus dimiliki sebelum mempelajari e-modul ini",
  },
  {
    title: "Petunjuk Penggunaan",
    description: "Cara menggunakan e-modul ini",
  },
];
</script>

<!-- Shell.vue -->
<template>
  <div class="min-h-dvh bg-ink-50 text-ink-900">
    <main class="px-5 py-6 pb-40">
      <div class="h-40 lg:h-80 flex flex-col items-center justify-center rounded-xl border border-ink-200 bg-accent-2 mb-4 p-8 lg:p-24">
        <!-- <h1 class="text-3xl font-bold text-ink-900">E-modul Fisika</h1>
        <h1 class="text-3xl font-bold text-accent-3">Termodinamika</h1> -->
        <img src="@/assets/logo fix.png" alt="E-modul Fisika" class="h-full w-full object-contain" />
      </div>
      <div class="grid grid-cols-1 gap-6 rounded-xl border border-ink-200 bg-white p-4">
        <div
          v-for="(item, index) in pendahuluanList"
          :key="index"
          class="flex flex-col gap-2"
        >
          <ButtonMenu>
            <h2 class="text-lg font-semibold text-ink-900">
              {{ item.title }}
            </h2>
            <p class="text-sm text-ink-600">
              {{ item.description }}
            </p>
          </ButtonMenu>
        </div>
      </div>
    </main>
  </div>
</template>
