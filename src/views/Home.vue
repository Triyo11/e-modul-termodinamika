<script setup lang="ts">
import { PhRocketLaunch, PhQuestion, PhInfo, PhArrowRight } from "@phosphor-icons/vue";

// Tiga menu utama di bawah judul e-modul. Warna isi tiap kartu memakai palet pastel (lihat style.css).
const menuUtama = [
  {
    judul: "Start learning!",
    keterangan: "Mulai pelajari kegiatan belajar termodinamika",
    tujuan: "materi",
    ikon: PhRocketLaunch,
    warna: "bg-pastel-pink",
  },
  {
    judul: "Help",
    keterangan: "Petunjuk penggunaan e-modul",
    tujuan: "petunjuk-penggunaan",
    ikon: PhQuestion,
    warna: "bg-pastel-kuning",
  },
  {
    judul: "About",
    keterangan: "Informasi umum tentang e-modul ini",
    tujuan: "profil",
    ikon: PhInfo,
    warna: "bg-pastel-mint",
  },
];
</script>

<template>
  <div class="min-h-dvh bg-ink-50 text-ink-900">
    <main class="flex flex-col gap-8 px-5 py-8 pb-16 sm:px-8 lg:px-12">
      <!-- Judul e-modul -->
      <div
        class="kartu-judul flex h-40 lg:h-72 items-center justify-center rounded-2xl bg-ink-900 p-8 lg:p-20"
      >
        <img
          src="@/assets/logo fix.png"
          alt="E-modul Fisika Termodinamika"
          class="h-full w-full object-contain"
        />
      </div>

      <!-- Tiga menu utama -->
      <nav aria-label="Menu utama" class="flex flex-col gap-5">
        <RouterLink
          v-for="m in menuUtama"
          :key="m.tujuan"
          :to="{ name: m.tujuan }"
          class="menu-brutal flex items-center gap-4 rounded-2xl p-4 sm:p-5"
          :class="m.warna"
        >
          <span
            class="flex size-12 shrink-0 items-center justify-center rounded-xl border-[2.5px] border-teks-gelap bg-ink-900"
          >
            <component :is="m.ikon" :size="26" weight="bold" class="text-teks-gelap" />
          </span>
          <span class="flex flex-1 flex-col">
            <span class="text-xl font-extrabold tracking-tight">{{ m.judul }}</span>
            <span class="text-sm font-medium opacity-80">{{ m.keterangan }}</span>
          </span>
          <PhArrowRight :size="22" weight="bold" class="shrink-0" />
        </RouterLink>
      </nav>
    </main>
  </div>
</template>

<style scoped>
/* Kartu judul: latar krem agar logo bertinta gelap terbaca, garis tepi dan bayangan keras pastel. */
.kartu-judul {
  border: 3px solid var(--color-brand-dark);
  box-shadow: 8px 8px 0 0 var(--color-pastel-lavender);
}

/* Menu neobrutalism: bidang pastel, garis tepi krem tebal, bayangan keras krem.
   Saat ditekan kartu turun menutup bayangannya. */
.menu-brutal {
  color: var(--color-teks-gelap);
  border: 3px solid var(--color-brand-dark);
  box-shadow: 6px 6px 0 0 var(--color-brand-dark);
  transition: transform 0.08s, box-shadow 0.08s;
}
.menu-brutal:hover {
  transform: translate(-2px, -2px);
  box-shadow: 8px 8px 0 0 var(--color-brand-dark);
}
.menu-brutal:active {
  transform: translate(6px, 6px);
  box-shadow: 0 0 0 0 var(--color-brand-dark);
}
.menu-brutal:focus-visible {
  outline: 3px solid var(--color-pastel-biru);
  outline-offset: 4px;
}
</style>
