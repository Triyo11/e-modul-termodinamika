<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { PhArrowLeft, PhArrowRight } from "@phosphor-icons/vue";
import { cariKegiatanKb, daftarKegiatan } from "@/content";
import GambarZoom from "@/components/micro/GambarZoom.vue";

// Kunci yang sama dengan yang ditulis Materi.vue saat sebuah KB dibuka.
const KUNCI_KB_TERAKHIR = "materi:kb-terakhir";
const router = useRouter();

function bacaKbTerakhir(): number | null {
  try {
    const n = Number(localStorage.getItem(KUNCI_KB_TERAKHIR));
    return cariKegiatanKb(n) ? n : null;
  } catch {
    return null;
  }
}
const kbTerakhir = ref(bacaKbTerakhir());

// Warna pastel kartu KB, bergiliran.
const WARNA_KB = ["bg-pastel-pink", "bg-pastel-kuning", "bg-pastel-mint", "bg-pastel-lavender", "bg-pastel-biru"];
const warnaKb = (i: number) => WARNA_KB[i % WARNA_KB.length];

function buka(kb: number | undefined) {
  if (kb === undefined) return;
  router.push({ name: "materi-kb", params: { kb: String(kb) } });
}
</script>

<template>
  <div class="min-h-dvh text-ink-900 font-sans">
    <main class="px-5 py-8 pb-16 sm:px-8 lg:px-12">
      <section class="flex flex-col gap-7" aria-labelledby="judul-daftar-materi">
        <!-- Kepala kartu: tombol kembali + judul -->
        <header class="flex items-center gap-3">
          <button
            type="button"
            class="tombol-ikon size-11 shrink-0"
            aria-label="Kembali ke Beranda"
            title="Kembali ke Beranda"
            @click="router.push({ name: 'home' })"
          >
            <PhArrowLeft :size="22" weight="bold" />
          </button>
          <div class="flex flex-col">
            <h1 id="judul-daftar-materi" class="text-2xl font-extrabold leading-tight tracking-tight">Daftar Materi</h1>
            <p class="text-sm text-ink-500">{{ daftarKegiatan.length }} kegiatan belajar termodinamika</p>
          </div>
        </header>

        <!-- Peta konsep -->
        <div class="flex flex-col gap-3">
          <span class="label-bagian self-start rounded-md bg-pastel-pink px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest">
            Peta konsep
          </span>
          <GambarZoom
            src="/peta-konsep.png"
            alt="Peta konsep termodinamika: teori kinetik gas, proses termodinamika, dan hukum termodinamika"
            :lebar-asli="842"
          />
        </div>

        <!-- Daftar kegiatan belajar -->
        <div class="flex flex-col gap-3">
          <span class="label-bagian self-start rounded-md bg-pastel-mint px-2.5 py-0.5 text-xs font-bold uppercase tracking-widest">
            Kegiatan belajar
          </span>
          <ol class="flex flex-col gap-4">
            <li v-for="(k, i) in daftarKegiatan" :key="k.id">
              <button
                type="button"
                class="menu-brutal flex w-full items-center gap-4 rounded-xl p-3.5 text-left sm:p-4"
                :class="warnaKb(i)"
                @click="buka(k.kb)"
              >
                <span
                  class="flex size-12 shrink-0 flex-col items-center justify-center rounded-lg border-[2.5px] border-teks-gelap bg-ink-900"
                >
                  <span class="text-[10px] font-bold uppercase leading-none">KB</span>
                  <span class="text-lg font-extrabold leading-tight">{{ k.kb }}</span>
                </span>
                <span class="flex flex-1 flex-col gap-0.5">
                  <span class="text-lg font-extrabold leading-snug tracking-tight">{{ k.judul }}</span>
                  <span class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium">
                    <span v-if="k.alokasiWaktu" class="opacity-80">{{ k.alokasiWaktu }} menit</span>
                    <span
                      v-if="k.kb === kbTerakhir"
                      class="rounded-full border-2 border-teks-gelap bg-ink-900 px-2 text-xs font-bold"
                    >Terakhir dibaca</span>
                  </span>
                </span>
                <PhArrowRight :size="22" weight="bold" class="shrink-0" />
              </button>
            </li>
          </ol>
        </div>
      </section>
    </main>
  </div>
</template>

<style scoped>
.label-bagian {
  color: var(--color-teks-gelap);
  border: 2.5px solid var(--color-brand-dark);
}
</style>
