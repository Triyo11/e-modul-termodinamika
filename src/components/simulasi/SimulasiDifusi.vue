<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";

// Meniru layar Diffusion PhET Gas Properties: dua jenis partikel dipisah sekat, lalu sekat diangkat.
// Partikel saling bertumbukan lenting sehingga pencampuran berlangsung bertahap dan suhu kedua sisi menyamakan diri.

type Jenis = 0 | 1; // 0 = biru (awal di kiri), 1 = merah (awal di kanan)

interface Partikel {
  x: number;
  y: number;
  vx: number;
  vy: number;
  jenis: Jenis;
}

interface PengaturanSisi {
  jumlah: number;
  massa: number;
  suhu: number;
}

const LEBAR = 320;
const TINGGI = 180;
const JARI = 4;
const X_SEKAT = LEBAR / 2;
const TEBAL_SEKAT = 4;
const JUMLAH_MAX = 100;
const MASSA_MIN = 4;
const MASSA_MAX = 44;
const SUHU_MIN = 50;
const SUHU_MAX = 1000;
// v_rms = FAKTOR √(T/m); kira-kira 60 px/s untuk m = 28 u pada 300 K.
const FAKTOR_KECEPATAN = 18;
const LANGKAH = 1 / 240;
const PANJANG_GRAFIK_DETIK = 120;
const PERATAAN_SUHU_DETIK = 1.5; // meredam fluktuasi bacaan suhu tiap sisi
const INTERVAL_SAMPEL = 0.5;

const WARNA: Record<Jenis, string> = { 0: "#1f5fbf", 1: "#e0402a" };

const canvasRef = ref<HTMLCanvasElement | null>(null);
const versi = ref(0);
const atur = reactive<Record<Jenis, PengaturanSisi>>({
  0: { jumlah: 50, massa: 28, suhu: 300 },
  1: { jumlah: 50, massa: 28, suhu: 300 },
});
const adaSekat = ref(true);
const sudahDiangkat = ref(false);
const berjalan = ref(true);
const cepat = ref(false);
const tampilPusatMassa = ref(false);

let ctx: CanvasRenderingContext2D | null = null;
let partikel: Partikel[] = [];
let waktuSejakDiangkat = 0;
let waktuSampel = 0;
let riwayat: { biruKiri: number; merahKanan: number }[] = [];
let suhuHalus: { kiri: number | null; kanan: number | null } = { kiri: null, kanan: null };
let posisiSekatAnimasi = 0; // 0 = terpasang penuh, 1 = terangkat
let rafId = 0;
let waktuTerakhir = 0;
let terlihat = true;
let pengamatUkuran: ResizeObserver | undefined;
let pengamatTampil: IntersectionObserver | undefined;

const massa = (j: Jenis) => atur[j].massa;

function acakNormal(): number {
  return Math.sqrt(-2 * Math.log(1 - Math.random())) * Math.cos(2 * Math.PI * Math.random());
}

function buatPartikel(jenis: Jenis): Partikel {
  const { massa: m, suhu: T } = atur[jenis];
  const sigma = (FAKTOR_KECEPATAN * Math.sqrt(T / m)) / Math.SQRT2; // tiap komponen; v² rata-rata = F²T/m
  const xMin = jenis === 0 ? JARI : X_SEKAT + TEBAL_SEKAT / 2 + JARI;
  const xMax = jenis === 0 ? X_SEKAT - TEBAL_SEKAT / 2 - JARI : LEBAR - JARI;
  return {
    x: xMin + Math.random() * (xMax - xMin),
    y: JARI + Math.random() * (TINGGI - 2 * JARI),
    vx: sigma * acakNormal(),
    vy: sigma * acakNormal(),
    jenis,
  };
}

function isiUlang(jenis: Jenis) {
  partikel = partikel.filter((p) => p.jenis !== jenis);
  const baru = Array.from({ length: atur[jenis].jumlah }, () => buatPartikel(jenis));
  // Skalakan kelajuan agar suhu awal kelompok tepat sama dengan pengaturan, bukan hasil acak.
  const T = suhuKelompok(baru);
  if (T) {
    const skala = Math.sqrt(atur[jenis].suhu / T);
    for (const p of baru) {
      p.vx *= skala;
      p.vy *= skala;
    }
  }
  partikel.push(...baru);
}

/** Suhu dari energi kinetik rata-rata: T = m v² / F² (2 dimensi). */
function suhuKelompok(daftar: Partikel[]): number | null {
  if (!daftar.length) return null;
  const jumlah = daftar.reduce((s, p) => s + massa(p.jenis) * (p.vx * p.vx + p.vy * p.vy), 0);
  return jumlah / (daftar.length * FAKTOR_KECEPATAN * FAKTOR_KECEPATAN);
}

// ---------- Fisika ----------

function tumbukanAntarPartikel() {
  const d2 = 4 * JARI * JARI;
  for (let i = 0; i < partikel.length; i++) {
    const a = partikel[i];
    for (let j = i + 1; j < partikel.length; j++) {
      const b = partikel[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const r2 = dx * dx + dy * dy;
      if (r2 >= d2 || r2 === 0) continue;
      const r = Math.sqrt(r2);
      const nx = dx / r;
      const ny = dy / r;
      const vRel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
      const ma = massa(a.jenis);
      const mb = massa(b.jenis);
      if (vRel > 0) {
        // Tumbukan lenting sempurna sepanjang garis pusat.
        const impuls = (2 * vRel) / (ma + mb);
        a.vx -= impuls * mb * nx;
        a.vy -= impuls * mb * ny;
        b.vx += impuls * ma * nx;
        b.vy += impuls * ma * ny;
      }
      // Pisahkan agar tidak lengket.
      const geser = (2 * JARI - r) / 2;
      a.x -= nx * geser;
      a.y -= ny * geser;
      b.x += nx * geser;
      b.y += ny * geser;
    }
  }
}

function langkahFisika(dt: number) {
  const sekat = adaSekat.value;
  const kiriSekat = X_SEKAT - TEBAL_SEKAT / 2;
  const kananSekat = X_SEKAT + TEBAL_SEKAT / 2;
  for (const p of partikel) {
    const xLama = p.x;
    p.x += p.vx * dt;
    p.y += p.vy * dt;

    if (p.x < JARI) {
      p.x = JARI;
      p.vx = Math.abs(p.vx);
    } else if (p.x > LEBAR - JARI) {
      p.x = LEBAR - JARI;
      p.vx = -Math.abs(p.vx);
    }
    if (p.y < JARI) {
      p.y = JARI;
      p.vy = Math.abs(p.vy);
    } else if (p.y > TINGGI - JARI) {
      p.y = TINGGI - JARI;
      p.vy = -Math.abs(p.vy);
    }

    if (sekat) {
      if (xLama <= X_SEKAT && p.x > kiriSekat - JARI) {
        p.x = kiriSekat - JARI;
        p.vx = -Math.abs(p.vx);
      } else if (xLama > X_SEKAT && p.x < kananSekat + JARI) {
        p.x = kananSekat + JARI;
        p.vx = Math.abs(p.vx);
      }
    }
  }
  tumbukanAntarPartikel();
}

// ---------- Perulangan ----------

function hitungSisi() {
  const kiri = partikel.filter((p) => p.x < X_SEKAT);
  const kanan = partikel.filter((p) => p.x >= X_SEKAT);
  const hitung = (d: Partikel[], j: Jenis) => d.filter((p) => p.jenis === j).length;
  return {
    kiri: { biru: hitung(kiri, 0), merah: hitung(kiri, 1), suhu: suhuKelompok(kiri) },
    kanan: { biru: hitung(kanan, 0), merah: hitung(kanan, 1), suhu: suhuKelompok(kanan) },
  };
}

function rekam(dt: number) {
  if (!sudahDiangkat.value) return;
  waktuSejakDiangkat += dt;
  waktuSampel += dt;
  if (waktuSampel < INTERVAL_SAMPEL) return;
  waktuSampel = 0;
  const s = hitungSisi();
  const persen = (x: number, n: number) => (n ? (100 * x) / n : 0);
  riwayat.push({
    biruKiri: persen(s.kiri.biru, s.kiri.biru + s.kanan.biru),
    merahKanan: persen(s.kanan.merah, s.kiri.merah + s.kanan.merah),
  });
  if (riwayat.length > PANJANG_GRAFIK_DETIK / INTERVAL_SAMPEL + 1) riwayat.shift();
}

function haluskanSuhu(dt: number) {
  const s = hitungSisi();
  const a = Math.min(1, dt / PERATAAN_SUHU_DETIK);
  const halus = (lama: number | null, baru: number | null) =>
    baru === null ? null : lama === null ? baru : lama + (baru - lama) * a;
  suhuHalus = { kiri: halus(suhuHalus.kiri, s.kiri.suhu), kanan: halus(suhuHalus.kanan, s.kanan.suhu) };
}

function langkah(waktu: number) {
  rafId = requestAnimationFrame(langkah);
  const dtNyata = Math.min(0.05, (waktu - (waktuTerakhir || waktu)) / 1000);
  waktuTerakhir = waktu;
  if (!terlihat) return;

  posisiSekatAnimasi = Math.min(1, Math.max(0, posisiSekatAnimasi + (adaSekat.value ? -1 : 1) * dtNyata * 3));
  if (berjalan.value) {
    const dt = dtNyata * (cepat.value ? 4 : 1);
    const n = Math.max(1, Math.round(dt / LANGKAH));
    for (let i = 0; i < n; i++) langkahFisika(dt / n);
    rekam(dt);
    haluskanSuhu(dt);
    versi.value++;
  }
  gambar();
}

function angkatSekat() {
  if (adaSekat.value) {
    adaSekat.value = false;
    sudahDiangkat.value = true;
  } else {
    // Sekat dipasang lagi di tengah; partikel tetap di sisi tempatnya berada.
    adaSekat.value = true;
  }
}

function ulangi() {
  adaSekat.value = true;
  sudahDiangkat.value = false;
  posisiSekatAnimasi = 0;
  waktuSejakDiangkat = 0;
  waktuSampel = 0;
  riwayat = [];
  partikel = [];
  suhuHalus = { kiri: null, kanan: null };
  isiUlang(0);
  isiUlang(1);
  versi.value++;
}

// Pengaturan hanya berlaku sebelum sekat pertama kali diangkat.
for (const j of [0, 1] as Jenis[]) {
  watch(
    () => [atur[j].jumlah, atur[j].massa, atur[j].suhu],
    () => {
      if (sudahDiangkat.value) return;
      isiUlang(j);
      suhuHalus = { kiri: null, kanan: null };
    },
  );
}

// ---------- Gambar ----------

function gambar() {
  if (!ctx) return;
  const c = ctx;
  c.clearRect(0, 0, LEBAR, TINGGI);
  c.fillStyle = "#F8F5EF";
  c.fillRect(0, 0, LEBAR, TINGGI);

  // Garis tengah tipis sebagai acuan kiri/kanan setelah sekat diangkat.
  c.setLineDash([3, 4]);
  c.strokeStyle = "#E2DACB";
  c.lineWidth = 1;
  c.beginPath();
  c.moveTo(X_SEKAT, 0);
  c.lineTo(X_SEKAT, TINGGI);
  c.stroke();
  c.setLineDash([]);

  for (const p of partikel) {
    c.fillStyle = WARNA[p.jenis];
    c.beginPath();
    c.arc(p.x, p.y, JARI, 0, Math.PI * 2);
    c.fill();
  }

  if (posisiSekatAnimasi < 1) {
    c.fillStyle = "#52483B";
    c.fillRect(X_SEKAT - TEBAL_SEKAT / 2, -posisiSekatAnimasi * TINGGI, TEBAL_SEKAT, TINGGI);
  }

  if (tampilPusatMassa.value) {
    for (const j of [0, 1] as Jenis[]) {
      const d = partikel.filter((p) => p.jenis === j);
      if (!d.length) continue;
      const x = d.reduce((s, p) => s + p.x, 0) / d.length;
      c.fillStyle = WARNA[j];
      c.strokeStyle = "#fff";
      c.lineWidth = 1;
      c.beginPath();
      c.moveTo(x, TINGGI - 10);
      c.lineTo(x - 6, TINGGI - 1);
      c.lineTo(x + 6, TINGGI - 1);
      c.closePath();
      c.fill();
      c.stroke();
    }
  }
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

// ---------- Tampilan data ----------

const formatSuhu = (T: number | null) => (T === null ? "–" : `${Math.round(T)} K`);

const data = computed(() => {
  void versi.value;
  const s = hitungSisi();
  return { kiri: { ...s.kiri, suhu: suhuHalus.kiri }, kanan: { ...s.kanan, suhu: suhuHalus.kanan } };
});

const stopwatch = computed(() => {
  void versi.value;
  return waktuSejakDiangkat.toFixed(1).replace(".", ",");
});

const G_LEBAR = 320;
const G_TINGGI = 100;
const gPad = { kiri: 28, kanan: 8, atas: 8, bawah: 14 };
const grafik = computed(() => {
  void versi.value;
  const lebar = G_LEBAR - gPad.kiri - gPad.kanan;
  const tinggi = G_TINGGI - gPad.atas - gPad.bawah;
  const nMaks = PANJANG_GRAFIK_DETIK / INTERVAL_SAMPEL;
  const awal = nMaks - (riwayat.length - 1);
  const y = (v: number) => gPad.atas + tinggi - (v / 100) * tinggi;
  const garis = (k: "biruKiri" | "merahKanan") =>
    riwayat.map((r, i) => `${gPad.kiri + ((awal + i) / nMaks) * lebar},${y(r[k])}`).join(" ");
  return {
    biru: garis("biruKiri"),
    merah: garis("merahKanan"),
    sumbuY: [0, 50, 100].map((v) => ({ v, y: y(v) })),
  };
});

const kontrolSisi: { jenis: Jenis; judul: string }[] = [
  { jenis: 0, judul: "Sisi kiri (partikel biru)" },
  { jenis: 1, judul: "Sisi kanan (partikel merah)" },
];

onMounted(() => {
  ctx = canvasRef.value!.getContext("2d");
  isiUlang(0);
  isiUlang(1);
  aturResolusiKanvas();
  pengamatUkuran = new ResizeObserver(aturResolusiKanvas);
  pengamatUkuran.observe(canvasRef.value!);
  pengamatTampil = new IntersectionObserver(([e]) => (terlihat = e.isIntersecting));
  pengamatTampil.observe(canvasRef.value!);
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
    <canvas
      ref="canvasRef"
      :style="{ aspectRatio: `${LEBAR} / ${TINGGI}` }"
      class="block w-full rounded-xl border-2 border-ink-400"
      role="img"
      aria-label="Wadah gas dengan partikel biru di kiri dan partikel merah di kanan, dipisah sekat."
    ></canvas>

    <button
      type="button"
      class="rounded-lg px-3 py-2.5 text-sm font-semibold"
      :class="adaSekat ? 'bg-accent-2 text-brand-dark' : 'border border-ink-300 text-ink-700'"
      @click="angkatSekat"
    >
      {{ adaSekat ? "Angkat sekat" : "Pasang sekat kembali" }}
    </button>

    <div class="grid grid-cols-2 gap-2 text-center text-xs">
      <div
        v-for="(sisi, kunci) in { kiri: data.kiri, kanan: data.kanan }"
        :key="kunci"
        class="rounded-lg border border-ink-200 bg-white px-2 py-1.5"
      >
        <span class="block text-[11px] text-ink-500">Sisi {{ kunci }}</span>
        <span class="flex justify-center gap-3 font-semibold">
          <span :style="{ color: WARNA[0] }">● {{ sisi.biru }}</span>
          <span :style="{ color: WARNA[1] }">● {{ sisi.merah }}</span>
        </span>
        <span class="block text-[11px] text-ink-600">Suhu rata-rata {{ formatSuhu(sisi.suhu) }}</span>
      </div>
    </div>

    <div class="rounded-xl border border-ink-200 bg-white p-2">
      <span class="flex justify-between px-1 text-[11px] text-ink-500">
        <span>Partikel yang masih di sisi asalnya (%)</span>
        <span>Waktu sejak sekat diangkat: {{ stopwatch }} s</span>
      </span>
      <svg :viewBox="`0 0 ${G_LEBAR} ${G_TINGGI}`" class="block w-full" role="img" aria-label="Grafik persentase partikel di sisi asalnya terhadap waktu">
        <g v-for="s in grafik.sumbuY" :key="s.v">
          <line :x1="gPad.kiri" :x2="G_LEBAR - gPad.kanan" :y1="s.y" :y2="s.y" :stroke="s.v === 50 ? '#CDC1AA' : '#F0EBE1'" />
          <text :x="gPad.kiri - 4" :y="s.y + 3" text-anchor="end" font-size="8" fill="#8F7F66">{{ s.v }}</text>
        </g>
        <polyline :points="grafik.biru" fill="none" :stroke="WARNA[0]" stroke-width="1.6" />
        <polyline :points="grafik.merah" fill="none" :stroke="WARNA[1]" stroke-width="1.6" />
        <text v-if="!sudahDiangkat" :x="G_LEBAR / 2" :y="G_TINGGI / 2" text-anchor="middle" font-size="9" fill="#8F7F66">
          Grafik mulai saat sekat diangkat
        </text>
      </svg>
      <span class="flex gap-3 px-1 text-[11px] text-ink-600">
        <span :style="{ color: WARNA[0] }">— biru di kiri</span>
        <span :style="{ color: WARNA[1] }">— merah di kanan</span>
      </span>
    </div>

    <div class="flex flex-col gap-3 rounded-xl border border-ink-200 p-3 text-sm">
      <div class="grid gap-3 sm:grid-cols-2">
        <fieldset
          v-for="k in kontrolSisi"
          :key="k.jenis"
          class="flex flex-col gap-2 rounded-lg border border-ink-100 p-2"
          :disabled="sudahDiangkat"
          :class="sudahDiangkat ? 'opacity-50' : ''"
        >
          <legend class="px-1 text-xs font-semibold" :style="{ color: WARNA[k.jenis] }">{{ k.judul }}</legend>
          <label class="flex flex-col gap-0.5">
            <span class="flex justify-between text-xs text-ink-600">
              <span>Jumlah partikel</span><span class="font-medium text-ink-800">{{ atur[k.jenis].jumlah }}</span>
            </span>
            <input v-model.number="atur[k.jenis].jumlah" type="range" min="0" :max="JUMLAH_MAX" step="5" />
          </label>
          <label class="flex flex-col gap-0.5">
            <span class="flex justify-between text-xs text-ink-600">
              <span>Massa</span><span class="font-medium text-ink-800">{{ atur[k.jenis].massa }} u</span>
            </span>
            <input v-model.number="atur[k.jenis].massa" type="range" :min="MASSA_MIN" :max="MASSA_MAX" step="1" />
          </label>
          <label class="flex flex-col gap-0.5">
            <span class="flex justify-between text-xs text-ink-600">
              <span>Suhu awal</span><span class="font-medium text-ink-800">{{ atur[k.jenis].suhu }} K</span>
            </span>
            <input v-model.number="atur[k.jenis].suhu" type="range" :min="SUHU_MIN" :max="SUHU_MAX" step="10" />
          </label>
        </fieldset>
      </div>
      <p v-if="sudahDiangkat" class="text-xs text-ink-500">Ketuk Ulangi untuk mengubah pengaturan partikel.</p>

      <label class="flex items-center gap-1.5">
        <input v-model="tampilPusatMassa" type="checkbox" class="accent-accent-1" />
        Pusat massa tiap jenis partikel
      </label>

      <div class="flex gap-2">
        <button type="button" class="flex-1 rounded-lg bg-accent-1 px-3 py-2 font-medium text-white" @click="berjalan = !berjalan">
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
      Partikel bergerak acak dan saling bertumbukan lenting. Garis putus-putus menandai tengah wadah untuk menghitung
      partikel di sisi kiri dan kanan. Atur suhu awal yang berbeda untuk melihat suhu kedua sisi menyamakan diri. Nilai
      massa, suhu, dan waktu bersifat ilustratif.
    </p>
  </div>
</template>
