<script setup lang="ts">
import { computed, ref } from "vue";
import { GAMMA_MONOATOMIK } from "@/lib/termodinamika";
import { formatDesimal, type TitikPV } from "@/lib/prosesPV";
import type { BlokWidgetCarnot } from "@/types/kegiatan";

const props = defineProps<{ blok: BlokWidgetCarnot }>();

const TH = ref(props.blok.TH.awal);
const TC = ref(props.blok.TC.awal);
const tampil = (x: BlokWidgetCarnot["tampilkan"][number]) => props.blok.tampilkan.includes(x);

const valid = computed(() => TC.value < TH.value);
const efisiensi = computed(() => (valid.value ? 1 - TC.value / TH.value : null));
const kpPendingin = computed(() => (valid.value ? TC.value / (TH.value - TC.value) : null));

// ---------- Siklus Carnot pada diagram p-V (satuan relatif, nR = 1, gas monoatomik) ----------
const g = GAMMA_MONOATOMIK;
const V1 = 1;
const V2 = 2; // ekspansi isotermal 1 → 2 pada TH
const faktorAdiabat = (th: number, tc: number) => Math.pow(th / tc, 1 / (g - 1));


const keadaan = computed(() => {
  const f = faktorAdiabat(TH.value, TC.value);
  const V3 = V2 * f;
  const V4 = V1 * f;
  return {
    1: { V: V1, p: TH.value / V1 },
    2: { V: V2, p: TH.value / V2 },
    3: { V: V3, p: TC.value / V3 },
    4: { V: V4, p: TC.value / V4 },
  } as Record<1 | 2 | 3 | 4, TitikPV>;
});

const sampel = (a: TitikPV, b: TitikPV, adiabatik: boolean, n = 40) => {
  const k = adiabatik ? a.p * Math.pow(a.V, g) : a.p * a.V;
  return Array.from({ length: n + 1 }, (_, i) => {
    const V = a.V + ((b.V - a.V) * i) / n;
    return { V, p: adiabatik ? k / Math.pow(V, g) : k / V };
  });
};

const W = 340;
const H = 240;
const pad = { kiri: 40, kanan: 12, atas: 12, bawah: 32 };
const lebar = W - pad.kiri - pad.kanan;
const tinggi = H - pad.atas - pad.bawah;
// Sumbu menyesuaikan siklus saat ini supaya bentuknya selalu terbaca jelas (bukan terjepit di pojok).
const VSumbuMax = computed(() => keadaan.value[3].V * 1.1);
const pSumbuMax = computed(() => keadaan.value[1].p * 1.1);
const x = (V: number) => pad.kiri + (V / VSumbuMax.value) * lebar;
const y = (p: number) => pad.atas + tinggi - (p / pSumbuMax.value) * tinggi;
const d = (t: TitikPV[]) => t.map((q, i) => `${i ? "L" : "M"}${x(q.V)},${y(q.p)}`).join(" ");

const sisi = computed(() => {
  const k = keadaan.value;
  return {
    panas: sampel(k[1], k[2], false),
    adiabat1: sampel(k[2], k[3], true),
    dingin: sampel(k[3], k[4], false),
    adiabat2: sampel(k[4], k[1], true),
  };
});
const dSiklus = computed(
  () => `${d([...sisi.value.panas, ...sisi.value.adiabat1, ...sisi.value.dingin, ...sisi.value.adiabat2])} Z`,
);
</script>

<template>
  <div class="flex flex-col gap-3 rounded-xl border border-ink-200 bg-white p-4">
    <p class="text-xs font-semibold uppercase tracking-wide text-accent-1">Siklus Carnot</p>
    <p v-if="blok.instruksi" class="text-sm text-ink-700">{{ blok.instruksi }}</p>

    <div class="grid gap-3 sm:grid-cols-2">
      <label class="flex flex-col gap-1 text-sm">
        <span class="flex justify-between text-ink-600">
          <span>Suhu reservoir panas (T<sub>H</sub>)</span>
          <span class="font-medium text-salah">{{ TH }} {{ blok.TH.satuan }}</span>
        </span>
        <input v-model.number="TH" type="range" :min="blok.TH.min" :max="blok.TH.max" :step="blok.TH.langkah" />
      </label>
      <label class="flex flex-col gap-1 text-sm">
        <span class="flex justify-between text-ink-600">
          <span>Suhu reservoir dingin (T<sub>C</sub>)</span>
          <span class="font-medium text-accent-1">{{ TC }} {{ blok.TC.satuan }}</span>
        </span>
        <input v-model.number="TC" type="range" :min="blok.TC.min" :max="blok.TC.max" :step="blok.TC.langkah" />
      </label>
    </div>

    <p v-if="!valid" class="rounded-lg bg-periksa/10 p-2 text-sm text-periksa">
      T<sub>C</sub> harus lebih rendah daripada T<sub>H</sub>. Tanpa beda suhu, mesin kalor tidak dapat menghasilkan usaha.
    </p>

    <svg
      v-if="tampil('siklus-pv')"
      :viewBox="`0 0 ${W} ${H}`"
      class="w-full max-w-lg self-center"
      role="img"
      aria-label="Diagram p-V siklus Carnot: dua isoterm dan dua adiabat"
    >
      <line :x1="pad.kiri" :y1="pad.atas + tinggi" :x2="pad.kiri + lebar" :y2="pad.atas + tinggi" class="stroke-ink-400" />
      <line :x1="pad.kiri" :y1="pad.atas" :x2="pad.kiri" :y2="pad.atas + tinggi" class="stroke-ink-400" />
      <text :x="pad.kiri + lebar / 2" :y="H - 8" text-anchor="middle" class="fill-ink-700 text-[10px]">V (relatif)</text>
      <text
        x="12"
        :y="pad.atas + tinggi / 2"
        text-anchor="middle"
        :transform="`rotate(-90 12 ${pad.atas + tinggi / 2})`"
        class="fill-ink-700 text-[10px]"
      >
        p (relatif)
      </text>

      <template v-if="valid">
        <path :d="dSiklus" class="fill-accent-2/30" />
        <path :d="d(sisi.panas)" fill="none" class="stroke-salah" stroke-width="2.5" />
        <path :d="d(sisi.dingin)" fill="none" class="stroke-accent-1" stroke-width="2.5" />
        <path :d="d(sisi.adiabat1)" fill="none" class="stroke-ink-600" stroke-width="2" stroke-dasharray="5 3" />
        <path :d="d(sisi.adiabat2)" fill="none" class="stroke-ink-600" stroke-width="2" stroke-dasharray="5 3" />
        <g v-for="(k, n) in keadaan" :key="n">
          <circle :cx="x(k.V)" :cy="y(k.p)" r="3.5" class="fill-ink-800" />
          <text :x="x(k.V) + 6" :y="y(k.p) - 5" class="fill-ink-800 text-[10px] font-semibold">{{ n }}</text>
        </g>
      </template>
    </svg>

    <div v-if="tampil('siklus-pv')" class="flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-600">
      <span class="flex items-center gap-1">
        <span class="h-0.5 w-4 bg-salah"></span><span>Isoterm T<sub>H</sub> (1→2, menyerap Q<sub>H</sub>)</span>
      </span>
      <span class="flex items-center gap-1">
        <span class="h-0.5 w-4 bg-accent-1"></span><span>Isoterm T<sub>C</sub> (3→4, membuang Q<sub>C</sub>)</span>
      </span>
      <span class="flex items-center gap-1">
        <span class="w-4 border-t-2 border-dashed border-ink-600"></span><span>Adiabat (2→3, 4→1)</span>
      </span>
      <span class="flex items-center gap-1">
        <span class="h-3 w-4 rounded-sm bg-accent-2/30"></span><span>Luas = usaha bersih</span>
      </span>
    </div>

    <dl class="grid gap-2 sm:grid-cols-2">
      <div v-if="tampil('efisiensi-carnot')" class="rounded-lg bg-accent-1/10 p-3">
        <dt class="text-xs text-accent-1">Efisiensi Carnot, η = 1 − T<sub>C</sub>/T<sub>H</sub></dt>
        <dd class="text-xl font-semibold text-accent-1">
          {{ efisiensi === null ? "–" : `${formatDesimal(efisiensi * 100, 1)} %` }}
        </dd>
      </div>
      <div v-if="tampil('koefisien-performansi-carnot')" class="rounded-lg bg-benar/10 p-3">
        <dt class="text-xs text-benar">
          Koefisien performansi mesin pendingin Carnot, K = T<sub>C</sub>/(T<sub>H</sub> − T<sub>C</sub>)
        </dt>
        <dd class="text-xl font-semibold text-benar">{{ kpPendingin === null ? "–" : formatDesimal(kpPendingin, 2) }}</dd>
      </div>
    </dl>
    <p class="text-xs text-ink-500">
      Diagram memakai satuan relatif untuk gas ideal monoatomik (γ = 5/3) dengan V₂ = 2V₁, dan skala sumbunya
      menyesuaikan siklus. Bentuk siklus, bukan angkanya, yang perlu diamati.
    </p>
  </div>
</template>
