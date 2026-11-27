<script setup lang="ts">
import IlustrasiTermo from "@/components/IlustrasiTermo.vue";

// Kartu judul e-modul bergaya neobrutalism.
// ringkas = versi kecil tanpa ilustrasi untuk halaman selain Beranda.
// Slot bawaan tampil di dalam kartu, di bawah judul dan ilustrasi (dipakai untuk menu Beranda).
withDefaults(defineProps<{ ringkas?: boolean }>(), { ringkas: false });
</script>

<template>
  <header
    class="judul-kartu relative overflow-hidden rounded-2xl p-5"
    :class="{ ringkas }"
  >
    <div class="tata-atas relative">
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

      <IlustrasiTermo v-if="!ringkas" class="ilustrasi" />
    </div>

    <div v-if="$slots.default" class="relative mt-7">
      <slot />
    </div>
  </header>
</template>

<style scoped>
/* Ukuran judul mengikuti lebar kartu (container query), bukan lebar layar,
   agar kata "Termodinamika" (lebar kira-kira 8,4 em) selalu muat. */
.judul-kartu {
  container-type: inline-size;
  /* Kartu kaca semi-transparan dengan garis tepi krem tegas, tanpa bayangan keras neobrutalism.
     Grid latar tetap samar terlihat di baliknya. */
  border-radius: 1.75rem;
  background-color: rgb(22 22 22 / 0.62);
  -webkit-backdrop-filter: blur(10px);
  backdrop-filter: blur(10px);
  border: 3px solid var(--color-brand-dark);
}
.ukuran-judul {
  font-size: min(calc((100cqi - 26px) / 8.6), 2.6rem);
}
.ringkas .ukuran-judul {
  font-size: min(calc((100cqi - 26px) / 8.6), 2.1rem);
}

/* HP: judul di atas, ilustrasi selebar kartu di bawahnya. */
.tata-atas {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.ilustrasi {
  width: 100%;
  max-width: 26rem;
  height: auto;
  align-self: center;
}

/* Kartu lebar: judul di kiri, ilustrasi di kanan. */
@container (min-width: 600px) {
  .judul-kartu:not(.ringkas) {
    padding: 2rem;
  }
  .tata-atas {
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }
  .judul-kartu:not(.ringkas) .ukuran-judul {
    font-size: min(calc((50cqi - 30px) / 8.6), 3.5rem);
  }
  .ilustrasi {
    width: 46%;
    max-width: none;
  }
}

.label,
.sorot,
.chip {
  color: var(--color-teks-gelap);
  border: 2.5px solid var(--color-brand-dark);
}
.sorot {
  box-shadow: 4px 4px 0 0 var(--color-pastel-pink);
}
</style>
