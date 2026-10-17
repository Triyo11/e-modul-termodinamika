<script setup lang="ts">
import { computed, provide, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import LayarSection from "@/components/materi/LayarSection.vue";
import kegiatanGasIdeal from "@/content/kegiatan-01-gas-ideal.json";
import kegiatanTeoriKinetik from "@/content/kegiatan-03-teori-kinetik-gas.json";
import { kegiatanKey } from "@/lib/tabelIsian";
import type { Kegiatan } from "@/types/kegiatan";

type KodeVersi = "a" | "b";

const daftarVersi: Record<KodeVersi, { label: string; data: Kegiatan }> = {
  a: { label: "Versi A", data: kegiatanGasIdeal as unknown as Kegiatan },
  b: { label: "Versi B", data: kegiatanTeoriKinetik as unknown as Kegiatan },
};

const KUNCI_VERSI = "materi:versi";
const route = useRoute();
const router = useRouter();

function versiTersimpan(): KodeVersi {
  try {
    const v = localStorage.getItem(KUNCI_VERSI);
    if (v === "a" || v === "b") return v;
  } catch {
    /* localStorage tidak tersedia */
  }
  return "a";
}

// Versi aktif dibaca dari ?versi=a|b agar dapat dibagikan lewat tautan; jika tidak ada, pakai pilihan terakhir.
const versi = computed<KodeVersi>(() => {
  const q = route.query.versi;
  return q === "a" || q === "b" ? q : versiTersimpan();
});

function pilihVersi(v: KodeVersi) {
  if (v === versi.value) return;
  router.replace({ query: { ...route.query, versi: v } });
}

watch(
  versi,
  (v) => {
    try {
      localStorage.setItem(KUNCI_VERSI, v);
    } catch {
      /* abaikan */
    }
  },
  { immediate: true },
);

const data = computed(() => daftarVersi[versi.value].data);
provide(kegiatanKey, data);

const tujuan = computed(() =>
  data.value.tujuanPembelajaran.map((t) => (typeof t === "string" ? { kode: null, teks: t } : t)),
);
</script>

<template>
  <div class="min-h-dvh bg-ink-50 text-ink-900 font-sans">
    <main class="flex flex-col gap-8 px-5 py-6 pb-40">
      <nav aria-label="Pilih versi materi" class="flex flex-col gap-2">
        <div class="grid grid-cols-2 gap-1 rounded-xl border border-ink-200 bg-white p-1" role="tablist">
          <button
            v-for="(v, kode) in daftarVersi"
            :key="kode"
            type="button"
            role="tab"
            :aria-selected="versi === kode"
            class="flex flex-col items-start rounded-lg px-3 py-2 text-left transition-colors"
            :class="versi === kode ? 'bg-accent-1 text-white' : 'text-ink-600 hover:bg-ink-100'"
            @click="pilihVersi(kode)"
          >
            <span class="text-xs font-semibold uppercase tracking-wide opacity-80">{{ v.label }}</span>
            <span class="text-sm font-medium leading-tight">{{ v.data.judul }}</span>
          </button>
        </div>
      </nav>

      <div :key="versi" class="flex flex-col gap-8">
        <section class="flex flex-col gap-3">
          <span class="text-sm font-semibold uppercase tracking-wide text-ink-400">
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
                <span v-if="t.kode" class="font-semibold text-ink-800">{{ t.kode }} </span>{{ t.teks }}
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
          <ol class="flex list-decimal flex-col gap-1 pl-5 text-sm text-ink-600">
            <li v-for="r in data.referensi" :key="r">{{ r }}</li>
          </ol>
        </section>
      </div>
    </main>
  </div>
</template>
