<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { PhArrowLeft, PhArrowRight, PhCaretDown, PhCheck, PhX } from "@phosphor-icons/vue";
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

// ---------- Kepala halaman ringkas ----------
const URUTAN_TAHAP = [
  "konstruktivisme",
  "inkuiri",
  "bertanya",
  "masyarakat-belajar",
  "pemodelan",
  "refleksi",
  "penilaian-autentik",
] as const;
const LABEL_TAHAP: Record<string, string> = {
  konstruktivisme: "Konstruktivisme",
  inkuiri: "Inkuiri",
  bertanya: "Bertanya",
  "masyarakat-belajar": "Masyarakat belajar",
  pemodelan: "Pemodelan",
  refleksi: "Refleksi",
  "penilaian-autentik": "Penilaian autentik",
};

const tahapAktif = ref<string | null>(null);
const nomorTahap = computed(() =>
  tahapAktif.value ? URUTAN_TAHAP.indexOf(tahapAktif.value as (typeof URUTAN_TAHAP)[number]) + 1 : 0,
);
const kepalaTampak = ref(true);
const daftarTerbuka = ref(false);
const tombolDaftarRef = ref<HTMLButtonElement | null>(null);

let posisiTerakhir = 0;
let menungguFrame = false;
function perbaruiSaatGulir() {
  const y = window.scrollY;
  // Sembunyikan saat menggulir ke bawah, tampilkan lagi saat menggulir ke atas atau di dekat puncak.
  if (y < 80 || y < posisiTerakhir - 4) kepalaTampak.value = true;
  else if (y > posisiTerakhir + 4) kepalaTampak.value = false;
  posisiTerakhir = y;

  // Tahap aktif = layar terakhir yang bagian atasnya sudah melewati sepertiga layar.
  let aktif: string | null = null;
  for (const el of document.querySelectorAll<HTMLElement>("[data-tahap]")) {
    if (el.getBoundingClientRect().top <= window.innerHeight / 3) aktif = el.dataset.tahap ?? null;
    else break;
  }
  tahapAktif.value = aktif;
}
function saatGulir() {
  if (menungguFrame) return;
  menungguFrame = true;
  requestAnimationFrame(() => {
    menungguFrame = false;
    perbaruiSaatGulir();
  });
}
function saatTombol(e: KeyboardEvent) {
  if (e.key === "Escape" && daftarTerbuka.value) tutupDaftar();
}
onMounted(() => {
  window.addEventListener("scroll", saatGulir, { passive: true });
  window.addEventListener("keydown", saatTombol);
  perbaruiSaatGulir();
});
onBeforeUnmount(() => {
  window.removeEventListener("scroll", saatGulir);
  window.removeEventListener("keydown", saatTombol);
});

function bukaDaftar() {
  daftarTerbuka.value = true;
}
function tutupDaftar() {
  daftarTerbuka.value = false;
  nextTick(() => tombolDaftarRef.value?.focus());
}
function pilihKb(kb: number) {
  daftarTerbuka.value = false;
  bukaKb(kb);
}

watch(
  kbAktif,
  async (kb, lama) => {
    try {
      localStorage.setItem(KUNCI_KB_TERAKHIR, String(kb));
    } catch {
      /* abaikan */
    }
    if (lama !== undefined) {
      window.scrollTo({ top: 0 });
      kepalaTampak.value = true;
    }
    await nextTick();
    perbaruiSaatGulir();
  },
  { immediate: true },
);

const tujuan = computed(() =>
  data.value.tujuanPembelajaran.map((t) => (typeof t === "string" ? { kode: null, teks: t } : t)),
);
</script>

<template>
  <div class="min-h-dvh bg-ink-50 text-ink-900 font-sans">
    <header
      class="sticky top-0 z-20 border-b border-ink-200 bg-ink-50/95 backdrop-blur transition-transform duration-200"
      :class="kepalaTampak || daftarTerbuka ? 'translate-y-0' : '-translate-y-full'"
    >
      <div class="flex flex-col gap-1.5 px-5 py-2.5 sm:px-8 lg:px-12">
        <button
          ref="tombolDaftarRef"
          type="button"
          class="flex items-center gap-2 self-start rounded-lg py-0.5 text-left text-ink-900 hover:text-accent-1"
          aria-haspopup="dialog"
          :aria-expanded="daftarTerbuka"
          @click="bukaDaftar"
        >
          <span class="font-semibold">KB {{ data.kb }} · {{ data.judul }}</span>
          <PhCaretDown :size="16" weight="bold" class="shrink-0" />
        </button>
        <div
          class="flex items-center gap-2.5"
          role="progressbar"
          aria-label="Tahap STEM-CTL"
          aria-valuemin="0"
          aria-valuemax="7"
          :aria-valuenow="nomorTahap"
          :aria-valuetext="tahapAktif ? `${LABEL_TAHAP[tahapAktif]}, tahap ${nomorTahap} dari 7` : 'Pengantar'"
        >
          <span class="flex gap-1" aria-hidden="true">
            <span
              v-for="(t, i) in URUTAN_TAHAP"
              :key="t"
              class="h-2 w-2 rounded-full transition-colors"
              :class="i < nomorTahap ? 'bg-brand' : 'bg-ink-200'"
            ></span>
          </span>
          <span class="text-sm text-ink-600">
            <template v-if="tahapAktif">{{ LABEL_TAHAP[tahapAktif] }} ({{ nomorTahap }} dari 7)</template>
            <template v-else>Pengantar</template>
          </span>
        </div>
      </div>
    </header>

    <Teleport to="body">
      <div v-if="daftarTerbuka" class="fixed inset-0 z-50 flex items-end justify-center">
        <div class="absolute inset-0 bg-brand-dark/40" aria-hidden="true" @click="tutupDaftar"></div>
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="judul-daftar-kb"
          class="relative w-full rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-xl lg:w-2/3"
        >
          <div class="mb-3 flex items-center justify-between">
            <h2 id="judul-daftar-kb" class="text-lg font-semibold text-ink-900">Kegiatan belajar</h2>
            <button
              type="button"
              class="rounded-lg p-1.5 text-ink-600 hover:bg-ink-100"
              aria-label="Tutup daftar kegiatan belajar"
              @click="tutupDaftar"
            >
              <PhX :size="20" weight="bold" />
            </button>
          </div>
          <ol class="flex flex-col gap-1.5">
            <li v-for="k in daftarKegiatan" :key="k.id">
              <button
                type="button"
                class="flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left"
                :class="k.kb === kbAktif ? 'border-brand bg-brand-light' : 'border-ink-200 hover:bg-ink-50'"
                :aria-current="k.kb === kbAktif ? 'page' : undefined"
                @click="pilihKb(k.kb!)"
              >
                <span class="w-10 shrink-0 text-sm font-semibold text-accent-1">KB {{ k.kb }}</span>
                <span class="flex-1 font-medium text-ink-900">{{ k.judul }}</span>
                <PhCheck v-if="k.kb === kbAktif" :size="18" weight="bold" class="shrink-0 text-accent-1" />
              </button>
            </li>
          </ol>
        </div>
      </div>
    </Teleport>

    <main :key="data.id" class="flex w-full flex-col gap-16 px-5 py-8 pb-40 sm:px-8 lg:px-12">
      <section class="flex flex-col gap-3">
        <h1 class="text-2xl font-bold text-ink-900">{{ data.judul }}</h1>
        
        <span class="text-sm font-semibold uppercase tracking-wide text-ink-500">
          <template v-if="data.alokasiWaktu">Alokasi waktu : {{ data.alokasiWaktu }} menit</template>
        </span>
        <span class="font-medium text-ink-800 pt-4">Materi Prasyarat</span>
        <div v-if="data.prasyarat.length" class="flex flex-wrap gap-1.5">
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
