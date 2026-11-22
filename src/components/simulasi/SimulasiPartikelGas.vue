<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { GAMMA_MONOATOMIK, VOLUME_MIN_SAH, skalaKecepatan, suhuAdiabatik } from "@/lib/termodinamika";

interface Partikel {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

type JagaTetap = "tidak-ada" | "volume" | "suhu" | "tekanan";

const LEBAR = 320;
const TINGGI = 150;
const JARI = 4;
const JUMLAH_PARTIKEL_MIN = 10;
const JUMLAH_PARTIKEL_MAX = 200;
const SUHU_MIN = 50;
const SUHU_MAX = 10000;
const FAKTOR_KECEPATAN = 0.08;
const JENDELA_RATA_RATA_DETIK = 2; // meredam noise pembacaan tumbukan/detik

// Dinding kiri dapat digeser seperti pada PhET Gas Properties; dinding kanan tetap.
const LEBAR_M_MAX = 15;
const LEBAR_M_MIN = 5;
const LEBAR_M_AWAL = 10;
const RUANG_PEGANGAN = 28; // px di kiri kanvas yang selalu disisakan untuk tuas, juga saat wadah paling lebar
const PX_PER_M = (LEBAR - RUANG_PEGANGAN - 2 * JARI) / LEBAR_M_MAX;
const KECEPATAN_DINDING_MAX = 1.5; // px per frame, agar tumbukan dengan dinding tetap stabil
// Area yang bisa diseret: tuas di kiri dinding (sampai 22 px) ditambah sedikit di kanan dinding.
const JANGKAUAN_KIRI = 26;
const JANGKAUAN_KANAN = 8;

// Tekanan 2D = gaya per panjang dinding. Konstanta ini hanya mengubah skala ke "kPa" ilustratif.
const SKALA_TEKANAN = 50000;
const TEKANAN_MAX_GAUGE = 1000;

const canvasRef = ref<HTMLCanvasElement | null>(null);
const jumlahPartikel = ref(60);
const suhu = ref(300);
const suhuMasukan = ref("300");
const suhuDiketik = ref(false);
const berjalan = ref(true);
const tumbukanPerDetik = ref(0);
const tekanan = ref(0);
const jagaTetap = ref<JagaTetap>("tidak-ada");
const peringatan = ref("");

/** Posisi dinding kiri (px kanvas) dan posisi yang dituju saat diseret/diatur. */
const posisiDinding = ref(xDariMeter(LEBAR_M_AWAL));
const targetDinding = ref(posisiDinding.value);
const sedangMenyeret = ref(false);

function dekatDinding(x: number): boolean {
  const d = x - posisiDinding.value;
  return d >= -JANGKAUAN_KIRI && d <= JANGKAUAN_KANAN;
}

const dekatPegangan = ref(false);

/**
 * Lebar yang ditampilkan adalah ruang yang dapat dijangkau pusat partikel (lebar dalam − diameter partikel),
 * sehingga tekanan berbanding terbalik tepat dengan lebar yang dibaca murid (p × V konstan).
 */
function meterDariX(xDinding: number): number {
  return (LEBAR - xDinding - 2 * JARI) / PX_PER_M;
}

function xDariMeter(m: number): number {
  return LEBAR - 2 * JARI - m * PX_PER_M;
}

let ctx: CanvasRenderingContext2D | null = null;
let partikel: Partikel[] = [];
let rafId = 0;
let tumbukanAkumulasi = 0;
let impulsAkumulasi = 0;
let frameAkumulasi = 0;
let kelilingAkumulasi = 0;
let waktuHitungTerakhir = 0;
let riwayatTumbukan: number[] = [];
let riwayatTekanan: number[] = [];
let suhuTarget = 300;
let tekananTarget = 0;

const lebarMeter = computed(() => meterDariX(posisiDinding.value));
const targetLebarMeter = computed({
  get: () => meterDariX(targetDinding.value),
  set: (m: number) => aturTargetLebar(m),
});
const dindingTerkunci = computed(() => jagaTetap.value === "volume" || jagaTetap.value === "tekanan");

function aturTargetLebar(m: number) {
  const n = Math.min(LEBAR_M_MAX, Math.max(LEBAR_M_MIN, m));
  targetDinding.value = xDariMeter(n);
}

/** Menerapkan suhu dari isian: kelajuan semua partikel diskalakan ke suhu baru. */
function terapkanSuhu() {
  suhuDiketik.value = false;
  const T = Number(String(suhuMasukan.value).replace(",", "."));
  if (!Number.isFinite(T) || String(suhuMasukan.value).trim() === "") {
    suhuMasukan.value = String(Math.round(suhu.value));
    return;
  }
  const Tbaru = Math.min(SUHU_MAX, Math.max(SUHU_MIN, T));
  skalakanSuhu(Tbaru);
  suhu.value = Tbaru;
  if (jagaTetap.value === "suhu") suhuTarget = Tbaru;
  suhuMasukan.value = String(Math.round(Tbaru));
}

function formatMeter(m: number): string {
  return `${m.toFixed(1).replace(".", ",")} m`;
}

function kecepatanDariSuhu(T: number): number {
  return FAKTOR_KECEPATAN * Math.sqrt(T);
}

/** Suhu dibaca dari energi kinetik rata-rata partikel. */
function suhuDariPartikel(): number {
  if (!partikel.length) return suhu.value;
  const rataV2 = partikel.reduce((s, p) => s + p.vx * p.vx + p.vy * p.vy, 0) / partikel.length;
  return rataV2 / (FAKTOR_KECEPATAN * FAKTOR_KECEPATAN);
}

function skalakanSuhu(suhuBaru: number) {
  const rasio = skalaKecepatan(suhuDariPartikel(), suhuBaru);
  if (rasio === 1) return;
  for (const p of partikel) {
    p.vx *= rasio;
    p.vy *= rasio;
  }
}

/** Tekanan menurut keadaan gas (P·A = N·kT) — dipakai untuk mode "jaga tekanan tetap". */
// Pusat partikel hanya dapat menjangkau (lebar − 2r) × (tinggi − 2r); ukuran efektif ini dipakai untuk tekanan.
function tekananTeoritis(lebarPx: number): number {
  const rataV2 = partikel.length ? FAKTOR_KECEPATAN * FAKTOR_KECEPATAN * suhuDariPartikel() : 0;
  return (SKALA_TEKANAN * partikel.length * rataV2) / (2 * (lebarPx - 2 * JARI) * (TINGGI - 2 * JARI));
}

function buatPartikel(): Partikel {
  const sudut = Math.random() * Math.PI * 2;
  const v = kecepatanDariSuhu(suhu.value);
  const kiri = posisiDinding.value + JARI;
  return {
    x: kiri + Math.random() * (LEBAR - JARI - kiri),
    y: JARI + Math.random() * (TINGGI - 2 * JARI),
    vx: Math.cos(sudut) * v,
    vy: Math.sin(sudut) * v,
  };
}

function resetPengukuran() {
  tumbukanAkumulasi = 0;
  impulsAkumulasi = 0;
  frameAkumulasi = 0;
  kelilingAkumulasi = 0;
  tumbukanPerDetik.value = 0;
  tekanan.value = 0;
  riwayatTumbukan = [];
  riwayatTekanan = [];
}

function sebarPartikel() {
  partikel = Array.from({ length: jumlahPartikel.value }, buatPartikel);
  resetPengukuran();
}

function ulangi() {
  jagaTetap.value = "tidak-ada";
  peringatan.value = "";
  jumlahPartikel.value = JUMLAH_PARTIKEL_MIN;
  suhu.value = SUHU_MIN;
  suhuMasukan.value = String(SUHU_MIN);
  posisiDinding.value = targetDinding.value = xDariMeter(LEBAR_M_AWAL);
  sebarPartikel();
}

const KECEPATAN_MIN = kecepatanDariSuhu(SUHU_MIN);
const KECEPATAN_MAX = kecepatanDariSuhu(SUHU_MAX);

function warnaDariKecepatan(v: number): string {
  const t = Math.min(1, Math.max(0, (v - KECEPATAN_MIN) / (KECEPATAN_MAX - KECEPATAN_MIN)));
  const hue = 210 - 210 * t;
  return `hsl(${hue}, 80%, 50%)`;
}

function gambar() {
  if (!ctx) return;
  const xd = posisiDinding.value;
  ctx.clearRect(0, 0, LEBAR, TINGGI);

  // Ruang di luar wadah
  ctx.fillStyle = "#C6D3D5";
  ctx.fillRect(0, 0, xd, TINGGI);
  ctx.fillStyle = "#EDF6F9";
  ctx.fillRect(xd, 0, LEBAR - xd, TINGGI);
  ctx.strokeStyle = "#A8B6B7";
  ctx.lineWidth = 2;
  ctx.strokeRect(xd + 1, 1, LEBAR - xd - 2, TINGGI - 2);

  for (const p of partikel) {
    const v = Math.hypot(p.vx, p.vy);
    ctx.beginPath();
    ctx.fillStyle = warnaDariKecepatan(v);
    ctx.arc(p.x, p.y, JARI, 0, Math.PI * 2);
    ctx.fill();
  }

  // Dinding kiri dan tuasnya (selalu muat karena RUANG_PEGANGAN)
  const aktif = sedangMenyeret.value || (dekatPegangan.value && !dindingTerkunci.value);
  const warnaDinding = dindingTerkunci.value ? "#859491" : aktif ? "#2E6E6A" : "#404944";
  ctx.fillStyle = warnaDinding;
  ctx.fillRect(xd - 2, 0, 4, TINGGI);
  if (!dindingTerkunci.value) {
    const hy = TINGGI / 2;
    // Batang penghubung
    ctx.fillRect(xd - 12, hy - 1.5, 10, 3);
    // Gagang
    ctx.beginPath();
    ctx.roundRect(xd - 22, hy - 14, 10, 28, 4);
    ctx.fill();
    // Alur pegangan
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const dy of [-6, 0, 6]) {
      ctx.moveTo(xd - 19.5, hy + dy);
      ctx.lineTo(xd - 14.5, hy + dy);
    }
    ctx.stroke();
  }
}

/**
 * Kerja adiabatik saat volume diubah: suhu baru dihitung makroskopis, T₂ = T₁ (V₁/V₂)^(γ−1),
 * lalu kecepatan semua partikel diskalakan √(T₂/T₁). Volume sebanding dengan lebar efektif
 * (tinggi dan kedalaman tetap), jadi rasio lebar = rasio volume.
 *
 * Cara ini menggantikan pertukaran energi per tumbukan dengan dinding bergerak. Cara lama tidak simetris:
 * saat dimampatkan semua partikel menumbuk dinding dan bertambah energinya, tetapi saat diregangkan dinding
 * bergerak lebih cepat daripada banyak partikel sehingga energi yang hilang lebih sedikit (numerical heating).
 */
function prosesAdiabatik(xDindingLama: number, xDindingBaru: number) {
  if (xDindingLama === xDindingBaru) return;
  const volumeLama = meterDariX(xDindingLama);
  const volumeBaru = meterDariX(xDindingBaru);
  if (volumeLama < VOLUME_MIN_SAH || volumeBaru < VOLUME_MIN_SAH) return;
  const suhuLama = suhuDariPartikel();
  const suhuBaru = suhuAdiabatik(suhuLama, volumeLama, volumeBaru, GAMMA_MONOATOMIK);
  const skala = skalaKecepatan(suhuLama, suhuBaru);
  for (const p of partikel) {
    p.vx *= skala;
    p.vy *= skala;
  }
}

/** Menggerakkan dinding kiri menuju targetnya dengan kelajuan terbatas. */
function gerakkanDinding() {
  if (jagaTetap.value === "tekanan" && tekananTarget > 0) {
    // Seperti "Pressure ↕V" di PhET: lebar wadah dihitung dari hukum gas agar tekanan tetap.
    const rataV2 = FAKTOR_KECEPATAN * FAKTOR_KECEPATAN * suhuDariPartikel();
    const lebarPx =
      (SKALA_TEKANAN * partikel.length * rataV2) / (2 * (TINGGI - 2 * JARI) * tekananTarget) + 2 * JARI;
    const lebarMeterPerlu = meterDariX(LEBAR - lebarPx);
    if (lebarMeterPerlu > LEBAR_M_MAX || lebarMeterPerlu < LEBAR_M_MIN) {
      peringatan.value =
        lebarMeterPerlu > LEBAR_M_MAX
          ? "Wadah sudah selebar mungkin, tekanan tidak dapat dijaga tetap. Pilihan jaga tetap diubah ke \"Tidak ada\"."
          : "Wadah sudah sesempit mungkin, tekanan tidak dapat dijaga tetap. Pilihan jaga tetap diubah ke \"Tidak ada\".";
      jagaTetap.value = "tidak-ada";
    }
    aturTargetLebar(lebarMeterPerlu);
  }

  const selisih = targetDinding.value - posisiDinding.value;
  const langkahDinding = Math.max(-KECEPATAN_DINDING_MAX, Math.min(KECEPATAN_DINDING_MAX, selisih));
  posisiDinding.value += langkahDinding;
}

function langkah(waktu: number) {
  rafId = requestAnimationFrame(langkah);

  if (berjalan.value) {
    const xdLama = posisiDinding.value;
    gerakkanDinding();
    const xd = posisiDinding.value;
    // Dinding yang digeser tangan melakukan kerja pada gas (memampatkan = memanaskan, meregangkan = mendinginkan).
    // Saat lebar diatur otomatis oleh mode "jaga tekanan tetap", dinding tidak melakukan kerja (seperti PhET).
    if (jagaTetap.value !== "tekanan") prosesAdiabatik(xdLama, xd);

    for (const p of partikel) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x - JARI < xd) {
        p.x = xd + JARI;
        // Pantulan lenting pada dinding diam: laju tidak berubah. Kerja dinding sudah ditangani prosesAdiabatik.
        if (p.vx < 0) {
          impulsAkumulasi += 2 * Math.abs(p.vx);
          p.vx *= -1;
          tumbukanAkumulasi++;
        }
      } else if (p.x + JARI > LEBAR) {
        p.x = LEBAR - JARI;
        impulsAkumulasi += 2 * Math.abs(p.vx);
        p.vx *= -1;
        tumbukanAkumulasi++;
      }

      if (p.y - JARI < 0) {
        p.y = JARI;
        impulsAkumulasi += 2 * Math.abs(p.vy);
        p.vy *= -1;
        tumbukanAkumulasi++;
      } else if (p.y + JARI > TINGGI) {
        p.y = TINGGI - JARI;
        impulsAkumulasi += 2 * Math.abs(p.vy);
        p.vy *= -1;
        tumbukanAkumulasi++;
      }
    }

    // Termostat untuk mode "jaga suhu tetap"; selain itu suhu hanya dibatasi pada rentang simulasi.
    const suhuSekarang = suhuDariPartikel();
    if (jagaTetap.value === "suhu") skalakanSuhu(suhuTarget);
    else if (suhuSekarang > SUHU_MAX) skalakanSuhu(SUHU_MAX);
    else if (suhuSekarang < SUHU_MIN) skalakanSuhu(SUHU_MIN);
    suhu.value = suhuDariPartikel();

    frameAkumulasi++;
    kelilingAkumulasi += 2 * (LEBAR - xd - 2 * JARI) + 2 * (TINGGI - 2 * JARI);
  }

  if (waktu - waktuHitungTerakhir >= 1000) {
    riwayatTumbukan.push(tumbukanAkumulasi);
    if (riwayatTumbukan.length > JENDELA_RATA_RATA_DETIK) riwayatTumbukan.shift();
    tumbukanPerDetik.value = Math.round(riwayatTumbukan.reduce((a, b) => a + b, 0) / riwayatTumbukan.length);

    if (frameAkumulasi > 0) {
      // Impuls per satuan panjang dinding per frame = tekanan (2D).
      const kelilingRata = kelilingAkumulasi / frameAkumulasi;
      riwayatTekanan.push((SKALA_TEKANAN * impulsAkumulasi) / (kelilingRata * frameAkumulasi));
      if (riwayatTekanan.length > JENDELA_RATA_RATA_DETIK) riwayatTekanan.shift();
      tekanan.value = Math.round(riwayatTekanan.reduce((a, b) => a + b, 0) / riwayatTekanan.length);
    }

    tumbukanAkumulasi = 0;
    impulsAkumulasi = 0;
    frameAkumulasi = 0;
    kelilingAkumulasi = 0;
    waktuHitungTerakhir = waktu;
  }

  gambar();
}

let pengamatUkuran: ResizeObserver | undefined;

/**
 * Menyamakan resolusi kanvas dengan ukuran tampil × devicePixelRatio agar tajam di layar HD.
 * Semua penggambaran tetap memakai koordinat logis LEBAR × TINGGI melalui transformasi skala.
 */
function aturResolusiKanvas() {
  const kanvas = canvasRef.value;
  if (!kanvas || !ctx) return;
  const r = kanvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const w = Math.max(1, Math.round(r.width * dpr));
  const h = Math.max(1, Math.round(r.height * dpr));
  if (kanvas.width !== w || kanvas.height !== h) {
    kanvas.width = w;
    kanvas.height = h;
  }
  ctx.setTransform(w / LEBAR, 0, 0, h / TINGGI, 0, 0);
  ctx.imageSmoothingQuality = "high";
  gambar();
}

function xKanvas(e: PointerEvent): number {
  const r = canvasRef.value!.getBoundingClientRect();
  return ((e.clientX - r.left) / r.width) * LEBAR;
}

function tekanKanvas(e: PointerEvent) {
  if (dindingTerkunci.value) return;
  if (!dekatDinding(xKanvas(e))) return;
  sedangMenyeret.value = true;
  canvasRef.value!.setPointerCapture(e.pointerId);
  e.preventDefault();
}

function geserKanvas(e: PointerEvent) {
  const x = xKanvas(e);
  dekatPegangan.value = dekatDinding(x);
  if (sedangMenyeret.value) aturTargetLebar(meterDariX(x));
}

function lepasKanvas() {
  sedangMenyeret.value = false;
}

const fraksiTekanan = computed(() => Math.min(1, tekanan.value / TEKANAN_MAX_GAUGE));
const sudutJarum = computed(() => -90 + fraksiTekanan.value * 180);
const warnaJarum = computed(() => {
  if (fraksiTekanan.value < 0.33) return "var(--color-benar)";
  if (fraksiTekanan.value < 0.66) return "var(--color-periksa)";
  return "var(--color-salah)";
});

const pilihanJagaTetap: { nilai: JagaTetap; label: string }[] = [
  { nilai: "tidak-ada", label: "Tidak ada" },
  { nilai: "volume", label: "Volume" },
  { nilai: "suhu", label: "Suhu" },
  { nilai: "tekanan", label: "Tekanan (V berubah)" },
];

watch(jagaTetap, (mode) => {
  if (mode !== "tidak-ada") peringatan.value = "";
  if (mode === "volume") targetDinding.value = posisiDinding.value;
  if (mode === "suhu") suhuTarget = suhuDariPartikel();
  if (mode === "tekanan") tekananTarget = tekananTeoritis(LEBAR - posisiDinding.value);
});

// Isian suhu mengikuti suhu gas (mis. saat dimampatkan), kecuali sedang diketik murid.
watch(suhu, (T) => {
  if (!suhuDiketik.value) suhuMasukan.value = String(Math.round(T));
});

watch(jumlahPartikel, (baru) => {
  const selisih = baru - partikel.length;
  if (selisih > 0) {
    for (let i = 0; i < selisih; i++) partikel.push(buatPartikel());
  } else if (selisih < 0) {
    partikel.length = baru;
  }
});

onMounted(() => {
  ctx = canvasRef.value!.getContext("2d");
  aturResolusiKanvas();
  pengamatUkuran = new ResizeObserver(aturResolusiKanvas);
  pengamatUkuran.observe(canvasRef.value!);
  window.addEventListener("resize", aturResolusiKanvas);
  sebarPartikel();
  rafId = requestAnimationFrame(langkah);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId);
  pengamatUkuran?.disconnect();
  window.removeEventListener("resize", aturResolusiKanvas);
});
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-col gap-2 sm:flex-row">
      <canvas
        ref="canvasRef"
        :style="{ aspectRatio: `${LEBAR} / ${TINGGI}`, touchAction: 'pan-y' }"
        class="min-w-0 flex-1 rounded-xl border border-ink-200"
        :class="!dindingTerkunci && (dekatPegangan || sedangMenyeret) ? 'cursor-ew-resize' : ''"
        aria-label="Wadah gas. Seret dinding kiri untuk mengubah lebar wadah."
        @pointerdown="tekanKanvas"
        @pointermove="geserKanvas"
        @pointerup="lepasKanvas"
        @pointercancel="lepasKanvas"
        @pointerleave="dekatPegangan = false"
      ></canvas>

      <div
        class="flex w-full shrink-0 flex-col items-center justify-center gap-0.5 self-center rounded-xl border border-ink-200 bg-white p-2 sm:w-28 sm:self-auto sm:p-1.5"
      >
        <svg viewBox="0 0 200 120" class="w-24 sm:w-full">
          <path d="M10,100 A90,90 0 0 1 190,100" fill="none" stroke="#C6D3D5" stroke-width="16" stroke-linecap="round" />
          <g :style="{ transform: `rotate(${sudutJarum}deg)`, transformOrigin: '100px 100px' }">
            <line x1="100" y1="100" x2="100" y2="26" :stroke="warnaJarum" stroke-width="6" stroke-linecap="round" />
          </g>
          <circle cx="100" cy="100" r="8" :fill="warnaJarum" />
        </svg>
        <span class="-mt-2 text-xs font-semibold" :style="{ color: warnaJarum }">{{ tekanan }} kPa</span>
        <span class="text-[10px] text-ink-500">Tekanan</span>

        <div class="mt-1.5 flex w-full max-w-40 flex-col gap-1.5 border-t border-ink-100 pt-1.5 text-center sm:max-w-none">
          <label class="flex flex-col items-center gap-0.5">
            <span class="flex items-center gap-1">
              <input
                v-model="suhuMasukan"
                type="number"
                inputmode="decimal"
                :min="SUHU_MIN"
                :max="SUHU_MAX"
                step="10"
                aria-label="Suhu gas dalam kelvin"
                class="w-16 rounded-md border border-ink-200 px-1.5 py-1 text-center text-xs font-semibold text-ink-800 outline-none focus:border-accent"
                @focus="suhuDiketik = true"
                @blur="terapkanSuhu"
                @keydown.enter="($event.target as HTMLInputElement).blur()"
              />
              <span class="text-xs font-semibold text-ink-800">K</span>
            </span>
            <span class="text-[10px] text-ink-500">Suhu ({{ SUHU_MIN }}–{{ SUHU_MAX }} K)</span>
          </label>
          <div>
            <span class="block text-xs font-semibold text-ink-800">{{ formatMeter(lebarMeter) }}</span>
            <span class="text-[10px] text-ink-500">Lebar (V)</span>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col gap-3 rounded-xl border border-ink-200 p-3 text-sm">
      <label class="flex flex-col gap-1">
        <span class="flex justify-between text-ink-600">
          <span>Jumlah partikel</span>
          <span class="font-medium text-ink-800">{{ jumlahPartikel }}</span>
        </span>
        <input
          v-model.number="jumlahPartikel"
          type="range"
          :min="JUMLAH_PARTIKEL_MIN"
          :max="JUMLAH_PARTIKEL_MAX"
          step="5"
        />
      </label>

      <label class="flex flex-col gap-1">
        <span class="flex justify-between text-ink-600">
          <span>Lebar wadah (mewakili volume)</span>
          <span class="font-medium text-ink-800">{{ formatMeter(targetLebarMeter) }}</span>
        </span>
        <input
          v-model.number="targetLebarMeter"
          type="range"
          :min="LEBAR_M_MIN"
          :max="LEBAR_M_MAX"
          step="0.1"
          :disabled="dindingTerkunci"
          class="disabled:opacity-40"
        />
        <span class="text-xs text-ink-500">
          Bisa juga dengan menyeret pegangan di dinding kiri wadah. Memampatkan gas memanaskannya, meregangkan
          wadah mendinginkannya.
        </span>
      </label>

      <fieldset class="flex flex-col gap-1.5">
        <legend class="mb-1 text-ink-600">Jaga tetap</legend>
        <div class="grid grid-cols-2 gap-1.5">
          <label
            v-for="p in pilihanJagaTetap"
            :key="p.nilai"
            class="flex cursor-pointer items-center gap-1.5 rounded-lg border px-2 py-1.5 text-xs transition-colors"
            :class="jagaTetap === p.nilai ? 'border-accent-1 bg-accent-1/10 text-accent-1' : 'border-ink-200 text-ink-700'"
          >
            <input v-model="jagaTetap" type="radio" :value="p.nilai" class="accent-accent-1" />
            {{ p.label }}
          </label>
        </div>
        <p v-if="peringatan" class="rounded-lg bg-periksa/10 p-2 text-xs text-periksa">{{ peringatan }}</p>
      </fieldset>

      <div class="flex items-center justify-between text-xs text-ink-500">
        <span>Tumbukan dinding (dasar tekanan)</span>
        <span class="font-medium text-ink-600">{{ tumbukanPerDetik }} /detik</span>
      </div>

      <div class="flex gap-2">
        <button
          type="button"
          class="flex-1 rounded-lg bg-accent px-3 py-2 font-medium text-white bg-accent-1"
          @click="berjalan = !berjalan"
        >
          {{ berjalan ? "Jeda" : "Lanjutkan" }}
        </button>
        <button
          type="button"
          class="flex-1 rounded-lg border border-ink-300 px-3 py-2 font-medium text-ink-700"
          @click="ulangi"
        >
          Ulangi
        </button>
      </div>
    </div>

    <p class="text-xs text-ink-500">
      Jarum tekanan mengikuti impuls tumbukan molekul per satuan panjang dinding; warna partikel menunjukkan kelajuan
      relatif (biru = lambat, merah = cepat). Lebar wadah mewakili volume karena tinggi dan kedalamannya tetap. Nilai
      suhu, tekanan, dan kelajuan bersifat ilustratif, bukan skala fisis sebenarnya.
    </p>
  </div>
</template>
