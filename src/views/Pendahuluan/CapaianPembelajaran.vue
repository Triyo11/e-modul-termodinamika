<script setup lang="ts"></script>

<template>
  <div class="min-h-dvh bg-ink-50 text-brand-dark font-sans px-5 py-6 pb-40">
    <div
      class="h-40 lg:h-80 flex flex-col items-center justify-center rounded-xl border border-ink-200 bg-linear-to-br from-accent-2 via-ink-50 to-white mb-4 p-8 lg:p-24"
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
        <h2 class="font-bold text-xl text-center pb-4">Capaian Pembelajaran</h2>
        <div class="flex flex-col gap-2">
          <p class="text-justify mx-4">
            Capaian pembelajaran diadaptasi dari
            <a
              href="https://guru.kemendikdasmen.go.id/dokumen/74r6Yln0zK"
              class="text-brand-dark underline"
              >BSKAP Nomor 046/H/KR/2025.</a
            >
            Setelah mempelajari modul ini, peserta didik diharapkan mampu:
          </p>
          <p class="mx-8">
            "Murid mampu memahami konsep kalor dan termodinamika serta penerapannya untuk mengidentifikasi 
            fenomena dan menganalisis dampak dari perubahan iklim."
          </p>
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
