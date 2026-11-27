<script setup lang="ts">
// Ilustrasi pembuka e-modul (dekoratif): diagram p–V, gas dalam silinder berpiston yang dipanaskan,
// termometer, roda gigi mesin kalor, butiran salju, dan stiker hukum I termodinamika.
// Semua warna diambil dari token palet di style.css.
const gigi = Array.from({ length: 8 }, (_, i) => i * 45);
</script>

<template>
  <svg
    viewBox="0 0 360 220"
    role="img"
    aria-label="Ilustrasi termodinamika: diagram p–V, gas dalam silinder berpiston yang dipanaskan, termometer, dan roda gigi mesin kalor"
    fill="none"
    stroke="var(--color-brand-dark)"
    stroke-width="3.5"
    stroke-linejoin="round"
    stroke-linecap="round"
    font-family="inherit"
  >
    <!-- Diagram p–V -->
    <g transform="rotate(-6 66 84)">
      <rect x="10" y="30" width="112" height="108" rx="10" fill="var(--color-pastel-biru)" />
      <g stroke="var(--color-teks-gelap)" stroke-width="3">
        <path d="M32 46 V118 H112" />
        <path d="M28 52 L32 44 L36 52 M106 114 L114 118 L106 122" />
        <path d="M42 56 Q52 104 104 108" stroke-width="3.5" />
        <path d="M42 56 L42 104 L104 108" stroke-dasharray="4 5" stroke-width="2" />
      </g>
      <circle cx="42" cy="56" r="4.5" fill="var(--color-pastel-pink)" stroke="var(--color-teks-gelap)" stroke-width="2.5" />
      <circle cx="104" cy="108" r="4.5" fill="var(--color-pastel-pink)" stroke="var(--color-teks-gelap)" stroke-width="2.5" />
      <g fill="var(--color-teks-gelap)" stroke="none" font-weight="800" font-size="14" font-style="italic">
        <text x="16" y="54">p</text>
        <text x="104" y="133">V</text>
      </g>
    </g>

    <!-- Silinder berpiston berisi gas -->
    <line x1="185" y1="14" x2="185" y2="48" />
    <rect x="147" y="48" width="76" height="14" rx="3" fill="var(--color-pastel-peach)" />
    <path d="M143 40 V150 H227 V40" />
    <circle cx="164" cy="82" r="6" fill="var(--color-pastel-pink)" />
    <circle cx="200" cy="76" r="6" fill="var(--color-pastel-mint)" />
    <circle cx="186" cy="106" r="6" fill="var(--color-pastel-kuning)" />
    <circle cx="210" cy="128" r="6" fill="var(--color-pastel-lavender)" />
    <circle cx="160" cy="128" r="6" fill="var(--color-pastel-biru)" />
    <path d="M172 78 l8 -4 M208 70 l6 -5 M194 108 l8 2 M168 124 l7 -3" stroke-width="2.5" />

    <!-- Api dan gelombang panas -->
    <path
      d="M185 202 c-14 0 -20 -10 -16 -20 c2 6 6 8 8 6 c-2 -10 4 -16 8 -20 c0 8 8 10 10 18 c2 -2 2 -6 2 -8 c6 8 4 24 -12 24 z"
      fill="var(--color-pastel-pink)"
    />
    <g stroke="var(--color-pastel-peach)" stroke-width="3">
      <path d="M158 196 q-5 -5 0 -10 q5 -5 0 -10" />
      <path d="M212 196 q-5 -5 0 -10 q5 -5 0 -10" />
    </g>
    <!-- Label Q (kalor masuk) -->
    <g transform="rotate(-8 128 178)">
      <rect x="114" y="166" width="28" height="24" rx="6" fill="var(--color-pastel-kuning)" stroke-width="2.5" />
      <text x="121" y="184" fill="var(--color-teks-gelap)" stroke="none" font-weight="800" font-size="15">Q</text>
    </g>

    <!-- Stiker hukum I termodinamika -->
    <g transform="rotate(5 284 22)">
      <rect x="226" y="6" width="118" height="30" rx="7" fill="var(--color-pastel-kuning)" stroke-width="2.5" />
      <text x="237" y="27" fill="var(--color-teks-gelap)" stroke="none" font-weight="800" font-size="15">ΔU = Q − W</text>
    </g>

    <!-- Termometer -->
    <rect x="262" y="56" width="24" height="110" rx="12" fill="var(--color-surface)" />
    <rect x="270" y="92" width="8" height="80" rx="4" fill="var(--color-pastel-pink)" stroke="none" />
    <circle cx="274" cy="180" r="16" fill="var(--color-pastel-pink)" />
    <path d="M286 74 h8 M286 92 h6 M286 110 h8 M286 128 h6 M286 146 h8" stroke-width="2.5" />

    <!-- Butiran salju (suhu rendah) -->
    <g stroke="var(--color-pastel-biru)" stroke-width="3">
      <path d="M328 62 v28 M316 69 l24 14 M316 83 l24 -14" />
    </g>

    <!-- Roda gigi (mesin kalor) -->
    <g transform="translate(326 178)">
      <rect
        v-for="s in gigi"
        :key="s"
        x="-5"
        y="-27"
        width="10"
        height="12"
        rx="2"
        fill="var(--color-pastel-mint)"
        stroke-width="2.5"
        :transform="`rotate(${s})`"
      />
      <circle r="18" fill="var(--color-pastel-mint)" stroke-width="3" />
      <circle r="6" fill="var(--color-surface)" stroke-width="2.5" />
    </g>

    <!-- Kilau dekoratif -->
    <g stroke="var(--color-pastel-kuning)" stroke-width="3">
      <path d="M22 168 v16 M14 176 h16" />
      <path d="M126 14 v12 M120 20 h12" />
    </g>
    <g stroke="var(--color-pastel-lavender)" stroke-width="3">
      <path d="M60 196 v12 M54 202 h12" />
      <path d="M242 196 v12 M236 202 h12" />
    </g>
  </svg>
</template>
