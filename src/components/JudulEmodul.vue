<script setup lang="ts">
// Kartu judul e-modul bergaya neobrutalism (pengganti gambar logo).
// ringkas = versi lebih kecil untuk halaman selain Beranda.
withDefaults(defineProps<{ ringkas?: boolean }>(), { ringkas: false });
</script>

<template>
  <header
    class="judul-kartu relative overflow-hidden rounded-2xl"
    :class="ringkas ? 'ringkas p-5' : 'p-6'"
  >
    <!-- Pola titik di latar -->
    <div class="pola-titik pointer-events-none absolute inset-0" aria-hidden="true"></div>

    <!-- Stiker rumus hukum I termodinamika -->
    <span
      v-if="!ringkas"
      class="stiker absolute right-4 top-4 rotate-6 rounded-lg bg-pastel-kuning px-2.5 py-1 text-sm font-bold"
      aria-hidden="true"
    >ΔU = Q − W</span>

    <div class="relative flex items-end justify-between gap-4">
      <h1 class="flex flex-col items-start gap-2 sm:gap-3">
        <span
          class="label rounded-md bg-pastel-pink px-2.5 py-0.5 font-bold uppercase tracking-widest"
          :class="ringkas ? 'text-[11px]' : 'text-xs'"
        >E-modul Interaktif</span>

        <span class="flex flex-col leading-[0.95]">
          <span class="ukuran-judul font-extrabold tracking-tight text-ink-900">Fisika</span>
          <span
            class="ukuran-judul sorot -ml-1 mt-1 -rotate-1 self-start rounded-lg bg-pastel-lavender px-2 pb-1 font-extrabold tracking-tight"
          >Termodinamika</span>
        </span>

        <span class="mt-1 flex flex-wrap gap-2">
          <span
            class="chip rounded-full bg-pastel-mint px-3 py-0.5 font-bold"
            :class="ringkas ? 'text-xs' : 'text-sm'"
          >Kelas XI</span>
          <span
            class="chip rounded-full bg-pastel-biru px-3 py-0.5 font-bold"
            :class="ringkas ? 'text-xs' : 'text-sm'"
          >Model STEM-CTL</span>
        </span>
      </h1>

      <!-- Ilustrasi: gas dalam silinder berpiston yang dipanaskan -->
      <svg
        v-if="!ringkas"
        viewBox="0 0 120 170"
        class="ilustrasi w-36 shrink-0"
        aria-hidden="true"
        fill="none"
        stroke="var(--color-brand-dark)"
        stroke-width="4"
        stroke-linejoin="round"
        stroke-linecap="round"
      >
        <!-- batang dan piston -->
        <line x1="60" y1="6" x2="60" y2="40" />
        <rect x="22" y="40" width="76" height="14" rx="3" fill="var(--color-pastel-peach)" />
        <!-- silinder -->
        <path d="M18 34 V128 H102 V34" />
        <!-- partikel gas -->
        <circle cx="40" cy="74" r="6" fill="var(--color-pastel-pink)" />
        <circle cx="72" cy="68" r="6" fill="var(--color-pastel-mint)" />
        <circle cx="58" cy="96" r="6" fill="var(--color-pastel-kuning)" />
        <circle cx="84" cy="106" r="6" fill="var(--color-pastel-lavender)" />
        <circle cx="34" cy="110" r="6" fill="var(--color-pastel-biru)" />
        <!-- garis gerak partikel -->
        <path d="M48 70 l8 -4 M80 62 l6 -5 M66 98 l8 2" stroke-width="3" />
        <!-- api -->
        <path
          d="M60 164 c-14 0 -20 -10 -16 -20 c2 6 6 8 8 6 c-2 -10 4 -16 8 -20 c0 8 8 10 10 18 c2 -2 2 -6 2 -8 c6 8 4 24 -12 24 z"
          fill="var(--color-pastel-pink)"
        />
      </svg>
    </div>
  </header>
</template>

<style scoped>
/* Ukuran judul mengikuti lebar kartu (container query), bukan lebar layar,
   agar kata "Termodinamika" (lebar kira-kira 8,4 em) selalu muat. */
.judul-kartu {
  container-type: inline-size;
}
.ukuran-judul {
  font-size: min(calc((100cqi - 26px) / 8.6), 2.6rem);
}
.ringkas .ukuran-judul {
  font-size: min(calc((100cqi - 26px) / 8.6), 2.1rem);
}
.ilustrasi {
  display: none;
}
/* Di kartu sempit stiker disembunyikan agar tidak menimpa label. */
.stiker {
  display: none;
}
@container (min-width: 290px) {
  .stiker {
    display: block;
  }
}
@container (min-width: 600px) {
  .judul-kartu:not(.ringkas) {
    padding: 2rem;
  }
  .judul-kartu:not(.ringkas) .ukuran-judul {
    font-size: min(calc((100cqi - 200px) / 8.6), 3.75rem);
  }
  .ilustrasi {
    display: block;
  }
  .stiker {
    top: 1.75rem;
    right: 12.5rem;
    font-size: 1rem;
  }
}
.judul-kartu {
  background-color: var(--color-surface);
  border: 3px solid var(--color-brand-dark);
  box-shadow: 8px 8px 0 0 var(--color-pastel-lavender);
}
.pola-titik {
  background-image: radial-gradient(rgb(255 248 236 / 0.10) 1.5px, transparent 1.5px);
  background-size: 18px 18px;
}
.label,
.sorot,
.chip,
.stiker {
  color: var(--color-teks-gelap);
  border: 2.5px solid var(--color-brand-dark);
}
.sorot {
  box-shadow: 4px 4px 0 0 var(--color-pastel-pink);
}
.stiker {
  box-shadow: 3px 3px 0 0 var(--color-brand-dark);
}
</style>
