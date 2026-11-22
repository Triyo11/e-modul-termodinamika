<script setup lang="ts">
import GambarBlok from "./GambarBlok.vue";
import VideoBlok from "./VideoBlok.vue";
import TeksBlok from "./TeksBlok.vue";
import IsianBlok from "./IsianBlok.vue";
import TabelBlok from "./TabelBlok.vue";
import CalloutBlok from "./CalloutBlok.vue";
import SimulasiBlok from "./SimulasiBlok.vue";
import RumusBlok from "./RumusBlok.vue";
import ContohBlok from "./ContohBlok.vue";
import KuisBlok from "./KuisBlok.vue";
import Animasi from "./Animasi.vue";
import KebutuhanInformasiBlok from "./KebutuhanInformasiBlok.vue";
import TabelIsianBlok from "./TabelIsianBlok.vue";
import TautanSumberBlok from "./TautanSumberBlok.vue";
import KlaimUjiBlok from "./KlaimUjiBlok.vue";
import TugasRancanganBlok from "./TugasRancanganBlok.vue";
import TugasRancanganLanjutanBlok from "./TugasRancanganLanjutanBlok.vue";
import GrafikDataBlok from "./GrafikDataBlok.vue";
import RefleksiBlok from "./RefleksiBlok.vue";
import RubrikBlok from "./RubrikBlok.vue";
import DiagramPVBlok from "./DiagramPVBlok.vue";
import WidgetCarnotBlok from "./WidgetCarnotBlok.vue";
import type { Blok } from "@/types/kegiatan";

defineProps<{ blok: Blok; kegiatanId: string; nomorWorksheet?: string }>();
</script>

<template>
  <!-- Tanpa nomor worksheet, pembungkus memakai display: contents agar tata letak blok tidak berubah. -->
  <div
    :class="nomorWorksheet ? 'flex flex-col gap-2' : 'contents'"
    :role="nomorWorksheet ? 'group' : undefined"
    :aria-label="nomorWorksheet ? `Student e-Worksheet ${nomorWorksheet}` : undefined"
  >
    <p v-if="nomorWorksheet" aria-hidden="true" class="self-start rounded-full bg-accent-2 px-2.5 py-0.5 text-xs font-semibold text-brand-dark">
      Student e-Worksheet {{ nomorWorksheet }}
    </p>
    <GambarBlok v-if="blok.tipe === 'gambar'" :blok="blok" />
    <VideoBlok v-else-if="blok.tipe === 'video'" :blok="blok" />
    <TeksBlok v-else-if="blok.tipe === 'teks'" :blok="blok" />
    <IsianBlok v-else-if="blok.tipe === 'isian'" :blok="blok" :kegiatan-id="kegiatanId" />
    <TabelBlok v-else-if="blok.tipe === 'tabel'" :blok="blok" :kegiatan-id="kegiatanId" />
    <CalloutBlok v-else-if="blok.tipe === 'callout'" :blok="blok" />
    <SimulasiBlok v-else-if="blok.tipe === 'simulasi'" :blok="blok" />
    <RumusBlok v-else-if="blok.tipe === 'rumus'" :blok="blok" />
    <ContohBlok v-else-if="blok.tipe === 'contoh'" :blok="blok" />
    <KuisBlok v-else-if="blok.tipe === 'kuis'" :blok="blok" :kegiatan-id="kegiatanId" />
    <Animasi v-else-if="blok.tipe === 'animasi'" :blok="blok" />
    <KebutuhanInformasiBlok v-else-if="blok.tipe === 'kebutuhan-informasi'" :blok="blok" :kegiatan-id="kegiatanId" />
    <TabelIsianBlok v-else-if="blok.tipe === 'tabel-isian'" :blok="blok" :kegiatan-id="kegiatanId" />
    <TautanSumberBlok v-else-if="blok.tipe === 'tautan-sumber'" :blok="blok" />
    <KlaimUjiBlok v-else-if="blok.tipe === 'klaim-uji'" :blok="blok" :kegiatan-id="kegiatanId" />
    <TugasRancanganBlok v-else-if="blok.tipe === 'tugas-rancangan'" :blok="blok" :kegiatan-id="kegiatanId" />
    <TugasRancanganLanjutanBlok
      v-else-if="blok.tipe === 'tugas-rancangan-lanjutan'"
      :blok="blok"
      :kegiatan-id="kegiatanId"
    />
    <GrafikDataBlok v-else-if="blok.tipe === 'grafik-data'" :blok="blok" :kegiatan-id="kegiatanId" />
    <RefleksiBlok v-else-if="blok.tipe === 'refleksi'" :blok="blok" :kegiatan-id="kegiatanId" />
    <RubrikBlok v-else-if="blok.tipe === 'rubrik'" :blok="blok" />
    <DiagramPVBlok v-else-if="blok.tipe === 'diagram-pv'" :blok="blok" :kegiatan-id="kegiatanId" />
    <WidgetCarnotBlok v-else-if="blok.tipe === 'widget-carnot'" :blok="blok" />
  </div>
</template>
