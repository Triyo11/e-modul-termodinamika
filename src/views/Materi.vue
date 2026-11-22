<script setup lang="ts">
import { computed, nextTick, provide, ref, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { PhArrowLeft, PhArrowRight } from "@phosphor-icons/vue";
import LayarSection from "@/components/materi/LayarSection.vue";
import { cariKegiatanKb, daftarKegiatan } from "@/content";
import { kegiatanKey } from "@/lib/tabelIsian";
import { hitungNomorWorksheet, nomorWorksheetKey } from "@/lib/worksheet";

const KUNCI_KB_TERAKHIR = "materi:kb-terakhir";
const route = useRoute();
const router = useRouter();

function kbTersimpan(): number {
  try {
    const n = Number(localStorage.getItem(KUNCI_KB_TERAKHIR));
    if (cariKegiatanKb(n)) return n;
  } catch {
    /* localStorage tidak tersedia */
  }
  return daftarKegiatan[0]?.kb ?? 1;
}

// KB aktif dibaca dari /materi/:kb agar dapat dibagikan lewat tautan; /materi saja membuka KB terakhir.
const kbAktif = computed(() => {
  const n = Number(route.params.kb);
  return cariKegiatanKb(n) ? n : kbTersimpan();
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
  router.push({ name: "materi", params: { kb: String(kb) } });
}

// Rapikan URL /materi (atau KB yang tidak ada) menjadi /materi/<kb> tanpa menambah riwayat.
watch(
  () => route.params.kb,
  (kb) => {
    if (String(kb ?? "") !== String(kbAktif.value)) {
      router.replace({ name: "materi", params: { kb: String(kbAktif.value) } });
    }
  },
  { immediate: true },
);

const navRef = ref<HTMLElement | null>(null);
watch(
  kbAktif,
  async (kb) => {
    try {
      localStorage.setItem(KUNCI_KB_TERAKHIR, String(kb));
    } catch {
      /* abaikan */
    }
    // Pastikan tombol KB aktif terlihat di bilah yang dapat digulir mendatar.
    await nextTick();
    navRef.value
      ?.querySelector<HTMLElement>('[aria-current="page"]')
      ?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
  },
  { immediate: true },
);

const tujuan = computed(() =>
  data.value.tujuanPembelajaran.map((t) => (typeof t === "string" ? { kode: null, teks: t } : t)),
);
</script>

<template>
  <div class="min-h-dvh bg-ink-50 text-ink-900 font-sans">
    <nav
      ref="navRef"
      aria-label="Kegiatan belajar"
      class="sticky top-0 z-10 border-b border-ink-200 bg-ink-50/95 backdrop-blur"
    >
      <ol class="flex gap-1.5 overflow-x-auto px-5 py-2 scrollbar-none">
        <li v-for="k in daftarKegiatan" :key="k.id" class="shrink-0">
          <button
            type="button"
            :aria-current="k.kb === kbAktif ? 'page' : undefined"
            class="flex h-full max-w-44 flex-col items-start rounded-lg border px-3 py-1.5 text-left transition-colors"
            :class="
              k.kb === kbAktif
                ? 'border-brand bg-brand text-brand-dark'
                : 'border-ink-200 bg-white text-ink-600 hover:border-accent-1/40'
            "
            @click="bukaKb(k.kb)"
          >
            <span class="text-[11px] font-semibold uppercase tracking-wide opacity-80">KB {{ k.kb }}</span>
            <span class="line-clamp-2 w-full text-sm font-medium leading-tight">{{ k.judul }}</span>
          </button>
        </li>
      </ol>
    </nav>

    <main :key="data.id" class="flex flex-col gap-8 px-5 py-6 pb-40">
      <section class="flex flex-col gap-3">
        <span class="text-sm font-semibold uppercase tracking-wide text-ink-500">
          {{ data.bab }}<template v-if="data.kb"> · KB {{ data.kb }}</template> · Kelas {{ data.kelas }}
          <template v-if="data.alokasiWaktu"> · {{ data.alokasiWaktu }} menit</template>
        </span>
        <h1 class="text-2xl font-bold text-ink-900">{{ data.judul }}</h1>
        <p class="text-body text-ink-600">{{ data.subJudul }}</p>

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
          <ul class="mt-2 flex list-disc flex-col gap-1 pl-5 text-sm leading-relaxed text-ink-700">
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
