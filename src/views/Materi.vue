<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, provide, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { PhArrowLeft, PhArrowRight, PhCheck, PhFlagCheckered, PhPlay } from "@phosphor-icons/vue";
import LayarSection from "@/components/materi/LayarSection.vue";
import StepperTahap from "@/components/materi/StepperTahap.vue";
import PanelKuis from "@/components/materi/PanelKuis.vue";
import { cariKegiatanKb, daftarKegiatan } from "@/content";
import { kegiatanKey } from "@/lib/tabelIsian";
import { hitungNomorWorksheet, nomorWorksheetKey } from "@/lib/worksheet";
import { bacaTahapDibuka, bacaTahapTerakhir, catatTahapDibuka, kelompokkanTahap } from "@/lib/tahap";

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
// Query ikut dibawa saat berpindah halaman supaya mode guru tidak hilang.
const modeGuru = computed(() => route.query.guru !== undefined);

// ---------- Tahap ----------
const daftarTahap = computed(() => kelompokkanTahap(data.value));
const idTahapUrl = computed(() => (typeof route.params.tahap === "string" ? route.params.tahap : ""));
/** -1 = halaman pengantar KB. */
const indeksTahap = computed(() => daftarTahap.value.findIndex((t) => t.id === idTahapUrl.value));
const tahapAktif = computed(() => daftarTahap.value[indeksTahap.value]);
const tahapSebelumnya = computed(() => (indeksTahap.value > 0 ? daftarTahap.value[indeksTahap.value - 1] : undefined));
const tahapBerikutnya = computed(() => daftarTahap.value[indeksTahap.value + 1]);

const kbBerikutnya = computed(() => daftarKegiatan[daftarKegiatan.indexOf(data.value) + 1]);

const tahapDibuka = ref<string[]>([]);
const tahapTerakhir = ref<string | null>(null);
/** Tahap yang dituju tombol utama di pengantar: lanjutkan tahap terakhir, atau mulai dari tahap 1. */
const tahapLanjutan = computed(
  () => daftarTahap.value.find((t) => t.id === tahapTerakhir.value) ?? daftarTahap.value[0],
);

function buka(kb: number, tahap: string | null) {
  router.push({
    name: "materi-kb",
    params: { kb: String(kb), tahap: tahap ?? "" },
    query: route.query,
  });
}
function bukaTahap(id: string | null) {
  if ((id ?? "") === idTahapUrl.value) return;
  buka(kbAktif.value, id);
}

// KB yang tidak ada → pilihan materi; tahap yang tidak ada → pengantar KB.
watch(
  () => [route.params.kb, route.params.tahap],
  () => {
    if (route.name !== "materi-kb") return;
    if (!cariKegiatanKb(Number(route.params.kb))) router.replace({ name: "materi" });
    else if (idTahapUrl.value && indeksTahap.value === -1)
      router.replace({ name: "materi-kb", params: { kb: String(kbAktif.value) }, query: route.query });
  },
  { immediate: true },
);

// ---------- Posisi gulir per halaman (pengantar atau tahap) ----------
// Tiap halaman mengingat posisi gulir terakhirnya; halaman yang belum pernah dibuka mulai dari atas.
const kunciHalaman = computed(() => `${kbAktif.value}:${idTahapUrl.value || "pengantar"}`);
const kunciPosisi = (halaman: string) => `materi:posisi-gulir:${halaman}`;

function bacaPosisi(halaman: string): number {
  try {
    const y = Number(localStorage.getItem(kunciPosisi(halaman)));
    return Number.isFinite(y) && y > 0 ? y : 0;
  } catch {
    return 0;
  }
}
function simpanPosisi(halaman: string, y: number) {
  try {
    localStorage.setItem(kunciPosisi(halaman), String(Math.round(y)));
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
    if (!sedangMemulihkan) simpanPosisi(kunciHalaman.value, window.scrollY);
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
  kunciHalaman,
  (halaman) => {
    const kb = kbAktif.value;
    try {
      localStorage.setItem(KUNCI_KB_TERAKHIR, String(kb));
    } catch {
      /* abaikan */
    }
    tahapDibuka.value = tahapAktif.value ? catatTahapDibuka(kb, tahapAktif.value.id) : bacaTahapDibuka(kb);
    tahapTerakhir.value = bacaTahapTerakhir(kb);

    // Baca posisi sebelum konten berganti, lalu pulihkan setelah konten halaman baru tampil.
    const target = bacaPosisi(halaman);
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
    <StepperTahap
      :kb="data.kb ?? kbAktif"
      :judul-kb="data.judul"
      :tahap="daftarTahap"
      :aktif="indeksTahap"
      :dibuka="tahapDibuka"
      @pilih="bukaTahap"
    />

    <!-- ===================== Halaman pengantar KB ===================== -->
    <main
      v-if="!tahapAktif"
      :key="`${data.id}:pengantar`"
      class="flex w-full flex-col gap-12 px-5 py-8 pb-32 sm:px-8 lg:px-12"
    >
      <section class="flex flex-col gap-3">
        <div class="w-full flex flex-col gap-1 p-4 rounded-xl border-3 border-dashed border-accent-4/60">
          <span class="text-sm font-semibold text-accent-4-teks">Kegiatan Belajar {{ data.kb }}</span>
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

        <div class="rounded-xl border border-ink-200 bg-surface p-4">
          <p class="font-semibold text-ink-800">Tujuan pembelajaran</p>
          <ul class="mt-2 flex list-disc flex-col gap-2 pl-5 text-base leading-relaxed text-ink-700">
            <li v-for="t in tujuan" :key="t.teks">
              <span v-if="t.kode" class="mr-1.5 font-semibold text-ink-800">{{ t.kode }}</span>{{ t.teks }}
            </li>
          </ul>
        </div>
      </section>

      <section class="flex flex-col gap-3" aria-labelledby="judul-daftar-tahap">
        <h2 id="judul-daftar-tahap" class="text-xl font-semibold text-ink-900">Tahap pembelajaran</h2>

        <button
          v-if="tahapLanjutan"
          type="button"
          class="flex items-center justify-center gap-2 rounded-lg border-2 border-brand-dark bg-brand px-4 py-3 font-semibold text-brand-dark shadow-button active:translate-x-0.5 active:translate-y-0.5"
          @click="bukaTahap(tahapLanjutan.id)"
        >
          <PhPlay :size="18" weight="fill" />
          <template v-if="tahapTerakhir && tahapLanjutan.id === tahapTerakhir">
            Lanjutkan: Tahap {{ daftarTahap.indexOf(tahapLanjutan) + 1 }} · {{ tahapLanjutan.label }}
          </template>
          <template v-else>Mulai dari Tahap 1 · {{ tahapLanjutan.label }}</template>
        </button>

        <ol class="mt-2 flex flex-col gap-3">
          <li v-for="(t, i) in daftarTahap" :key="t.id">
            <button
              type="button"
              class="flex w-full items-center gap-3 rounded-xl border border-ink-200 bg-surface p-3 text-left"
              @click="bukaTahap(t.id)"
            >
              <span
                class="flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold"
                :class="tahapDibuka.includes(t.id) ? 'border-accent-4 text-accent-4-teks' : 'border-ink-300 text-ink-600'"
              >
                {{ i + 1 }}
              </span>
              <span class="flex flex-1 flex-col">
                <span class="text-xs font-semibold uppercase tracking-wide text-ink-500">{{ t.label }}</span>
                <span class="font-medium text-ink-900">{{ t.layar.map((l) => l.judul).join(" · ") }}</span>
              </span>
              <PhCheck
                v-if="tahapDibuka.includes(t.id)"
                :size="18"
                weight="bold"
                class="shrink-0 text-accent-4-teks"
                aria-label="Sudah dibuka"
              />
            </button>
          </li>
        </ol>
      </section>

      <section v-if="data.glosarium.length" class="flex flex-col gap-3">
        <h2 class="text-xl font-semibold text-ink-900">Glosarium</h2>
        <dl class="flex flex-col gap-2 rounded-xl border border-ink-200 bg-surface p-4">
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
    </main>

    <!-- ===================== Halaman satu tahap ===================== -->
    <main
      v-else
      :key="`${data.id}:${tahapAktif.id}`"
      class="flex w-full flex-col gap-16 px-5 py-8 pb-32 sm:px-8 lg:px-12 [&>section:first-child]:border-t-0 [&>section:first-child]:pt-0"
    >
      <LayarSection v-for="l in tahapAktif.layar" :key="l.id" :layar="l" :kegiatan-id="data.id" />

      <nav aria-label="Tahap sebelumnya dan berikutnya" class="grid grid-cols-2 gap-3">
        <button
          type="button"
          class="col-start-1 flex flex-col items-start gap-0.5 rounded-lg border border-ink-300 px-5 py-3 text-left"
          @click="bukaTahap(tahapSebelumnya?.id ?? null)"
        >
          <span class="flex items-center gap-1 text-xs font-semibold text-ink-500">
            <PhArrowLeft :size="14" weight="bold" />
            <template v-if="tahapSebelumnya">Tahap {{ indeksTahap }}</template>
            <template v-else>Pengantar</template>
          </span>
          <span class="text-sm font-medium text-ink-800">{{ tahapSebelumnya?.label ?? `KB ${data.kb}` }}</span>
        </button>

        <button
          v-if="tahapBerikutnya"
          type="button"
          class="col-start-2 flex flex-col items-end gap-0.5 rounded-lg border-2 border-brand-dark bg-brand px-5 py-3 text-right text-brand-dark shadow-button active:translate-x-0.5 active:translate-y-0.5"
          @click="bukaTahap(tahapBerikutnya.id)"
        >
          <span class="flex items-center gap-1 text-xs font-semibold">
            Tahap {{ indeksTahap + 2 }} <PhArrowRight :size="14" weight="bold" />
          </span>
          <span class="text-sm font-semibold">{{ tahapBerikutnya.label }}</span>
        </button>
        <button
          v-else-if="kbBerikutnya"
          type="button"
          class="col-start-2 flex flex-col items-end gap-0.5 rounded-lg border-2 border-brand-dark bg-brand px-5 py-3 text-right text-brand-dark shadow-button active:translate-x-0.5 active:translate-y-0.5"
          @click="buka(kbBerikutnya.kb!, null)"
        >
          <span class="flex items-center gap-1 text-xs font-semibold">
            <PhFlagCheckered :size="14" weight="bold" /> KB {{ kbBerikutnya.kb }}
            <PhArrowRight :size="14" weight="bold" />
          </span>
          <span class="text-sm font-semibold">{{ kbBerikutnya.judul }}</span>
        </button>
        <button
          v-else
          type="button"
          class="col-start-2 flex flex-col items-end gap-0.5 rounded-lg border-2 border-brand-dark bg-brand px-5 py-3 text-right text-brand-dark shadow-button active:translate-x-0.5 active:translate-y-0.5"
          @click="router.push({ name: 'materi', query: route.query })"
        >
          <span class="flex items-center gap-1 text-xs font-semibold">
            <PhFlagCheckered :size="14" weight="bold" /> Selesai
          </span>
          <span class="text-sm font-semibold">Kembali ke daftar materi</span>
        </button>
      </nav>
    </main>

    <!-- Panel kuis per KB: tombol mengambang + panel samping -->
    <PanelKuis :kegiatan="data" />
  </div>
</template>
