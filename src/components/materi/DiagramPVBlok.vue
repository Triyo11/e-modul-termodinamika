<script setup lang="ts">
import { computed, ref } from "vue";
import { useJawabanTersimpan } from "@/lib/jawabanTersimpan";
import {
  bisaDicapai,
  formatDesimal,
  labelProses,
  sampelLintasan,
  satuanUsaha,
  usahaProses,
  type TitikPV,
} from "@/lib/prosesPV";
import type { BlokDiagramPV, ProsesPV } from "@/types/kegiatan";

const props = defineProps<{ blok: BlokDiagramPV; kegiatanId: string }>();

const s = props.blok.sumbu;
const tersedia = props.blok.prosesTersedia;
const satuanW = satuanUsaha(s.satuanP, s.satuanV);
/** Wilayah titik yang boleh dipakai: kotak batas (mode rancang) atau seluruh sumbu. */
const kotak = props.blok.batas ?? { pMin: s.pMin, pMax: s.pMax, VMin: s.VMin, VMax: s.VMax };

// ---------- Geometri diagram ----------
const W = 340;
const H = 260;
const pad = { kiri: 46, kanan: 14, atas: 12, bawah: 36 };
const lebar = W - pad.kiri - pad.kanan;
const tinggi = H - pad.atas - pad.bawah;

const x = (V: number) => pad.kiri + ((V - s.VMin) / (s.VMax - s.VMin)) * lebar;
const y = (p: number) => pad.atas + tinggi - ((p - s.pMin) / (s.pMax - s.pMin)) * tinggi;
const Vdari = (px: number) => s.VMin + ((px - pad.kiri) / lebar) * (s.VMax - s.VMin);
const pdari = (py: number) => s.pMin + ((pad.atas + tinggi - py) / tinggi) * (s.pMax - s.pMin);

const langkahV = (s.VMax - s.VMin) / 50;
const langkahP = (s.pMax - s.pMin) / 40;
const bulatkan = (v: number, l: number) => Math.round(v / l) * l;
const batasi = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

const tick = (min: number, max: number) => Array.from({ length: 6 }, (_, i) => min + ((max - min) * i) / 5);
const tickV = tick(s.VMin, s.VMax);
const tickP = tick(s.pMin, s.pMax);

const d = (titik: TitikPV[]) => titik.map((t, i) => `${i ? "L" : "M"}${x(t.V)},${y(t.p)}`).join(" ");
/** Daerah di bawah lintasan sampai sumbu V (luas = usaha). */
const dLuasBawah = (titik: TitikPV[]) => {
  if (titik.length < 2) return "";
  const a = titik[0]!;
  const b = titik[titik.length - 1]!;
  return `${d(titik)} L${x(b.V)},${y(s.pMin)} L${x(a.V)},${y(s.pMin)} Z`;
};

const warnaProses: Record<ProsesPV, string> = {
  isobarik: "stroke-accent-1",
  isokhorik: "stroke-salah",
  isotermal: "stroke-benar",
};

const svgRef = ref<SVGSVGElement | null>(null);
function titikPointer(e: PointerEvent): TitikPV & { px: number; py: number } {
  const r = svgRef.value!.getBoundingClientRect();
  const px = ((e.clientX - r.left) / r.width) * W;
  const py = ((e.clientY - r.top) / r.height) * H;
  return { px, py, V: Vdari(px), p: pdari(py) };
}

// ---------- Proses: variabel bebas, rentang, dan titik akhir ----------
/** Isokhorik: p yang bebas; isobarik dan isotermal: V yang bebas. */
const bebasP = (proses: ProsesPV) => proses === "isokhorik";

function titikProses(proses: ProsesPV, a: TitikPV, bebas: number): TitikPV {
  if (proses === "isobarik") return { p: a.p, V: bebas };
  if (proses === "isokhorik") return { p: bebas, V: a.V };
  return { V: bebas, p: (a.p * a.V) / bebas };
}

function rentangBebas(proses: ProsesPV, a: TitikPV): [number, number] {
  if (proses === "isobarik") return [kotak.VMin, kotak.VMax];
  if (proses === "isokhorik") return [kotak.pMin, kotak.pMax];
  // Isotermal: V dibatasi agar p = k/V tetap di dalam kotak.
  const k = a.p * a.V;
  const VMin = Math.max(kotak.VMin, kotak.pMax > 0 ? k / kotak.pMax : kotak.VMin);
  const VMax = Math.min(kotak.VMax, kotak.pMin > 0 ? k / kotak.pMin : kotak.VMax);
  return [Math.max(VMin, 1e-6), VMax];
}

// ---------- Mode jelajah ----------
const keadaanAwal = props.blok.keadaanAwal ?? {
  p: (s.pMin + s.pMax) / 2,
  V: s.VMin + (s.VMax - s.VMin) / 4,
};
const prosesJelajah = ref<ProsesPV>(tersedia[0] ?? "isobarik");
const nilaiBebas = ref<Record<ProsesPV, number>>({
  isobarik: batasi(keadaanAwal.V * 3, ...rentangBebas("isobarik", keadaanAwal)),
  isokhorik: batasi(keadaanAwal.p * 1.5, ...rentangBebas("isokhorik", keadaanAwal)),
  isotermal: batasi(keadaanAwal.V * 3, ...rentangBebas("isotermal", keadaanAwal)),
});
const akhirJelajah = computed(() =>
  titikProses(prosesJelajah.value, keadaanAwal, nilaiBebas.value[prosesJelajah.value]),
);
const lintasanJelajah = computed(() => sampelLintasan(prosesJelajah.value, keadaanAwal, akhirJelajah.value));
const usahaJelajah = computed(() => usahaProses(prosesJelajah.value, keadaanAwal, akhirJelajah.value));
const rentangJelajah = computed(() => rentangBebas(prosesJelajah.value, keadaanAwal));

const menyeret = ref(false);
function aturDariPointer(e: PointerEvent) {
  const t = titikPointer(e);
  const proses = prosesJelajah.value;
  const mentah = bebasP(proses) ? t.p : t.V;
  const nilai = bulatkan(mentah, bebasP(proses) ? langkahP : langkahV);
  nilaiBebas.value = { ...nilaiBebas.value, [proses]: batasi(nilai, ...rentangJelajah.value) };
}

// ---------- Mode rancang ----------
interface Alternatif {
  titik: TitikPV[];
  /** proses[i] menghubungkan titik[i] ke titik[i + 1], atau ke titik[0] untuk sisi penutup. */
  proses: ProsesPV[];
  tertutup: boolean;
}

const maks = props.blok.maksAlternatif ?? 3;
const kosong = (): Alternatif => ({ titik: [], proses: [], tertutup: false });
const alternatif = useJawabanTersimpan<Alternatif[]>(
  `${props.kegiatanId}:${props.blok.id}`,
  Array.from({ length: maks }, kosong),
);
const aktif = ref(0);
const prosesRancang = ref<ProsesPV>(tersedia[0] ?? "isobarik");
const pratinjau = ref<TitikPV | null>(null);
const pesan = ref("");

const alt = computed(() => alternatif.value[aktif.value] ?? kosong());

function simpan(baru: Alternatif) {
  const salinan = [...alternatif.value];
  while (salinan.length <= aktif.value) salinan.push(kosong());
  salinan[aktif.value] = baru;
  alternatif.value = salinan;
}

/** Sisi-sisi siklus sebagai pasangan titik beserta prosesnya. */
function sisi(a: Alternatif) {
  return a.proses.map((proses, i) => ({
    proses,
    dari: a.titik[i]!,
    ke: a.titik[i + 1] ?? a.titik[0]!,
  }));
}

const sisiAktif = computed(() => sisi(alt.value));
const usahaBersih = (a: Alternatif) => sisi(a).reduce((jml, s1) => jml + usahaProses(s1.proses, s1.dari, s1.ke), 0);

/**
 * Titik akhir sisi baru: koordinat bebas diambil dari klik, lalu "ditarik" ke tekanan, volume, atau
 * isoterm titik awal jika cukup dekat, supaya siklus mudah ditutup. Selebihnya dibulatkan ke grid.
 */
function proyeksi(dari: TitikPV, klik: TitikPV, proses: ProsesPV): TitikPV {
  const awal = alt.value.titik[0]!;
  const kAwal = awal.p * awal.V;
  const mentah = bebasP(proses) ? klik.p : klik.V;
  const kandidat =
    proses === "isobarik"
      ? [awal.V, kAwal / dari.p]
      : proses === "isokhorik"
        ? [awal.p, kAwal / dari.V]
        : [awal.V, (dari.p * dari.V) / awal.p];
  const toleransi = 0.03 * (bebasP(proses) ? s.pMax - s.pMin : s.VMax - s.VMin);
  let nilai = bulatkan(mentah, bebasP(proses) ? langkahP : langkahV);
  let terdekat = toleransi;
  for (const c of kandidat) {
    if (Number.isFinite(c) && Math.abs(c - mentah) <= terdekat) {
      terdekat = Math.abs(c - mentah);
      nilai = c;
    }
  }
  return titikProses(proses, dari, batasi(nilai, ...rentangBebas(proses, dari)));
}

function samaTitik(a: TitikPV, b: TitikPV) {
  return bisaDicapai("isobarik", a, b) && bisaDicapai("isokhorik", a, b);
}

function klikRancang(e: PointerEvent) {
  pesan.value = "";
  const a = alt.value;
  if (a.tertutup) {
    pesan.value = "Siklus ini sudah tertutup. Pilih alternatif lain, atau urungkan/hapus untuk mengubahnya.";
    return;
  }
  const t = titikPointer(e);

  if (!a.titik.length) {
    const p = batasi(bulatkan(t.p, langkahP), kotak.pMin, kotak.pMax);
    const V = batasi(bulatkan(t.V, langkahV), kotak.VMin, kotak.VMax);
    simpan({ ...a, titik: [{ p, V }] });
    return;
  }

  const awal = a.titik[0]!;
  const dekatAwal = Math.hypot(t.px - x(awal.V), t.py - y(awal.p)) < 10;
  if (dekatAwal && a.titik.length >= 2) {
    tutupSiklus();
    return;
  }

  const terakhir = a.titik[a.titik.length - 1]!;
  const baru = proyeksi(terakhir, t, prosesRancang.value);
  if (samaTitik(baru, terakhir)) return;
  if (samaTitik(baru, awal)) {
    // Sisi ini langsung kembali ke titik awal: siklus tertutup.
    simpan({ titik: a.titik, proses: [...a.proses, prosesRancang.value], tertutup: true });
    return;
  }
  simpan({ titik: [...a.titik, baru], proses: [...a.proses, prosesRancang.value], tertutup: false });
}

function tutupSiklus() {
  pesan.value = "";
  const a = alt.value;
  if (a.titik.length < 2 || a.tertutup) return;
  const awal = a.titik[0]!;
  const terakhir = a.titik[a.titik.length - 1]!;
  const urutan = [prosesRancang.value, ...tersedia.filter((p) => p !== prosesRancang.value)];
  const proses = urutan.find((p) => bisaDicapai(p, terakhir, awal, 1e-3));
  if (!proses) {
    pesan.value =
      "Titik terakhir belum dapat kembali ke titik awal dengan satu proses. Tambahkan sisi yang berakhir pada tekanan, volume, atau isoterm titik awal.";
    return;
  }
  simpan({ ...a, proses: [...a.proses, proses], tertutup: true });
}

function urungkan() {
  pesan.value = "";
  const a = alt.value;
  if (a.tertutup) simpan({ ...a, proses: a.proses.slice(0, -1), tertutup: false });
  else if (a.proses.length) simpan({ titik: a.titik.slice(0, -1), proses: a.proses.slice(0, -1), tertutup: false });
  else simpan(kosong());
}

function hapus() {
  pesan.value = "";
  simpan(kosong());
}

function gerakRancang(e: PointerEvent) {
  const a = alt.value;
  if (a.tertutup || !a.titik.length) {
    pratinjau.value = null;
    return;
  }
  pratinjau.value = proyeksi(a.titik[a.titik.length - 1]!, titikPointer(e), prosesRancang.value);
}

const lintasanPratinjau = computed(() => {
  const a = alt.value;
  if (!pratinjau.value || !a.titik.length || a.tertutup) return [];
  return sampelLintasan(prosesRancang.value, a.titik[a.titik.length - 1]!, pratinjau.value);
});

/** Poligon siklus tertutup (untuk diarsir sebagai luas = usaha bersih). */
const dSiklus = computed(() => {
  if (!alt.value.tertutup) return "";
  const titik = sisiAktif.value.flatMap((s1) => sampelLintasan(s1.proses, s1.dari, s1.ke));
  return `${d(titik)} Z`;
});

// ---------- Event diagram ----------
function pointerDown(e: PointerEvent) {
  if (props.blok.mode === "jelajah") {
    menyeret.value = true;
    svgRef.value!.setPointerCapture(e.pointerId);
    aturDariPointer(e);
  }
}

function pointerMove(e: PointerEvent) {
  if (props.blok.mode === "jelajah") {
    if (menyeret.value) aturDariPointer(e);
  } else {
    gerakRancang(e);
  }
}

function pointerUp(e: PointerEvent) {
  if (props.blok.mode === "jelajah") menyeret.value = false;
  else klikRancang(e);
}

const fV = (V: number) => formatDesimal(V, 2);
const fP = (p: number) => formatDesimal(p, 0);
</script>

<template>
  <div class="flex flex-col gap-3 rounded-xl border border-ink-200 bg-white p-4">
    <p v-if="blok.instruksi" class="text-sm text-ink-700">{{ blok.instruksi }}</p>

    <!-- Pilihan proses -->
    <div class="flex flex-wrap gap-2" role="radiogroup" aria-label="Jenis proses">
      <button
        v-for="pr in tersedia"
        :key="pr"
        type="button"
        role="radio"
        :aria-checked="(blok.mode === 'jelajah' ? prosesJelajah : prosesRancang) === pr"
        class="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition-colors"
        :class="
          (blok.mode === 'jelajah' ? prosesJelajah : prosesRancang) === pr
            ? 'border-accent-1 bg-accent-1/10 text-accent-1'
            : 'border-ink-200 text-ink-600 hover:border-accent-1/40'
        "
        @click="blok.mode === 'jelajah' ? (prosesJelajah = pr) : (prosesRancang = pr)"
      >
        <svg width="16" height="4" aria-hidden="true"><line x1="0" y1="2" x2="16" y2="2" :class="warnaProses[pr]" stroke-width="3" /></svg>
        {{ labelProses[pr] }}
      </button>
    </div>

    <!-- Alternatif (mode rancang) -->
    <div v-if="blok.mode === 'rancang'" class="flex gap-1.5">
      <button
        v-for="i in maks"
        :key="i"
        type="button"
        class="rounded-lg border px-3 py-1 text-xs font-medium"
        :class="aktif === i - 1 ? 'border-ink-800 bg-ink-800 text-white' : 'border-ink-200 text-ink-600'"
        @click="(aktif = i - 1), (pesan = '')"
      >
        Alternatif {{ i }}<template v-if="alternatif[i - 1]?.tertutup"> ✓</template>
      </button>
    </div>

    <svg
      ref="svgRef"
      :viewBox="`0 0 ${W} ${H}`"
      class="w-full max-w-lg select-none self-center"
      :class="blok.mode === 'rancang' ? 'cursor-crosshair touch-pan-y' : 'cursor-pointer touch-none'"
      role="img"
      :aria-label="`Diagram p-V, sumbu p dalam ${s.satuanP} dan V dalam ${s.satuanV}`"
      @pointerdown="pointerDown"
      @pointermove="pointerMove"
      @pointerup="pointerUp"
      @pointerleave="pratinjau = null"
    >
      <!-- Grid dan sumbu -->
      <g class="stroke-ink-100">
        <line v-for="v in tickV" :key="`gv${v}`" :x1="x(v)" :x2="x(v)" :y1="pad.atas" :y2="pad.atas + tinggi" />
        <line v-for="p in tickP" :key="`gp${p}`" :x1="pad.kiri" :x2="pad.kiri + lebar" :y1="y(p)" :y2="y(p)" />
      </g>
      <line :x1="pad.kiri" :y1="pad.atas + tinggi" :x2="pad.kiri + lebar" :y2="pad.atas + tinggi" class="stroke-ink-400" />
      <line :x1="pad.kiri" :y1="pad.atas" :x2="pad.kiri" :y2="pad.atas + tinggi" class="stroke-ink-400" />
      <g class="fill-ink-500 text-[9px]">
        <text v-for="v in tickV" :key="`tv${v}`" :x="x(v)" :y="pad.atas + tinggi + 12" text-anchor="middle">{{ formatDesimal(v, 0) }}</text>
        <text v-for="p in tickP" :key="`tp${p}`" :x="pad.kiri - 4" :y="y(p) + 3" text-anchor="end">{{ fP(p) }}</text>
      </g>
      <text :x="pad.kiri + lebar / 2" :y="H - 4" text-anchor="middle" class="fill-ink-700 text-[10px]">V ({{ s.satuanV }})</text>
      <text
        :x="10"
        :y="pad.atas + tinggi / 2"
        text-anchor="middle"
        :transform="`rotate(-90 10 ${pad.atas + tinggi / 2})`"
        class="fill-ink-700 text-[10px]"
      >
        p ({{ s.satuanP }})
      </text>

      <!-- Kotak batas rancangan -->
      <rect
        v-if="blok.batas"
        :x="x(blok.batas.VMin)"
        :y="y(blok.batas.pMax)"
        :width="x(blok.batas.VMax) - x(blok.batas.VMin)"
        :height="y(blok.batas.pMin) - y(blok.batas.pMax)"
        class="fill-accent-2/10 stroke-periksa"
        stroke-dasharray="4 3"
      />

      <!-- Mode jelajah -->
      <template v-if="blok.mode === 'jelajah'">
        <path v-if="blok.tampilkanLuas" :d="dLuasBawah(lintasanJelajah)" class="fill-accent-1/15" />
        <path :d="d(lintasanJelajah)" fill="none" :class="warnaProses[prosesJelajah]" stroke-width="2.5" />
        <circle :cx="x(keadaanAwal.V)" :cy="y(keadaanAwal.p)" r="5" class="fill-ink-800" />
        <circle :cx="x(akhirJelajah.V)" :cy="y(akhirJelajah.p)" r="7" class="fill-white stroke-accent-1" stroke-width="3" />
      </template>

      <!-- Mode rancang -->
      <template v-else>
        <path v-if="blok.tampilkanLuas && dSiklus" :d="dSiklus" class="fill-accent-1/15" />
        <path
          v-for="(s1, i) in sisiAktif"
          :key="i"
          :d="d(sampelLintasan(s1.proses, s1.dari, s1.ke))"
          fill="none"
          :class="warnaProses[s1.proses]"
          stroke-width="2.5"
        />
        <path
          v-if="lintasanPratinjau.length"
          :d="d(lintasanPratinjau)"
          fill="none"
          :class="warnaProses[prosesRancang]"
          stroke-width="2"
          stroke-dasharray="4 3"
          opacity="0.7"
        />
        <circle
          v-for="(t, i) in alt.titik"
          :key="`t${i}`"
          :cx="x(t.V)"
          :cy="y(t.p)"
          :r="i === 0 ? 6 : 4"
          :class="i === 0 ? 'fill-white stroke-ink-800' : 'fill-ink-800'"
          :stroke-width="i === 0 ? 2.5 : 0"
        />
        <circle v-if="pratinjau" :cx="x(pratinjau.V)" :cy="y(pratinjau.p)" r="4" class="fill-ink-400" />
      </template>
    </svg>

    <!-- Kontrol & hasil jelajah -->
    <template v-if="blok.mode === 'jelajah'">
      <label class="flex flex-col gap-1 text-sm">
        <span class="flex justify-between text-ink-600">
          <span>{{ bebasP(prosesJelajah) ? "Tekanan akhir" : "Volume akhir" }}</span>
          <span class="font-medium text-ink-800">
            {{ bebasP(prosesJelajah) ? `${fP(akhirJelajah.p)} ${s.satuanP}` : `${fV(akhirJelajah.V)} ${s.satuanV}` }}
          </span>
        </span>
        <input
          v-model.number="nilaiBebas[prosesJelajah]"
          type="range"
          :min="rentangJelajah[0]"
          :max="rentangJelajah[1]"
          :step="bebasP(prosesJelajah) ? langkahP : langkahV"
        />
      </label>
      <dl class="grid grid-cols-3 gap-2 text-center text-sm">
        <div class="rounded-lg bg-ink-50 p-2">
          <dt class="text-xs text-ink-500">Keadaan awal</dt>
          <dd class="font-medium text-ink-800">{{ fP(keadaanAwal.p) }} {{ s.satuanP }}; {{ fV(keadaanAwal.V) }} {{ s.satuanV }}</dd>
        </div>
        <div class="rounded-lg bg-ink-50 p-2">
          <dt class="text-xs text-ink-500">Keadaan akhir</dt>
          <dd class="font-medium text-ink-800">{{ fP(akhirJelajah.p) }} {{ s.satuanP }}; {{ fV(akhirJelajah.V) }} {{ s.satuanV }}</dd>
        </div>
        <div class="rounded-lg bg-accent-1/10 p-2">
          <dt class="text-xs text-accent-1">Usaha gas (W)</dt>
          <dd class="font-semibold text-accent-1">{{ formatDesimal(usahaJelajah, 1) }} {{ satuanW }}</dd>
        </div>
      </dl>
      <p class="text-xs text-ink-500">
        Seret titik akhir pada diagram atau gunakan penggeser. Daerah biru adalah luas di bawah lintasan, yang
        nilainya sama dengan usaha gas. Usaha negatif berarti gas dimampatkan.
      </p>
    </template>

    <!-- Kontrol & hasil rancang -->
    <template v-else>
      <div class="flex flex-wrap gap-2">
        <button
          type="button"
          class="rounded-lg bg-brand px-3 py-1.5 text-sm font-semibold text-brand-dark disabled:opacity-40"
          :disabled="alt.tertutup || alt.titik.length < 2"
          @click="tutupSiklus"
        >
          Tutup siklus
        </button>
        <button
          type="button"
          class="rounded-lg border border-ink-300 px-3 py-1.5 text-sm text-ink-700 disabled:opacity-40"
          :disabled="!alt.titik.length"
          @click="urungkan"
        >
          Urungkan
        </button>
        <button
          type="button"
          class="rounded-lg border border-ink-300 px-3 py-1.5 text-sm text-ink-700 disabled:opacity-40"
          :disabled="!alt.titik.length"
          @click="hapus"
        >
          Hapus alternatif
        </button>
      </div>
      <p v-if="pesan" class="rounded-lg bg-periksa/10 p-2 text-sm text-periksa">{{ pesan }}</p>
      <p v-else-if="!alt.titik.length" class="text-sm text-ink-500">Klik di dalam kotak bergaris untuk menaruh titik awal siklus.</p>

      <ol v-if="sisiAktif.length" class="flex flex-col gap-1 text-sm text-ink-700">
        <li v-for="(s1, i) in sisiAktif" :key="i" class="flex flex-wrap justify-between gap-2 border-b border-ink-100 pb-1">
          <span>
            <span class="font-medium">{{ i + 1 }}. {{ labelProses[s1.proses] }}</span>
            <span class="text-ink-500"> ({{ fP(s1.dari.p) }}; {{ fV(s1.dari.V) }}) → ({{ fP(s1.ke.p) }}; {{ fV(s1.ke.V) }})</span>
          </span>
          <span>W = {{ formatDesimal(usahaProses(s1.proses, s1.dari, s1.ke), 1) }} {{ satuanW }}</span>
        </li>
      </ol>

      <div v-if="alt.tertutup" class="rounded-lg bg-accent-1/10 p-3 text-sm text-accent-1">
        <p class="font-semibold">
          Usaha bersih siklus = luas siklus = {{ formatDesimal(Math.abs(usahaBersih(alt)), 1) }} {{ satuanW }}
        </p>
        <p class="mt-0.5 text-ink-700">
          {{
            usahaBersih(alt) > 0
              ? "Siklus searah jarum jam: gas menghasilkan usaha (seperti mesin kalor)."
              : usahaBersih(alt) < 0
                ? "Siklus berlawanan arah jarum jam: gas menerima usaha (seperti mesin pendingin)."
                : "Luas siklus nol."
          }}
        </p>
      </div>

      <table v-if="alternatif.some((a) => a.tertutup)" class="w-full border-collapse text-left text-sm">
        <thead>
          <tr class="border-b border-ink-200">
            <th class="py-1.5 pr-2 font-semibold text-ink-800">Alternatif</th>
            <th class="py-1.5 pr-2 font-semibold text-ink-800">Jumlah sisi</th>
            <th class="py-1.5 font-semibold text-ink-800">Usaha bersih ({{ satuanW }})</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(a, i) in alternatif" :key="i" class="border-b border-ink-100">
            <td class="py-1.5 pr-2">{{ i + 1 }}</td>
            <td class="py-1.5 pr-2">{{ a.tertutup ? a.proses.length : "–" }}</td>
            <td class="py-1.5">{{ a.tertutup ? formatDesimal(usahaBersih(a), 1) : "belum tertutup" }}</td>
          </tr>
        </tbody>
      </table>
    </template>
  </div>
</template>
