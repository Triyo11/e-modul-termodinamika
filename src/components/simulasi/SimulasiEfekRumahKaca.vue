<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

// Meniru PhET Greenhouse Effect (tampilan foton). Suhu dihitung dengan model atmosfer satu lapis:
//   C_s dT_s/dt = S + ε σ T_a⁴ − σ T_s⁴        (permukaan)
//   C_a dT_a/dt = ε σ T_s⁴ − 2 ε σ T_a⁴        (atmosfer)
// ε = bagian radiasi inframerah permukaan yang diserap gas rumah kaca. Foton hanya visualisasi
// yang laju dan peluang serapnya mengikuti model ini.

interface Foton {
  x: number;
  y: number;
  vx: number;
  vy: number;
  inframerah: boolean;
  target: Molekul | null;
  tahan: number;
}

interface Molekul {
  x: number;
  y: number;
  vx: number;
  vy: number;
  sudut: number;
  getar: number;
}

const LEBAR = 320;
const TINGGI = 250;
const Y_BATAS = 34; // batas atas atmosfer
const Y_TANAH = 206;
const Y_MOLEKUL_MIN = 52;
const Y_MOLEKUL_MAX = 192;

const SIGMA = 5.67e-8;
const SINAR_SERAP = 240; // W/m², sinar Matahari yang diserap rata-rata
const KAPASITAS_PERMUKAAN = 20; // dipercepat agar kesetimbangan tercapai dalam ±30 detik
const KAPASITAS_ATMOSFER = 8;
const SUHU_AWAL = 255;

const KELAJUAN_FOTON = 90; // px/s
const LAJU_FOTON_MATAHARI = 7; // foton/s
const FOTON_MAKS = 400;
const MOLEKUL_MAKS = 30;
const DURASI_TAHAN = 0.25;

const PANJANG_GRAFIK_DETIK = 120;

/** Titik kendali: tingkat konsentrasi (0–100) → ε. Disetel agar suhu setimbang mendekati nilai nyata. */
const KURVA_EPSILON: [number, number][] = [
  [0, 0],
  [35, 0.663],
  [50, 0.754],
  [55, 0.76],
  [65, 0.774],
  [100, 0.95],
];

const PRESET = [
  { label: "Zaman es", tingkat: 35, co2: "≈ 180 ppm" },
  { label: "1750", tingkat: 50, co2: "≈ 280 ppm" },
  { label: "1950", tingkat: 55, co2: "≈ 310 ppm" },
  { label: "Masa kini", tingkat: 65, co2: "≈ 415 ppm" },
];

const canvasRef = ref<HTMLCanvasElement | null>(null);
const versi = ref(0);
const tingkat = ref(65);
const sinarMenyala = ref(false);
const berjalan = ref(true);
const cepat = ref(false);

let ctx: CanvasRenderingContext2D | null = null;
let suhuPermukaan = SUHU_AWAL;
let suhuAtmosfer = SUHU_AWAL / Math.SQRT2 ** 0.5;
let foton: Foton[] = [];
let molekul: Molekul[] = [];
let sisaMatahari = 0;
let sisaInframerah = 0;
let riwayat: number[] = [];
let waktuSampel = 0;
let rafId = 0;
let waktuTerakhir = 0;
let terlihat = true;
let pengamatUkuran: ResizeObserver | undefined;
let pengamatTampil: IntersectionObserver | undefined;

function epsilon(t: number): number {
  for (let i = 1; i < KURVA_EPSILON.length; i++) {
    const [x0, y0] = KURVA_EPSILON[i - 1];
    const [x1, y1] = KURVA_EPSILON[i];
    if (t <= x1) return y0 + ((y1 - y0) * (t - x0)) / (x1 - x0);
  }
  return KURVA_EPSILON[KURVA_EPSILON.length - 1][1];
}

const eps = computed(() => epsilon(tingkat.value));

// ---------- Model energi ----------

function langkahModel(dt: number) {
  const e = eps.value;
  const fs = SIGMA * suhuPermukaan ** 4;
  const fa = SIGMA * suhuAtmosfer ** 4;
  suhuPermukaan += ((SINAR_SERAP + e * fa - fs) * dt) / KAPASITAS_PERMUKAAN;
  suhuAtmosfer += ((e * fs - 2 * e * fa) * dt) / KAPASITAS_ATMOSFER;
}

const energiKeluar = () =>
  (1 - eps.value) * SIGMA * suhuPermukaan ** 4 + eps.value * SIGMA * suhuAtmosfer ** 4;

// ---------- Foton dan molekul ----------

function acak(a: number, b: number) {
  return a + Math.random() * (b - a);
}

function buatMolekul(): Molekul {
  return {
    x: acak(0, LEBAR),
    y: acak(Y_MOLEKUL_MIN, Y_MOLEKUL_MAX),
    vx: acak(-4, 4),
    vy: acak(-3, 3),
    sudut: acak(0, Math.PI),
    getar: 0,
  };
}

function sesuaikanMolekul() {
  const n = Math.round((tingkat.value / 100) * MOLEKUL_MAKS);
  while (molekul.length < n) molekul.push(buatMolekul());
  if (molekul.length > n) {
    const dibuang = new Set(molekul.slice(n));
    molekul.length = n;
    for (const f of foton) if (f.target && dibuang.has(f.target)) f.target = null;
  }
}

function arahkan(f: Foton, sudut: number) {
  // sudut diukur dari arah vertikal ke atas
  f.vx = Math.sin(sudut) * KELAJUAN_FOTON;
  f.vy = -Math.cos(sudut) * KELAJUAN_FOTON;
}

function pancarkanInframerah() {
  if (foton.length >= FOTON_MAKS) return;
  const f: Foton = { x: acak(0, LEBAR), y: Y_TANAH, vx: 0, vy: 0, inframerah: true, target: null, tahan: 0 };
  if (molekul.length && Math.random() < eps.value) {
    const m = molekul[Math.floor(Math.random() * molekul.length)];
    f.x = m.x + acak(-25, 25);
    f.target = m;
    const dx = m.x - f.x;
    const dy = m.y - f.y;
    const d = Math.hypot(dx, dy);
    f.vx = (dx / d) * KELAJUAN_FOTON;
    f.vy = (dy / d) * KELAJUAN_FOTON;
  } else {
    arahkan(f, acak(-0.4, 0.4));
  }
  foton.push(f);
}

function langkahFoton(dt: number) {
  if (sinarMenyala.value) {
    sisaMatahari += LAJU_FOTON_MATAHARI * dt;
    while (sisaMatahari >= 1) {
      sisaMatahari--;
      if (foton.length < FOTON_MAKS)
        foton.push({ x: acak(0, LEBAR), y: 0, vx: 0, vy: KELAJUAN_FOTON, inframerah: false, target: null, tahan: 0 });
    }
    sisaInframerah += ((LAJU_FOTON_MATAHARI * SIGMA * suhuPermukaan ** 4) / SINAR_SERAP) * dt;
    while (sisaInframerah >= 1) {
      sisaInframerah--;
      pancarkanInframerah();
    }
  }

  for (const m of molekul) {
    m.x = (m.x + m.vx * dt + LEBAR) % LEBAR;
    m.y += m.vy * dt;
    if (m.y < Y_MOLEKUL_MIN || m.y > Y_MOLEKUL_MAX) m.vy *= -1;
    m.getar = Math.max(0, m.getar - dt);
  }

  foton = foton.filter((f) => {
    if (f.tahan > 0) {
      f.tahan -= dt;
      if (f.target) {
        f.x = f.target.x;
        f.y = f.target.y;
      }
      if (f.tahan <= 0) {
        // Dipancarkan ulang ke arah acak: kira-kira separuh ke atas, separuh kembali ke permukaan.
        f.target = null;
        arahkan(f, (Math.random() < 0.5 ? 0 : Math.PI) + acak(-1, 1));
      }
      return true;
    }
    f.x += f.vx * dt;
    f.y += f.vy * dt;
    if (f.x < 0) f.x += LEBAR;
    else if (f.x > LEBAR) f.x -= LEBAR;
    if (f.target && Math.hypot(f.target.x - f.x, f.target.y - f.y) < 4) {
      f.tahan = DURASI_TAHAN;
      f.target.getar = 0.5;
      f.vx = f.vy = 0;
      return true;
    }
    if (f.target && f.y < f.target.y - 6) f.target = null; // molekul bergeser, foton lolos
    if (f.y >= Y_TANAH && f.vy > 0) return false; // diserap permukaan
    return f.y > -6;
  });
}

// ---------- Perulangan ----------

function langkah(waktu: number) {
  rafId = requestAnimationFrame(langkah);
  const dtNyata = Math.min(0.05, (waktu - (waktuTerakhir || waktu)) / 1000);
  waktuTerakhir = waktu;
  if (!terlihat) return;

  if (berjalan.value) {
    const dt = dtNyata * (cepat.value ? 4 : 1);
    sesuaikanMolekul();
    if (sinarMenyala.value) {
      const n = Math.max(1, Math.ceil(dt / 0.02));
      for (let i = 0; i < n; i++) langkahModel(dt / n);
      waktuSampel += dt;
      if (waktuSampel >= 1) {
        waktuSampel = 0;
        riwayat.push(suhuPermukaan);
        if (riwayat.length > PANJANG_GRAFIK_DETIK + 1) riwayat.shift();
      }
    }
    langkahFoton(dt);
    versi.value++;
  }
  gambar();
}

function ulangi() {
  suhuPermukaan = SUHU_AWAL;
  suhuAtmosfer = SUHU_AWAL / Math.SQRT2 ** 0.5;
  foton = [];
  riwayat = [];
  waktuSampel = 0;
  sinarMenyala.value = false;
  tingkat.value = 65;
  versi.value++;
}

// ---------- Gambar ----------

function warnaTanah(suhuC: number): string {
  // dingin → bersalju, sedang → hijau, panas → cokelat kering
  const salju = [232, 238, 242];
  const hijau = [94, 140, 58];
  const kering = [176, 138, 74];
  const [a, b, t] =
    suhuC < 12 ? [salju, hijau, Math.min(1, Math.max(0, (suhuC + 5) / 17))] : [hijau, kering, Math.min(1, (suhuC - 16) / 12)];
  const c = a.map((x, i) => Math.round(x + (b[i] - x) * Math.max(0, t)));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function gambarMolekul(m: Molekul) {
  if (!ctx) return;
  const goyang = m.getar > 0 ? Math.sin(m.getar * 60) * 1.2 : 0;
  const dx = Math.cos(m.sudut) * (4.5 + goyang);
  const dy = Math.sin(m.sudut) * (4.5 + goyang);
  ctx.fillStyle = "#d9463b";
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(m.x + s * dx, m.y + s * dy, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = "#1E2019";
  ctx.beginPath();
  ctx.arc(m.x, m.y, 3, 0, Math.PI * 2);
  ctx.fill();
}

function gambarFoton(f: Foton) {
  if (!ctx) return;
  const panjang = 9;
  const ux = f.vx / KELAJUAN_FOTON || 0;
  const uy = f.vy / KELAJUAN_FOTON || 0;
  const warna = f.inframerah ? "#e0402a" : "#f2b705";
  if (f.tahan > 0) {
    ctx.strokeStyle = warna;
    ctx.globalAlpha = 0.6;
    ctx.beginPath();
    ctx.arc(f.x, f.y, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.globalAlpha = 1;
    return;
  }
  // Ekor bergelombang: inframerah berpanjang gelombang lebih besar.
  const nx = -uy;
  const ny = ux;
  const gel = f.inframerah ? 1.6 : 1;
  ctx.strokeStyle = warna;
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  for (let i = 0; i <= 8; i++) {
    const s = (i / 8) * panjang;
    const off = Math.sin((i / 8) * Math.PI * (f.inframerah ? 2 : 4)) * gel;
    const px = f.x - ux * s + nx * off;
    const py = f.y - uy * s + ny * off;
    if (i) ctx.lineTo(px, py);
    else ctx.moveTo(px, py);
  }
  ctx.stroke();
  ctx.fillStyle = warna;
  ctx.beginPath();
  ctx.arc(f.x, f.y, 2, 0, Math.PI * 2);
  ctx.fill();
}

function gambar() {
  if (!ctx) return;
  const c = ctx;
  c.clearRect(0, 0, LEBAR, TINGGI);

  c.fillStyle = "#1b2340";
  c.fillRect(0, 0, LEBAR, Y_BATAS);
  const langit = c.createLinearGradient(0, Y_BATAS, 0, Y_TANAH);
  langit.addColorStop(0, "#7fb1e0");
  langit.addColorStop(1, "#d8ecfa");
  c.fillStyle = langit;
  c.fillRect(0, Y_BATAS, LEBAR, Y_TANAH - Y_BATAS);

  // Matahari
  c.fillStyle = "#ffe66d";
  c.beginPath();
  c.arc(18, 16, 10, 0, Math.PI * 2);
  c.fill();

  c.setLineDash([4, 3]);
  c.strokeStyle = "rgba(255,255,255,0.7)";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(0, Y_BATAS);
  c.lineTo(LEBAR, Y_BATAS);
  c.stroke();
  c.setLineDash([]);
  c.fillStyle = "rgba(255,255,255,0.85)";
  c.font = "8px sans-serif";
  c.textAlign = "right";
  c.fillText("Antariksa", LEBAR - 6, 12);
  c.fillText("Batas atmosfer", LEBAR - 6, Y_BATAS - 4);

  for (const m of molekul) gambarMolekul(m);

  c.fillStyle = warnaTanah(suhuPermukaan - 273.15);
  c.fillRect(0, Y_TANAH, LEBAR, TINGGI - Y_TANAH);
  c.fillStyle = "rgba(0,0,0,0.08)";
  c.fillRect(0, Y_TANAH, LEBAR, 3);
  c.fillStyle = "#323733";
  c.textAlign = "left";
  c.font = "8px sans-serif";
  c.fillText("Permukaan Bumi", 6, TINGGI - 8);

  for (const f of foton) gambarFoton(f);
}

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
  gambar();
}

// ---------- Tampilan angka ----------

const formatAngka = (x: number, d = 1) => x.toFixed(d).replace(".", ",");

const bacaan = computed(() => {
  void versi.value;
  const masuk = sinarMenyala.value ? SINAR_SERAP : 0;
  const keluar = energiKeluar();
  const selisih = masuk - keluar;
  const status = !sinarMenyala.value
    ? "Nyalakan sinar Matahari untuk memulai."
    : Math.abs(selisih) < 2
      ? "Seimbang: energi masuk = energi keluar, suhu tetap."
      : selisih > 0
        ? "Energi masuk lebih besar daripada energi keluar: permukaan Bumi memanas."
        : "Energi keluar lebih besar daripada energi masuk: permukaan Bumi mendingin.";
  return {
    suhuC: suhuPermukaan - 273.15,
    suhuK: suhuPermukaan,
    masuk,
    keluar,
    status,
    statusWarna: !sinarMenyala.value || Math.abs(selisih) < 2 ? "text-benar" : selisih > 0 ? "text-salah" : "text-accent-1",
  };
});

const SKALA_NERACA = 320;
const lebarBatang = (x: number) => `${Math.min(100, (x / SKALA_NERACA) * 100)}%`;

const G_LEBAR = 320;
const G_TINGGI = 90;
const gPad = { kiri: 28, kanan: 8, atas: 8, bawah: 16 };
const grafik = computed(() => {
  void versi.value;
  const lebar = G_LEBAR - gPad.kiri - gPad.kanan;
  const tinggi = G_TINGGI - gPad.atas - gPad.bawah;
  const data = riwayat.map((T) => T - 273.15);
  const yMin = Math.floor(Math.min(-20, ...data) / 10) * 10;
  const yMax = Math.ceil(Math.max(30, ...data) / 10) * 10;
  const y = (v: number) => gPad.atas + tinggi - ((v - yMin) / (yMax - yMin)) * tinggi;
  const awal = PANJANG_GRAFIK_DETIK - (data.length - 1);
  return {
    titik: data.map((v, i) => `${gPad.kiri + ((awal + i) / PANJANG_GRAFIK_DETIK) * lebar},${y(v)}`).join(" "),
    sumbuY: [yMin, 0, yMax].filter((v, i, a) => a.indexOf(v) === i).map((v) => ({ v, y: y(v) })),
  };
});

const presetAktif = computed(() => PRESET.find((p) => p.tingkat === tingkat.value));

onMounted(() => {
  ctx = canvasRef.value!.getContext("2d");
  aturResolusiKanvas();
  pengamatUkuran = new ResizeObserver(aturResolusiKanvas);
  pengamatUkuran.observe(canvasRef.value!);
  pengamatTampil = new IntersectionObserver(([e]) => (terlihat = e.isIntersecting));
  pengamatTampil.observe(canvasRef.value!);
  sesuaikanMolekul();
  rafId = requestAnimationFrame(langkah);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId);
  pengamatUkuran?.disconnect();
  pengamatTampil?.disconnect();
});
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="relative">
      <canvas
        ref="canvasRef"
        :style="{ aspectRatio: `${LEBAR} / ${TINGGI}` }"
        class="block w-full rounded-xl border border-ink-200"
        role="img"
        aria-label="Sinar Matahari masuk ke atmosfer dan permukaan Bumi memancarkan radiasi inframerah. Molekul gas rumah kaca menyerap sebagian inframerah."
      ></canvas>
      <button
        v-if="!sinarMenyala"
        type="button"
        class="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent-2 px-4 py-2 text-sm font-semibold text-brand-dark shadow-md"
        @click="sinarMenyala = true"
      >
        Nyalakan sinar Matahari
      </button>
    </div>

    <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-600">
      <span class="flex items-center gap-1.5"><span class="h-2 w-4 rounded-full bg-[#f2b705]"></span>Sinar Matahari (cahaya tampak)</span>
      <span class="flex items-center gap-1.5"><span class="h-2 w-4 rounded-full bg-[#e0402a]"></span>Radiasi inframerah</span>
      <span class="flex items-center gap-1.5">
        <svg viewBox="0 0 20 10" class="h-2.5 w-5"><circle cx="4" cy="5" r="2.6" fill="#d9463b" /><circle cx="16" cy="5" r="2.6" fill="#d9463b" /><circle cx="10" cy="5" r="3" fill="#1E2019" /></svg>
        Gas rumah kaca
      </span>
    </div>

    <div class="grid grid-cols-2 gap-2">
      <div class="rounded-lg border border-ink-200 bg-white px-3 py-2">
        <span class="block text-[11px] text-ink-500">Suhu permukaan</span>
        <span class="text-lg font-semibold text-ink-800">{{ formatAngka(bacaan.suhuC) }} °C</span>
        <span class="block text-[11px] text-ink-500">{{ formatAngka(bacaan.suhuK, 0) }} K</span>
      </div>
      <div class="flex flex-col justify-center gap-1.5 rounded-lg border border-ink-200 bg-white px-3 py-2 text-[11px] text-ink-600">
        <span class="block text-ink-500">Neraca energi di batas atmosfer</span>
        <div>
          <span class="flex justify-between"><span>Masuk</span><span class="font-semibold">{{ formatAngka(bacaan.masuk, 0) }} W/m²</span></span>
          <div class="h-1.5 rounded-full bg-ink-100"><div class="h-full rounded-full bg-[#f2b705]" :style="{ width: lebarBatang(bacaan.masuk) }"></div></div>
        </div>
        <div>
          <span class="flex justify-between"><span>Keluar</span><span class="font-semibold">{{ formatAngka(bacaan.keluar, 0) }} W/m²</span></span>
          <div class="h-1.5 rounded-full bg-ink-100"><div class="h-full rounded-full bg-[#e0402a]" :style="{ width: lebarBatang(bacaan.keluar) }"></div></div>
        </div>
      </div>
    </div>
    <p class="text-xs font-medium" :class="bacaan.statusWarna">{{ bacaan.status }}</p>

    <div class="rounded-xl border border-ink-200 bg-white p-2">
      <span class="px-1 text-[11px] text-ink-500">Suhu permukaan selama {{ PANJANG_GRAFIK_DETIK }} detik terakhir (°C)</span>
      <svg :viewBox="`0 0 ${G_LEBAR} ${G_TINGGI}`" class="block w-full" role="img" aria-label="Grafik suhu permukaan terhadap waktu">
        <g v-for="s in grafik.sumbuY" :key="s.v">
          <line :x1="gPad.kiri" :x2="G_LEBAR - gPad.kanan" :y1="s.y" :y2="s.y" :stroke="s.v === 0 ? '#A8BAC1' : '#DAE8EF'" />
          <text :x="gPad.kiri - 4" :y="s.y + 3" text-anchor="end" font-size="8" fill="#5A6668">{{ s.v }}</text>
        </g>
        <polyline :points="grafik.titik" fill="none" stroke="#c0502f" stroke-width="1.8" />
      </svg>
    </div>

    <div class="flex flex-col gap-3 rounded-xl border border-ink-200 p-3 text-sm">
      <fieldset class="flex flex-col gap-1.5">
        <legend class="mb-1 text-ink-600">Konsentrasi gas rumah kaca menurut zaman</legend>
        <div class="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          <button
            v-for="p in PRESET"
            :key="p.label"
            type="button"
            class="rounded-lg border px-2 py-1.5 text-xs transition-colors"
            :class="presetAktif === p ? 'border-accent-1 bg-accent-1/10 text-accent-1' : 'border-ink-200 text-ink-700'"
            @click="tingkat = p.tingkat"
          >
            <span class="block font-medium">{{ p.label }}</span>
            <span class="text-[10px] text-ink-500">CO₂ {{ p.co2 }}</span>
          </button>
        </div>
      </fieldset>

      <label class="flex flex-col gap-1">
        <span class="flex justify-between text-ink-600">
          <span>Atur konsentrasi sendiri</span>
          <span class="font-medium text-ink-800">{{ presetAktif?.label ?? `${tingkat}%` }}</span>
        </span>
        <input v-model.number="tingkat" type="range" min="0" max="100" step="1" aria-label="Konsentrasi gas rumah kaca" />
        <span class="flex justify-between text-[11px] text-ink-500"><span>Tidak ada</span><span>Banyak</span></span>
      </label>

      <div class="flex gap-2">
        <button type="button" class="flex-1 rounded-lg bg-brand px-3 py-2 font-semibold text-brand-dark" @click="berjalan = !berjalan">
          {{ berjalan ? "Jeda" : "Lanjutkan" }}
        </button>
        <button
          type="button"
          class="flex-1 rounded-lg border px-3 py-2 font-medium"
          :class="cepat ? 'border-accent-1 bg-accent-1/10 text-accent-1' : 'border-ink-300 text-ink-700'"
          @click="cepat = !cepat"
        >
          {{ cepat ? "Cepat ×4" : "Normal" }}
        </button>
        <button type="button" class="flex-1 rounded-lg border border-ink-300 px-3 py-2 font-medium text-ink-700" @click="ulangi">
          Ulangi
        </button>
      </div>
    </div>

    <p class="text-xs text-ink-500">
      Foton kuning (cahaya tampak) menembus atmosfer dan diserap permukaan. Permukaan yang hangat memancarkan foton merah
      (inframerah). Molekul gas rumah kaca dapat menyerap foton inframerah lalu memancarkannya lagi ke arah acak, ke
      antariksa atau kembali ke permukaan. Waktu dipercepat; angka energi dan suhu dihitung dengan model atmosfer satu
      lapis yang disederhanakan.
    </p>
  </div>
</template>
