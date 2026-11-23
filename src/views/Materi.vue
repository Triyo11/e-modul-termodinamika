<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, provide, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { PhArrowLeft, PhArrowRight } from "@phosphor-icons/vue";
import LayarSection from "@/components/materi/LayarSection.vue";
import { cariKegiatanKb, daftarKegiatan } from "@/content";
import { kegiatanKey } from "@/lib/tabelIsian";
import { hitungNomorWorksheet, nomorWorksheetKey } from "@/lib/worksheet";

const KUNCI_KB_TERAKHIR = "materi:kb-terakhir";
const route = useRoute();
const router = useRouter();

// KB aktif dibaca dari /materi/:kb agar dapat dibagikan lewat tautan.
const kbAktif = computed(() => {
  const n = Number(route.params.kb);
  return cariKegiatanKb(n) ? n : (daftarKegiatan[0]?.kb ?? 1);
});

const data = computed(() => cariKegiatanKb(kbAktif.value) ?? daftarKegiatan[0]!);
provide(kegiatanKey, data);
provide(
  nomorWorksheetKey,
  computed(() => hitungNomorWorksheet(data.value)),
);

// Mode guru: buka halaman dengan ?guru=1 (sama seperti panduan guru di LayarSection).
const modeGuru = computed(() => route.query.guru !== undefined);

const indeks = computed(() => daftarKegiatan.indexOf(data.value));
const sebelumnya = computed(() => daftarKegiatan[indeks.value - 1]);
const berikutnya = computed(() => daftarKegiatan[indeks.value + 1]);

function bukaKb(kb: number | undefined) {
  if (kb === undefined || kb === kbAktif.value) return;
  router.push({ name: "materi-kb", params: { kb: String(kb) } });
}

// Nomor KB yang tidak ada dikembalikan ke halaman pilihan materi.
watch(
  () => route.params.kb,
  (kb) => {
    if (route.name === "materi-kb" && !cariKegiatanKb(Number(kb))) {
      router.replace({ name: "materi" });
    }
  },
  { immediate: true },
);

// ---------- Posisi gulir per KB ----------
// Tiap KB mengingat posisi gulir terakhirnya, jadi membuka KB lagi kembali ke titik yang sama.
const kunciPosisi = (kb: number) => `materi:posisi-gulir:${kb}`;

function bacaPosisi(kb: number): number {
  try {
    const y = Number(localStorage.getItem(kunciPosisi(kb)));
    return Number.isFinite(y) && y > 0 ? y : 0;
  } catch {
    return 0;
  }
}
function simpanPosisi(kb: number, y: number) {
  try {
    localStorage.setItem(kunciPosisi(kb), String(Math.round(y)));
  } catch {
    /* abaikan */
  }
}

// Selama posisi dipulihkan, gulir dari browser (mis. halaman memendek saat konten berganti) tidak disimpan.
let sedangMemulihkan = false;
let idPemulihan = 0;

function pulihkanPosisi(target: number) {
  const id = ++idPemulihan;
  sedangMemulihkan = true;
  const mulai = performance.now();
  // Gambar dan media bisa memperpanjang halaman setelah tampil, jadi coba lagi sampai
  // halaman cukup tinggi untuk mencapai posisi tujuan (paling lama ~1,5 detik).
  const coba = () => {
    if (id !== idPemulihan) return;
    window.scrollTo({ top: target });
    const cukupTinggi = document.documentElement.scrollHeight - window.innerHeight >= target;
    if (cukupTinggi || performance.now() - mulai > 1500) {
      sedangMemulihkan = false;
      return;
    }
    requestAnimationFrame(coba);
  };
  requestAnimationFrame(coba);
}

let menungguFrame = false;
function saatGulir() {
  if (menungguFrame || sedangMemulihkan) return;
  menungguFrame = true;
  requestAnimationFrame(() => {
    menungguFrame = false;
    if (!sedangMemulihkan) simpanPosisi(kbAktif.value, window.scrollY);
  });
}
function hentikanPemulihan() {
  // Murid menggulir sendiri saat pemulihan berjalan: hormati guliran mereka.
  if (sedangMemulihkan) {
    idPemulihan++;
    sedangMemulihkan = false;
  }
}
onMounted(() => {
  window.addEventListener("scroll", saatGulir, { passive: true });
  window.addEventListener("wheel", hentikanPemulihan, { passive: true });
  window.addEventListener("touchstart", hentikanPemulihan, { passive: true });
});
onBeforeUnmount(() => {
  idPemulihan++;
  window.removeEventListener("scroll", saatGulir);
  window.removeEventListener("wheel", hentikanPemulihan);
  window.removeEventListener("touchstart", hentikanPemulihan);
});

watch(
  kbAktif,
  (kb) => {
    try {
      localStorage.setItem(KUNCI_KB_TERAKHIR, String(kb));
    } catch {
      /* abaikan */
    }
    // Baca posisi sebelum konten berganti, lalu pulihkan setelah konten KB baru tampil.
    const target = bacaPosisi(kb);
    sedangMemulihkan = true;
    nextTick(() => pulihkanPosisi(target));
  },
  { immediate: true },
);

const tujuan = computed(() =>
  data.value.tujuanPembelajaran.map((t) => (typeof t === "string" ? { kode: null, teks: t } : t)),
);
</script>

<template>
  <div class="min-h-dvh bg-ink-50 text-ink-900 font-sans">
    <main :key="data.id" class="flex w-full flex-col gap-16 px-5 py-8 pb-40 sm:px-8 lg:px-12">
      <section class="flex flex-col gap-3">
        <div class="w-full flex flex-col gap-1 bg-accent-1/5 p-4 rounded-xl border-3 border-dashed border-accent-1/40">
          <span class="text-sm font-semibold text-accent-1">Kegiatan Belajar {{ data.kb }}</span>
          <h1 class="text-2xl font-bold text-ink-900">{{ data.judul }}</h1>
        </div>
        
        <span class="text-sm font-semibold uppercase tracking-wide text-ink-500">
          <template v-if="data.alokasiWaktu">Alokasi waktu : {{ data.alokasiWaktu }} menit</template>
        </span>
        <!-- Materi prasyarat hanya untuk guru (?guru=1). -->
        <span v-if="modeGuru && data.prasyarat.length" class="font-medium text-ink-800 pt-4">Materi Prasyarat</span>
        <div v-if="modeGuru && data.prasyarat.length" class="flex flex-wrap gap-1.5">
          <span
            v-for="p in data.prasyarat"
            :key="p"
            class="rounded-full bg-ink-100 px-2.5 py-1 text-sm text-ink-600"
          >
            {{ p }}
          </span>
        </div>

        <div class="rounded-xl border border-ink-200 bg-white p-4">
          <p class="font-semibold text-ink-800">Tujuan pembelajaran</p>
          <ul class="mt-2 flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-ink-700">
            <li v-for="t in tujuan" :key="t.teks">
              <span v-if="t.kode" class="mr-1.5 font-semibold text-ink-800">{{ t.kode }}</span>{{ t.teks }}
            </li>
          </ul>
        </div>
      </section>

      <LayarSection v-for="l in data.layar" :key="l.id" :layar="l" :kegiatan-id="data.id" />

      <section v-if="data.glosarium.length" class="flex flex-col gap-3">
        <h2 class="text-xl font-semibold text-ink-900">Glosarium</h2>
        <dl class="flex flex-col gap-2 rounded-xl border border-ink-200 bg-white p-4">
          <div v-for="g in data.glosarium" :key="g.istilah">
            <dt class="font-medium text-ink-800">{{ g.istilah }}</dt>
            <dd class="text-sm text-ink-600">{{ g.arti }}</dd>
          </div>
        </dl>
      </section>

      <section v-if="data.referensi.length" class="flex flex-col gap-2">
        <h2 class="text-xl font-semibold text-ink-900">Referensi</h2>
        <ol class="flex list-decimal flex-col gap-1 pl-5 text-sm wrap-break-word text-ink-600">
          <li v-for="r in data.referensi" :key="r">{{ r }}</li>
        </ol>
      </section>

      <nav aria-label="Kegiatan sebelumnya dan berikutnya" class="grid grid-cols-2 gap-3">
        <button
          v-if="sebelumnya"
          type="button"
          class="col-start-1 flex flex-col items-start gap-0.5 rounded-xl border border-ink-200 bg-white p-3 text-left hover:border-accent-1/40"
          @click="bukaKb(sebelumnya.kb)"
        >
          <span class="flex items-center gap-1 text-xs font-semibold text-ink-500">
            <PhArrowLeft :size="14" weight="bold" /> KB {{ sebelumnya.kb }}
          </span>
          <span class="text-sm font-medium text-ink-800">{{ sebelumnya.judul }}</span>
        </button>
        <button
          v-if="berikutnya"
          type="button"
          class="col-start-2 flex flex-col items-end gap-0.5 rounded-xl border border-accent-1/40 bg-accent-1/5 p-3 text-right hover:border-accent-1"
          @click="bukaKb(berikutnya.kb)"
        >
          <span class="flex items-center gap-1 text-xs font-semibold text-accent-1">
            KB {{ berikutnya.kb }} <PhArrowRight :size="14" weight="bold" />
          </span>
          <span class="text-sm font-medium text-ink-800">{{ berikutnya.judul }}</span>
        </button>
      </nav>
    </main>
  </div>
</template>
