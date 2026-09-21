<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";

interface Partikel {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const LEBAR = 320;
const TINGGI = 150;
const JARI = 4;
const JUMLAH_PARTIKEL_MIN = 10;
const JUMLAH_PARTIKEL_MAX = 200;
const SUHU_MIN = 50;
const SUHU_MAX = 10000;
const FAKTOR_KECEPATAN = 0.08;
const TEKANAN_SKALA = 1.2;
const TEKANAN_MAX_GAUGE_PER_PARTIKEL = 190 / 60; // kalibrasi dasar: gauge mentok di suhu maksimum
const LAJU_PEMANASAN = 1500; // K per detik, dicapai penuh setelah rampa
const RAMP_DURASI = 0.5; // detik untuk mencapai laju penuh sejak tombol ditekan
const JENDELA_RATA_RATA_DETIK = 2; // meredam noise pembacaan tumbukan/detik

const canvasRef = ref<HTMLCanvasElement | null>(null);
const jumlahPartikel = ref(60);
const suhu = ref(300);
const arahPemanasan = ref(0); // -1 (dinginkan) | 0 (netral) | 1 (panaskan), aktif hanya saat tombol ditekan
const berjalan = ref(true);
const tumbukanPerDetik = ref(0);

let ctx: CanvasRenderingContext2D | null = null;
let partikel: Partikel[] = [];
let rafId = 0;
let tumbukanAkumulasi = 0;
let waktuHitungTerakhir = 0;
let waktuFrameSebelumnya = 0;
let riwayatTumbukan: number[] = [];
let waktuMulaiTekan = 0;

function mulaiPemanasan(arah: number) {
  arahPemanasan.value = arah;
  waktuMulaiTekan = performance.now();
}

function hentikanPemanasan() {
  arahPemanasan.value = 0;
}

function kecepatanDariSuhu(T: number): number {
  return FAKTOR_KECEPATAN * Math.sqrt(T);
}

function buatPartikel(): Partikel {
  const sudut = Math.random() * Math.PI * 2;
  const v = kecepatanDariSuhu(suhu.value);
  return {
    x: JARI + Math.random() * (LEBAR - 2 * JARI),
    y: JARI + Math.random() * (TINGGI - 2 * JARI),
    vx: Math.cos(sudut) * v,
    vy: Math.sin(sudut) * v,
  };
}

function sebarPartikel() {
  partikel = Array.from({ length: jumlahPartikel.value }, buatPartikel);
  tumbukanAkumulasi = 0;
  tumbukanPerDetik.value = 0;
  riwayatTumbukan = [];
}

function ulangi() {
  jumlahPartikel.value = JUMLAH_PARTIKEL_MIN;
  suhu.value = SUHU_MIN;
  arahPemanasan.value = 0;
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
  ctx.clearRect(0, 0, LEBAR, TINGGI);
  ctx.fillStyle = "#F8F5EF";
  ctx.fillRect(0, 0, LEBAR, TINGGI);
  ctx.strokeStyle = "#CDC1AA";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, LEBAR - 2, TINGGI - 2);

  for (const p of partikel) {
    const v = Math.hypot(p.vx, p.vy);
    ctx.beginPath();
    ctx.fillStyle = warnaDariKecepatan(v);
    ctx.arc(p.x, p.y, JARI, 0, Math.PI * 2);
    ctx.fill();
  }
}

function langkah(waktu: number) {
  rafId = requestAnimationFrame(langkah);

  const dt = waktuFrameSebelumnya ? (waktu - waktuFrameSebelumnya) / 1000 : 0;
  waktuFrameSebelumnya = waktu;

  if (berjalan.value) {
    if (arahPemanasan.value !== 0 && dt > 0) {
      const durasiDitekan = (waktu - waktuMulaiTekan) / 1000;
      const faktorRamp = Math.min(1, Math.max(0, durasiDitekan / RAMP_DURASI));
      const suhuLama = suhu.value;
      const suhuBaru = Math.min(
        SUHU_MAX,
        Math.max(SUHU_MIN, suhuLama + arahPemanasan.value * LAJU_PEMANASAN * faktorRamp * dt),
      );
      if (suhuBaru !== suhuLama) {
        const rasio = Math.sqrt(suhuBaru / suhuLama);
        for (const p of partikel) {
          p.vx *= rasio;
          p.vy *= rasio;
        }
        suhu.value = suhuBaru;
      }
    }

    for (const p of partikel) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.x - JARI < 0) {
        p.x = JARI;
        p.vx *= -1;
        tumbukanAkumulasi++;
      } else if (p.x + JARI > LEBAR) {
        p.x = LEBAR - JARI;
        p.vx *= -1;
        tumbukanAkumulasi++;
      }

      if (p.y - JARI < 0) {
        p.y = JARI;
        p.vy *= -1;
        tumbukanAkumulasi++;
      } else if (p.y + JARI > TINGGI) {
        p.y = TINGGI - JARI;
        p.vy *= -1;
        tumbukanAkumulasi++;
      }
    }
  }

  if (waktu - waktuHitungTerakhir >= 1000) {
    riwayatTumbukan.push(tumbukanAkumulasi);
    if (riwayatTumbukan.length > JENDELA_RATA_RATA_DETIK) riwayatTumbukan.shift();
    const rataRata = riwayatTumbukan.reduce((a, b) => a + b, 0) / riwayatTumbukan.length;
    tumbukanPerDetik.value = Math.round(rataRata);
    tumbukanAkumulasi = 0;
    waktuHitungTerakhir = waktu;
  }

  gambar();
}

const tekanan = computed(() => Math.round(tumbukanPerDetik.value * TEKANAN_SKALA));
const tekananMaxGauge = computed(() => TEKANAN_MAX_GAUGE_PER_PARTIKEL * jumlahPartikel.value);
const fraksiTekanan = computed(() => Math.min(1, tekanan.value / tekananMaxGauge.value));
const sudutJarum = computed(() => -90 + fraksiTekanan.value * 180);
const warnaJarum = computed(() => {
  if (fraksiTekanan.value < 0.33) return "var(--color-benar)";
  if (fraksiTekanan.value < 0.66) return "var(--color-periksa)";
  return "var(--color-salah)";
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
  sebarPartikel();
  rafId = requestAnimationFrame(langkah);
});

onBeforeUnmount(() => {
  cancelAnimationFrame(rafId);
});
</script>

<template>
  <div class="flex flex-col gap-3">
    <div class="flex flex-col gap-2 sm:flex-row">
      <canvas
        ref="canvasRef"
        :width="LEBAR"
        :height="TINGGI"
        :style="{ aspectRatio: `${LEBAR} / ${TINGGI}` }"
        class="min-w-0 flex-1 rounded-xl border border-ink-200"
      ></canvas>

      <div
        class="flex w-full shrink-0 flex-col items-center justify-center gap-0.5 self-center rounded-xl border border-ink-200 bg-white p-2 sm:w-28 sm:self-auto sm:p-1.5"
      >
        <svg viewBox="0 0 200 120" class="w-24 sm:w-full">
          <path d="M10,100 A90,90 0 0 1 190,100" fill="none" stroke="#E2DACB" stroke-width="16" stroke-linecap="round" />
          <g :style="{ transform: `rotate(${sudutJarum}deg)`, transformOrigin: '100px 100px' }">
            <line x1="100" y1="100" x2="100" y2="26" :stroke="warnaJarum" stroke-width="6" stroke-linecap="round" />
          </g>
          <circle cx="100" cy="100" r="8" :fill="warnaJarum" />
        </svg>
        <span class="-mt-2 text-xs font-semibold" :style="{ color: warnaJarum }">{{ tekanan }} kPa</span>
        <span class="text-[10px] text-ink-500">Tekanan</span>

        <div class="mt-1.5 w-full max-w-40 border-t border-ink-100 pt-1.5 text-center sm:max-w-none">
          <span class="block text-xs font-semibold text-ink-800">{{ Math.round(suhu) }} K</span>
          <span class="text-[10px] text-ink-500">Suhu</span>
        </div>

        <div class="mt-1.5 flex w-full max-w-40 flex-row justify-center gap-3 border-t border-ink-100 pt-1.5 sm:max-w-none sm:flex-col">
          <button
            type="button"
            class="flex flex-1 select-none items-center justify-center gap-1 rounded-lg border py-1 text-sm p-2 font-medium transition-colors sm:flex-none"
            :class="arahPemanasan === -1 ? 'border-accent bg-accent/10 text-accent' : 'border-ink-300 text-ink-700'"
            @pointerdown="mulaiPemanasan(-1)"
            @pointerup="hentikanPemanasan"
            @pointerleave="hentikanPemanasan"
            @pointercancel="hentikanPemanasan"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" class="shrink-0">
              <g stroke="currentColor" stroke-width="2" stroke-linecap="round">
                <line x1="12" y1="2" x2="12" y2="22" />
                <line x1="4.5" y1="7" x2="19.5" y2="17" />
                <line x1="19.5" y1="7" x2="4.5" y2="17" />
              </g>
            </svg>
            Dinginkan
          </button>
          <button
            type="button"
            class="flex flex-1 select-none items-center justify-center gap-1 rounded-lg border py-1 text-sm p-2 font-medium transition-colors sm:flex-none"
            :class="arahPemanasan === 1 ? 'border-salah bg-salah/10 text-salah' : 'border-ink-300 text-ink-700'"
            @pointerdown="mulaiPemanasan(1)"
            @pointerup="hentikanPemanasan"
            @pointerleave="hentikanPemanasan"
            @pointercancel="hentikanPemanasan"
          >
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" class="shrink-0">
              <path
                d="M12 22c-4.4 0-8-3.2-8-7.5 0-3 1.8-5 3-7 .3 2 1.3 3 2.3 3.3C9 8 9.5 4 13 2c-.5 3 1 4.5 2.5 6.5 1.2 1.6 2.5 3.4 2.5 6 0 4.3-3.6 7.5-8 7.5z"
              />
            </svg>
            Panaskan
          </button>
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
      Jarum tekanan mengikuti kerapatan tumbukan pada
      dinding; warna partikel menunjukkan kelajuan relatif (biru = lambat, merah = cepat). Nilai suhu, tekanan, dan
      kelajuan bersifat ilustratif, bukan skala fisis sebenarnya.
    </p>
  </div>
</template>
