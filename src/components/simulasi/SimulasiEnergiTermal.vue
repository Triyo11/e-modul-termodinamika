<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";

// Meniru layar Intro PhET Energy Forms and Changes: balok besi, balok bata, dan gelas berisi air
// dapat dipindah ke meja atau ke atas pemanas, ditumpuk, atau dicelupkan ke air.
// Model: setiap benda punya kapasitas kalor C; daya kalor antar benda yang bersentuhan P = k (T₁ − T₂).

type IdBenda = "besi" | "bata" | "air";
type IdLokasi = "meja-1" | "meja-2" | "meja-3" | "pemanas-1" | "pemanas-2";
type Rgb = [number, number, number];

interface SifatBenda {
  nama: string;
  kapasitas: number; // J/K (ilustratif)
  suhuMax: number;
  warna: Rgb;
  warnaGaris: string;
  kUdara: number; // W/K, sebanding dengan kapasitas agar semua benda mendingin ke udara dengan laju yang sama
}

interface Kotak {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Titik {
  x: number;
  y: number;
}

interface Pegangan {
  lokasi: IdLokasi;
  indeks: number;
}

interface KepingTerbang {
  dari: Titik;
  /** Benda tujuan, atau "luar" (udara/pemanas) dengan titik tujuan tetap. */
  ke: IdBenda | "luar";
  tujuan: Titik;
  slot: number;
  t: number;
  dariLuar: boolean;
}

const BENDA: Record<IdBenda, SifatBenda> = {
  besi: { nama: "Besi", kapasitas: 880, suhuMax: 300, warna: [150, 152, 158], warnaGaris: "#404944", kUdara: 1.8 },
  bata: { nama: "Bata", kapasitas: 400, suhuMax: 300, warna: [176, 82, 58], warnaGaris: "#c0502f", kUdara: 0.8 },
  air: { nama: "Air", kapasitas: 1050, suhuMax: 100, warna: [96, 160, 220], warnaGaris: "#2E6E6A", kUdara: 2.1 },
};
const URUTAN: IdBenda[] = ["besi", "bata", "air"];

const LEBAR = 380;
const TINGGI = 236;
const Y_MEJA = 172;
const SISI_BALOK = 48;
const LEBAR_GELAS = 66;
const TINGGI_GELAS = 84;
const FRAKSI_AIR = 0.74;

const LOKASI: { id: IdLokasi; x: number; pemanas: number | null }[] = [
  { id: "meja-1", x: 42, pemanas: null },
  { id: "meja-2", x: 116, pemanas: null },
  { id: "meja-3", x: 190, pemanas: null },
  { id: "pemanas-1", x: 266, pemanas: 0 },
  { id: "pemanas-2", x: 340, pemanas: 1 },
];
const LOKASI_PEMANAS = LOKASI.filter((l) => l.pemanas !== null);

const SUHU_AWAL = 20;
const SUHU_MIN = 0;
const DAYA_PEMANAS = 6000; // W pada posisi slider penuh
const K_BALOK_BALOK = 30;
const K_BALOK_AIR = 60;
const LANGKAH_FISIKA = 0.02; // s

const ENERGI_PER_KEPING = 8000; // J, dihitung dari 0 °C
const UKURAN_KEPING = 10;
const JEDA_KEPING = 0.1; // s antar keping yang dikirim satu benda
const DURASI_TERBANG = 0.7;

const PANJANG_GRAFIK_DETIK = 60;
const INTERVAL_SAMPEL = 0.5;

const svgRef = ref<SVGSVGElement | null>(null);
const versi = ref(0);
const pemanas = ref<number[]>([0, 0]);
const berjalan = ref(true);
const cepat = ref(false);
const tampilKeping = ref(false);
const tampilGrafik = ref(false);
const dipilih = ref<Pegangan | null>(null);
const pesan = ref("");

let susunan: Record<IdLokasi, IdBenda[]> = susunanAwal();
const suhu: Record<IdBenda, number> = { besi: SUHU_AWAL, bata: SUHU_AWAL, air: SUHU_AWAL };
const kepingDiam: Record<IdBenda, number> = { besi: 0, bata: 0, air: 0 };
const kepingMasuk: Record<IdBenda, number> = { besi: 0, bata: 0, air: 0 };
const jedaKirim: Record<IdBenda, number> = { besi: 0, bata: 0, air: 0 };
let kepingTerbang: KepingTerbang[] = [];
let riwayat: Record<IdBenda, number[]> = { besi: [], bata: [], air: [] };
let waktuSampel = 0;
let waktuSim = 0;

let seret: (Pegangan & { awal: Titik; dx: number; dy: number; bergerak: boolean }) | null = null;
let rafId = 0;
let waktuTerakhir = 0;
let terlihat = true;
let pengamat: IntersectionObserver | undefined;
let pewaktuPesan = 0;

function susunanAwal(): Record<IdLokasi, IdBenda[]> {
  return { "meja-1": ["besi"], "meja-2": ["bata"], "meja-3": ["air"], "pemanas-1": [], "pemanas-2": [] };
}

const xLokasi = (id: IdLokasi) => LOKASI.find((l) => l.id === id)!.x;

// ---------- Tata letak ----------

function kotakDasar(lokasi: IdLokasi, isi: IdBenda[], i: number): Kotak {
  const cx = xLokasi(lokasi);
  if (isi[0] === "air") {
    if (i === 0) return { x: cx - LEBAR_GELAS / 2, y: Y_MEJA - TINGGI_GELAS, w: LEBAR_GELAS, h: TINGGI_GELAS };
    return { x: cx - SISI_BALOK / 2, y: Y_MEJA - 5 - SISI_BALOK, w: SISI_BALOK, h: SISI_BALOK };
  }
  return { x: cx - SISI_BALOK / 2, y: Y_MEJA - SISI_BALOK * (i + 1), w: SISI_BALOK, h: SISI_BALOK };
}

function sedangDiseret(lokasi: IdLokasi, i: number): boolean {
  return !!seret?.bergerak && seret.lokasi === lokasi && i >= seret.indeks;
}

function letakBenda(): Map<IdBenda, { kotak: Kotak; lokasi: IdLokasi; indeks: number; diseret: boolean }> {
  const peta = new Map<IdBenda, { kotak: Kotak; lokasi: IdLokasi; indeks: number; diseret: boolean }>();
  for (const l of LOKASI) {
    const isi = susunan[l.id];
    isi.forEach((id, i) => {
      let kotak = kotakDasar(l.id, isi, i);
      const diseret = sedangDiseret(l.id, i);
      if (diseret) kotak = { ...kotak, x: kotak.x + seret!.dx, y: kotak.y + seret!.dy };
      peta.set(id, { kotak, lokasi: l.id, indeks: i, diseret });
    });
  }
  return peta;
}

/** Tumpukan yang bersentuhan secara fisis. Benda yang sedang diangkat terpisah dari tumpukan asalnya. */
function tumpukanFisis(): { pemanas: number | null; isi: IdBenda[] }[] {
  const hasil: { pemanas: number | null; isi: IdBenda[] }[] = [];
  for (const l of LOKASI) {
    const isi = susunan[l.id];
    if (seret?.bergerak && seret.lokasi === l.id) {
      hasil.push({ pemanas: l.pemanas, isi: isi.slice(0, seret.indeks) });
      hasil.push({ pemanas: null, isi: isi.slice(seret.indeks) });
    } else {
      hasil.push({ pemanas: l.pemanas, isi });
    }
  }
  return hasil;
}

function tetangga(id: IdBenda, tumpukan = tumpukanFisis()): IdBenda[] {
  for (const t of tumpukan) {
    const i = t.isi.indexOf(id);
    if (i >= 0) return [t.isi[i - 1], t.isi[i + 1]].filter((x): x is IdBenda => !!x);
  }
  return [];
}

/** Indeks pemanas tepat di bawah benda, atau null. */
function pemanasDiBawah(id: IdBenda, tumpukan = tumpukanFisis()): number | null {
  const t = tumpukan.find((t) => t.isi[0] === id);
  return t?.pemanas ?? null;
}

// ---------- Fisika ----------

function langkahFisika(dt: number) {
  const tumpukan = tumpukanFisis();
  const daya: Record<IdBenda, number> = { besi: 0, bata: 0, air: 0 };
  for (const t of tumpukan) {
    for (let i = 0; i + 1 < t.isi.length; i++) {
      const a = t.isi[i];
      const b = t.isi[i + 1];
      const k = a === "air" || b === "air" ? K_BALOK_AIR : K_BALOK_BALOK;
      const q = k * (suhu[a] - suhu[b]);
      daya[a] -= q;
      daya[b] += q;
    }
    if (t.pemanas !== null && t.isi.length) daya[t.isi[0]] += pemanas.value[t.pemanas] * DAYA_PEMANAS;
  }
  for (const id of URUTAN) {
    const b = BENDA[id];
    daya[id] -= b.kUdara * (suhu[id] - SUHU_AWAL);
    // Batas atas air = titik didih: kelebihan energi menjadi uap.
    suhu[id] = Math.min(b.suhuMax, Math.max(SUHU_MIN, suhu[id] + (daya[id] * dt) / b.kapasitas));
  }
}

// ---------- Simbol energi (keping "E") ----------

const targetKeping = (id: IdBenda) => Math.max(0, Math.round((BENDA[id].kapasitas * suhu[id]) / ENERGI_PER_KEPING));

function posisiSlot(id: IdBenda, k: number, letak = letakBenda()): Titik {
  const kt = letak.get(id)!.kotak;
  const area =
    id === "air"
      ? { x: kt.x + 4, y: kt.y + kt.h * (1 - FRAKSI_AIR) + 3, w: kt.w - 8, h: kt.h * FRAKSI_AIR - 7 }
      : { x: kt.x + 3, y: kt.y + 3, w: kt.w - 6, h: kt.h - 6 };
  // Barisan R2 agar keping tersebar rata tanpa acak yang berubah tiap frame.
  const u = (0.5 + k * 0.7548776662) % 1;
  const v = (0.5 + k * 0.569840291) % 1;
  const s = UKURAN_KEPING / 2;
  return { x: area.x + s + u * (area.w - 2 * s), y: area.y + s + v * (area.h - 2 * s) };
}

function titikPemanas(indeks: number): Titik {
  return { x: LOKASI_PEMANAS[indeks].x + (Math.random() - 0.5) * 30, y: Y_MEJA + 14 };
}

function titikUdara(dekat: Titik): Titik {
  return { x: dekat.x + (Math.random() - 0.5) * 40, y: -14 };
}

function sinkronkanKeping() {
  for (const id of URUTAN) {
    kepingDiam[id] = targetKeping(id);
    kepingMasuk[id] = 0;
    jedaKirim[id] = 0;
  }
  kepingTerbang = [];
}

/** Keping berpindah satu per satu dari benda yang kelebihan ke benda/pemanas/udara yang kekurangan. */
function aturKeping(dt: number) {
  const tumpukan = tumpukanFisis();
  const letak = letakBenda();
  const tertunda = (id: IdBenda) => kepingDiam[id] + kepingMasuk[id];

  for (const id of URUTAN) {
    jedaKirim[id] -= dt;
    if (jedaKirim[id] > 0) continue;
    const target = targetKeping(id);
    const pemanasBawah = pemanasDiBawah(id, tumpukan);

    if (tertunda(id) > target && kepingDiam[id] > 0) {
      kepingDiam[id]--;
      const dari = posisiSlot(id, kepingDiam[id], letak);
      const penerima = tetangga(id, tumpukan).find((j) => tertunda(j) < targetKeping(j));
      if (penerima) {
        kepingTerbang.push({ dari, ke: penerima, tujuan: dari, slot: tertunda(penerima), t: 0, dariLuar: false });
        kepingMasuk[penerima]++;
      } else {
        const tujuan =
          pemanasBawah !== null && pemanas.value[pemanasBawah] < 0 ? titikPemanas(pemanasBawah) : titikUdara(dari);
        kepingTerbang.push({ dari, ke: "luar", tujuan, slot: 0, t: 0, dariLuar: false });
      }
      jedaKirim[id] = JEDA_KEPING;
    } else if (tertunda(id) < target) {
      // Bila ada tetangga yang kelebihan, biarkan tetangga itu yang mengirim.
      const adaPengirim = tetangga(id, tumpukan).some((j) => tertunda(j) > targetKeping(j) && kepingDiam[j] > 0);
      if (adaPengirim) continue;
      const kt = letak.get(id)!.kotak;
      const dari =
        pemanasBawah !== null && pemanas.value[pemanasBawah] > 0
          ? titikPemanas(pemanasBawah)
          : titikUdara({ x: kt.x + kt.w / 2, y: kt.y });
      kepingTerbang.push({ dari, ke: id, tujuan: dari, slot: tertunda(id), t: 0, dariLuar: true });
      kepingMasuk[id]++;
      jedaKirim[id] = JEDA_KEPING;
    }
  }

  for (const k of kepingTerbang) k.t += dt / DURASI_TERBANG;
  kepingTerbang = kepingTerbang.filter((k) => {
    if (k.t < 1) return true;
    if (k.ke !== "luar") {
      kepingMasuk[k.ke]--;
      kepingDiam[k.ke]++;
    }
    return false;
  });
}

// ---------- Perulangan ----------

function rekamGrafik(dt: number) {
  waktuSampel += dt;
  if (waktuSampel < INTERVAL_SAMPEL) return;
  waktuSampel = 0;
  const maks = PANJANG_GRAFIK_DETIK / INTERVAL_SAMPEL + 1;
  for (const id of URUTAN) {
    riwayat[id].push(suhu[id]);
    if (riwayat[id].length > maks) riwayat[id].shift();
  }
}

function langkah(waktu: number) {
  rafId = requestAnimationFrame(langkah);
  const dtNyata = Math.min(0.05, (waktu - (waktuTerakhir || waktu)) / 1000);
  waktuTerakhir = waktu;
  if (!terlihat || !berjalan.value) return;

  const dt = dtNyata * (cepat.value ? 4 : 1);
  const n = Math.max(1, Math.ceil(dt / LANGKAH_FISIKA));
  for (let i = 0; i < n; i++) langkahFisika(dt / n);
  aturKeping(dt);
  rekamGrafik(dt);
  waktuSim += dt;
  versi.value++;
}

function ulangi() {
  susunan = susunanAwal();
  for (const id of URUTAN) suhu[id] = SUHU_AWAL;
  pemanas.value = [0, 0];
  riwayat = { besi: [], bata: [], air: [] };
  waktuSampel = 0;
  seret = null;
  dipilih.value = null;
  pesan.value = "";
  sinkronkanKeping();
  versi.value++;
}

// ---------- Memindah benda (seret, atau ketuk lalu ketuk tujuan) ----------

function tampilkanPesan(teks: string) {
  pesan.value = teks;
  clearTimeout(pewaktuPesan);
  pewaktuPesan = window.setTimeout(() => (pesan.value = ""), 2500);
}

function alasanTolak(grup: IdBenda[], tujuan: IdBenda[]): string | null {
  if (!tujuan.length) return null;
  if (grup.includes("air")) return "Gelas hanya dapat diletakkan di tempat yang kosong.";
  if (tujuan[0] === "air") return tujuan.length === 1 && grup.length === 1 ? null : "Gelas hanya muat satu balok.";
  return tujuan.length + grup.length <= 2 ? null : "Tumpukan paling tinggi dua balok.";
}

function pindahkan(dari: Pegangan, ke: IdLokasi) {
  if (ke === dari.lokasi) return;
  const asal = susunan[dari.lokasi];
  const grup = asal.slice(dari.indeks);
  const alasan = alasanTolak(grup, susunan[ke]);
  if (alasan) return tampilkanPesan(alasan);
  susunan = { ...susunan, [dari.lokasi]: asal.slice(0, dari.indeks), [ke]: [...susunan[ke], ...grup] };
}

function titikSvg(e: PointerEvent): Titik {
  const r = svgRef.value!.getBoundingClientRect();
  return { x: ((e.clientX - r.left) / r.width) * LEBAR, y: ((e.clientY - r.top) / r.height) * TINGGI };
}

function bendaDiTitik(p: Titik): Pegangan | null {
  const letak = letakBenda();
  // Balok diperiksa lebih dulu agar balok di dalam gelas tetap dapat diambil.
  for (const id of ["besi", "bata", "air"] as IdBenda[]) {
    const l = letak.get(id)!;
    const k = l.kotak;
    if (p.x >= k.x - 4 && p.x <= k.x + k.w + 4 && p.y >= k.y - 4 && p.y <= k.y + k.h + 4)
      return { lokasi: l.lokasi, indeks: l.indeks };
  }
  return null;
}

function lokasiTerdekat(x: number): IdLokasi | null {
  let terbaik: IdLokasi | null = null;
  let jarak = 40;
  for (const l of LOKASI) {
    const d = Math.abs(l.x - x);
    if (d < jarak) {
      jarak = d;
      terbaik = l.id;
    }
  }
  return terbaik;
}

function tekan(e: PointerEvent) {
  const p = titikSvg(e);
  const kena = bendaDiTitik(p);
  if (kena) {
    seret = { ...kena, awal: p, dx: 0, dy: 0, bergerak: false };
    svgRef.value!.setPointerCapture(e.pointerId);
    return;
  }
  if (dipilih.value) {
    const tujuan = lokasiTerdekat(p.x);
    if (tujuan) pindahkan(dipilih.value, tujuan);
    dipilih.value = null;
    versi.value++;
  }
}

function geser(e: PointerEvent) {
  if (!seret) return;
  const p = titikSvg(e);
  seret.dx = p.x - seret.awal.x;
  seret.dy = p.y - seret.awal.y;
  if (!seret.bergerak && Math.hypot(seret.dx, seret.dy) > 6) {
    seret.bergerak = true;
    dipilih.value = null;
  }
  versi.value++;
}

function lepas() {
  if (!seret) return;
  const s = seret;
  seret = null;
  if (s.bergerak) {
    const tujuan = lokasiTerdekat(xLokasi(s.lokasi) + s.dx);
    if (tujuan) pindahkan(s, tujuan);
  } else if (dipilih.value && (dipilih.value.lokasi !== s.lokasi || dipilih.value.indeks !== s.indeks)) {
    // Ketuk benda lain = letakkan benda terpilih di tempat benda itu (mis. balok ke dalam gelas).
    pindahkan(dipilih.value, s.lokasi);
    dipilih.value = null;
  } else if (dipilih.value) {
    dipilih.value = null;
  } else {
    dipilih.value = { lokasi: s.lokasi, indeks: s.indeks };
  }
  versi.value++;
}

// ---------- Gambar ----------

function campur(a: Rgb, b: Rgb, t: number): string {
  const c = a.map((x, i) => Math.round(x + (b[i] - x) * t));
  return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
}

function warnaSuhu(id: IdBenda): string {
  const T = suhu[id];
  const dasar = BENDA[id].warna;
  if (T >= SUHU_AWAL) return campur(dasar, [235, 70, 30], Math.min(1, (T - SUHU_AWAL) / (id === "air" ? 100 : 250)) * 0.85);
  return campur(dasar, [190, 228, 255], Math.min(1, (SUHU_AWAL - T) / 20) * 0.75);
}

const formatSuhu = (T: number) => `${Math.round(T)} °C`;

const adegan = computed(() => {
  void versi.value;
  const letak = letakBenda();
  const tumpukan = tumpukanFisis();

  const urutan: IdBenda[] = [];
  for (const l of LOKASI) {
    const isi = susunan[l.id];
    urutan.push(...(isi[0] === "air" ? [...isi.slice(1), "air" as IdBenda] : isi));
  }
  urutan.sort((a, b) => Number(letak.get(a)!.diseret) - Number(letak.get(b)!.diseret));

  const pilih = dipilih.value;
  const benda = urutan.map((id) => {
    const l = letak.get(id)!;
    return {
      id,
      kotak: l.kotak,
      isi: warnaSuhu(id),
      terpilih: !!pilih && pilih.lokasi === l.lokasi && l.indeks >= pilih.indeks,
    };
  });

  const keping: (Titik & { opasitas: number })[] = [];
  if (tampilKeping.value) {
    for (const id of URUTAN) for (let k = 0; k < kepingDiam[id]; k++) keping.push({ ...posisiSlot(id, k, letak), opasitas: 1 });
    for (const k of kepingTerbang) {
      const tujuan = k.ke === "luar" ? k.tujuan : posisiSlot(k.ke, k.slot, letak);
      const s = k.t * k.t * (3 - 2 * k.t);
      const opasitas = k.dariLuar ? Math.min(1, k.t * 3) : k.ke === "luar" ? Math.min(1, (1 - k.t) * 3) : 1;
      keping.push({ x: k.dari.x + (tujuan.x - k.dari.x) * s, y: k.dari.y + (tujuan.y - k.dari.y) * s, opasitas });
    }
  }

  const gelas = letak.get("air")!.kotak;
  const pemanasAir = pemanasDiBawah("air", tumpukan);
  const mendidih = suhu.air >= 99.5 && pemanasAir !== null && pemanas.value[pemanasAir] > 0;
  const uap = mendidih
    ? [0, 1, 2, 3].map((i) => {
        const fase = ((waktuSim * 0.8 + i * 0.25) % 1 + 1) % 1;
        return {
          x: gelas.x + 14 + i * 12 + Math.sin(waktuSim * 3 + i) * 3,
          y: gelas.y - 4 - fase * 34,
          opasitas: 0.6 * (1 - fase),
        };
      })
    : [];

  const target = (pilih || seret?.bergerak) ? LOKASI.map((l) => l.x) : [];
  return { benda, keping, uap, target };
});

const nilaiPemanas = (v: number) =>
  Math.abs(v) < 0.025 ? "Mati" : v > 0 ? `Panaskan ${Math.round(v * 100)}%` : `Dinginkan ${Math.round(-v * 100)}%`;

const suhuTampil = computed(() => {
  void versi.value;
  return URUTAN.map((id) => ({ id, nama: BENDA[id].nama, suhu: suhu[id], warna: BENDA[id].warnaGaris }));
});

// ---------- Grafik suhu ----------

const G_LEBAR = 320;
const G_TINGGI = 120;
const gPad = { kiri: 30, kanan: 8, atas: 8, bawah: 20 };
const grafik = computed(() => {
  void versi.value;
  const semua = URUTAN.flatMap((id) => riwayat[id]);
  const yMax = Math.max(100, Math.ceil(Math.max(0, ...semua) / 50) * 50);
  const lebar = G_LEBAR - gPad.kiri - gPad.kanan;
  const tinggi = G_TINGGI - gPad.atas - gPad.bawah;
  const nMaks = PANJANG_GRAFIK_DETIK / INTERVAL_SAMPEL;
  const garis = URUTAN.map((id) => {
    const data = riwayat[id];
    const awal = nMaks - (data.length - 1);
    return {
      id,
      warna: BENDA[id].warnaGaris,
      titik: data
        .map((T, i) => `${gPad.kiri + ((awal + i) / nMaks) * lebar},${gPad.atas + tinggi - (T / yMax) * tinggi}`)
        .join(" "),
    };
  });
  const sumbuY = [0, yMax / 2, yMax].map((v) => ({ v, y: gPad.atas + tinggi - (v / yMax) * tinggi }));
  return { garis, sumbuY };
});

// ---------- Siklus hidup ----------

onMounted(() => {
  sinkronkanKeping();
  pengamat = new IntersectionObserver(([e]) => (terlihat = e.isIntersecting));
  pengamat.observe(svgRef.value!);
  rafId = requestAnimationFrame(langkah);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId);
  pengamat?.disconnect();
  clearTimeout(pewaktuPesan);
});
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="relative">
      <svg
        ref="svgRef"
        :viewBox="`0 0 ${LEBAR} ${TINGGI}`"
        :style="{ aspectRatio: `${LEBAR} / ${TINGGI}`, touchAction: 'pan-y' }"
        class="block w-full select-none rounded-xl border border-ink-200 bg-ink-50"
        role="img"
        aria-label="Meja dengan balok besi, balok bata, gelas air, dan dua pemanas. Seret atau ketuk benda untuk memindahkannya."
        @pointerdown="tekan"
        @pointermove="geser"
        @pointerup="lepas"
        @pointercancel="lepas"
      >
        <!-- Meja -->
        <rect x="2" :y="Y_MEJA" width="226" height="8" rx="2" fill="#C9A77C" />
        <rect x="14" :y="Y_MEJA + 8" width="8" :height="TINGGI - Y_MEJA - 10" fill="#B08A5E" />
        <rect x="208" :y="Y_MEJA + 8" width="8" :height="TINGGI - Y_MEJA - 10" fill="#B08A5E" />

        <!-- Pemanas -->
        <g v-for="(l, i) in LOKASI_PEMANAS" :key="l.id">
          <rect :x="l.x - 32" :y="Y_MEJA" width="64" :height="TINGGI - Y_MEJA - 4" rx="4" fill="#404944" />
          <rect :x="l.x - 28" :y="Y_MEJA" width="56" height="6" fill="#2F352F" />
          <ellipse
            v-if="Math.abs(pemanas[i]) >= 0.025"
            :cx="l.x"
            :cy="Y_MEJA + 3"
            rx="26"
            ry="6"
            :fill="pemanas[i] > 0 ? '#ff8a2a' : '#7cc7ff'"
            :opacity="0.35 + 0.65 * Math.abs(pemanas[i])"
          />
          <text :x="l.x" :y="TINGGI - 14" text-anchor="middle" font-size="9" fill="#E1ECEF">Pemanas {{ i + 1 }}</text>
        </g>

        <!-- Tempat tujuan saat memindah -->
        <g v-for="x in adegan.target" :key="'t' + x">
          <ellipse :cx="x" :cy="Y_MEJA - 2" rx="30" ry="5" fill="none" stroke="#2E6E6A" stroke-dasharray="4 3" />
        </g>

        <!-- Benda -->
        <g v-for="b in adegan.benda" :key="b.id" class="cursor-grab">
          <template v-if="b.id === 'air'">
            <rect
              :x="b.kotak.x + 2"
              :y="b.kotak.y + b.kotak.h * (1 - FRAKSI_AIR)"
              :width="b.kotak.w - 4"
              :height="b.kotak.h * FRAKSI_AIR - 2"
              :fill="b.isi"
              opacity="0.65"
            />
            <path
              :d="`M${b.kotak.x},${b.kotak.y} V${b.kotak.y + b.kotak.h - 4} Q${b.kotak.x},${b.kotak.y + b.kotak.h} ${b.kotak.x + 4},${b.kotak.y + b.kotak.h} H${b.kotak.x + b.kotak.w - 4} Q${b.kotak.x + b.kotak.w},${b.kotak.y + b.kotak.h} ${b.kotak.x + b.kotak.w},${b.kotak.y + b.kotak.h - 4} V${b.kotak.y}`"
              fill="rgba(255,255,255,0.18)"
              :stroke="b.terpilih ? '#2E6E6A' : '#5C6865'"
              :stroke-width="b.terpilih ? 2.5 : 1.5"
            />
          </template>
          <rect
            v-else
            :x="b.kotak.x"
            :y="b.kotak.y"
            :width="b.kotak.w"
            :height="b.kotak.h"
            rx="3"
            :fill="b.isi"
            :stroke="b.terpilih ? '#2E6E6A' : 'rgba(0,0,0,0.35)'"
            :stroke-width="b.terpilih ? 2.5 : 1"
          />
        </g>

        <!-- Uap saat air mendidih -->
        <circle v-for="(u, i) in adegan.uap" :key="'u' + i" :cx="u.x" :cy="u.y" r="5" fill="#ffffff" :opacity="u.opasitas" />

        <!-- Simbol energi -->
        <g v-for="(k, i) in adegan.keping" :key="'k' + i" :opacity="k.opasitas" pointer-events="none">
          <rect
            :x="k.x - UKURAN_KEPING / 2"
            :y="k.y - UKURAN_KEPING / 2"
            :width="UKURAN_KEPING"
            :height="UKURAN_KEPING"
            rx="2"
            fill="#ff6b6b"
            stroke="#b3261e"
            stroke-width="0.8"
          />
          <text :x="k.x" :y="k.y + 3" text-anchor="middle" font-size="8" font-weight="700" fill="#fff">E</text>
        </g>

        <!-- Label dan termometer -->
        <g v-for="b in adegan.benda" :key="'l' + b.id" pointer-events="none">
          <template v-if="b.id === 'air'">
            <rect :x="b.kotak.x + b.kotak.w / 2 - 30" :y="b.kotak.y - 17" width="60" height="14" rx="7" fill="#fff" stroke="#C6D3D5" />
            <text :x="b.kotak.x + b.kotak.w / 2" :y="b.kotak.y - 7" text-anchor="middle" font-size="9" fill="#2F352F">
              Air · <tspan font-weight="700">{{ formatSuhu(suhuTampil[2]?.suhu ?? 0) }}</tspan>
            </text>
          </template>
          <template v-else>
            <text :x="b.kotak.x + b.kotak.w / 2" :y="b.kotak.y + 11" text-anchor="middle" font-size="8.5" font-weight="600" fill="#fff">
              {{ BENDA[b.id].nama }}
            </text>
            <rect :x="b.kotak.x + 4" :y="b.kotak.y + b.kotak.h - 16" :width="b.kotak.w - 8" height="12" rx="6" fill="rgba(255,255,255,0.9)" />
            <text :x="b.kotak.x + b.kotak.w / 2" :y="b.kotak.y + b.kotak.h - 7" text-anchor="middle" font-size="8.5" font-weight="700" fill="#2F352F">
              {{ formatSuhu(suhuTampil.find((s) => s.id === b.id)?.suhu ?? 0) }}
            </text>
          </template>
        </g>
      </svg>

      <p
        v-if="pesan"
        class="pointer-events-none absolute inset-x-2 top-2 rounded-lg bg-periksa/90 px-2 py-1 text-center text-xs text-white"
      >
        {{ pesan }}
      </p>
    </div>

    <div class="grid grid-cols-3 gap-2 text-center">
      <div v-for="s in suhuTampil" :key="s.id" class="rounded-lg border border-ink-200 bg-white px-2 py-1.5">
        <span class="block text-[11px] text-ink-500">{{ s.nama }}</span>
        <span class="text-sm font-semibold" :style="{ color: s.warna }">{{ formatSuhu(s.suhu) }}</span>
      </div>
    </div>

    <div v-if="tampilGrafik" class="rounded-xl border border-ink-200 bg-white p-2">
      <svg :viewBox="`0 0 ${G_LEBAR} ${G_TINGGI}`" class="block w-full" role="img" aria-label="Grafik suhu terhadap waktu">
        <g v-for="s in grafik.sumbuY" :key="s.v">
          <line :x1="gPad.kiri" :x2="G_LEBAR - gPad.kanan" :y1="s.y" :y2="s.y" stroke="#E1ECEF" />
          <text :x="gPad.kiri - 4" :y="s.y + 3" text-anchor="end" font-size="8" fill="#5C6865">{{ s.v }}</text>
        </g>
        <polyline v-for="g in grafik.garis" :key="g.id" :points="g.titik" fill="none" :stroke="g.warna" stroke-width="1.8" />
        <text :x="gPad.kiri" :y="G_TINGGI - 6" font-size="8" fill="#5C6865">−{{ PANJANG_GRAFIK_DETIK }} s</text>
        <text :x="G_LEBAR - gPad.kanan" :y="G_TINGGI - 6" text-anchor="end" font-size="8" fill="#5C6865">sekarang</text>
        <text x="4" :y="gPad.atas + 4" font-size="8" fill="#5C6865">°C</text>
      </svg>
    </div>

    <div class="flex flex-col gap-3 rounded-xl border border-ink-200 p-3 text-sm">
      <div class="grid gap-3 sm:grid-cols-2">
        <label v-for="(_, i) in pemanas" :key="i" class="flex flex-col gap-1">
          <span class="flex items-center justify-between text-ink-600">
            <span>Pemanas {{ i + 1 }}</span>
            <span class="font-medium text-ink-800">{{ nilaiPemanas(pemanas[i]) }}</span>
          </span>
          <input
            v-model.number="pemanas[i]"
            type="range"
            min="-1"
            max="1"
            step="0.05"
            :aria-label="`Pemanas ${i + 1}: geser ke kanan untuk memanaskan, ke kiri untuk mendinginkan`"
          />
          <span class="flex items-center justify-between text-[11px] text-ink-500">
            <span>Dinginkan</span>
            <button
              type="button"
              class="rounded-md border border-ink-200 px-2 py-0.5 text-ink-600"
              @click="pemanas[i] = 0"
            >
              Matikan
            </button>
            <span>Panaskan</span>
          </span>
        </label>
      </div>

      <div class="flex flex-wrap gap-x-4 gap-y-2">
        <label class="flex items-center gap-1.5">
          <input v-model="tampilKeping" type="checkbox" class="accent-accent-1" />
          Simbol energi
        </label>
        <label class="flex items-center gap-1.5">
          <input v-model="tampilGrafik" type="checkbox" class="accent-accent-1" />
          Grafik suhu
        </label>
      </div>

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
      Seret benda ke tempat lain, atau ketuk benda lalu ketuk tempat tujuannya. Balok dapat ditumpuk atau dimasukkan ke
      gelas. Benda yang bersentuhan bertukar energi sampai suhunya sama. Satu simbol E mewakili sejumlah energi tetap;
      nilai suhu dan energi bersifat ilustratif.
    </p>
  </div>
</template>
