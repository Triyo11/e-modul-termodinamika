<script setup lang="ts">
import GambarBlok from "./GambarBlok.vue";
import TeksBlok from "./TeksBlok.vue";
import IsianBlok from "./IsianBlok.vue";
import TabelBlok from "./TabelBlok.vue";
import CalloutBlok from "./CalloutBlok.vue";
import SimulasiBlok from "./SimulasiBlok.vue";
import RumusBlok from "./RumusBlok.vue";
import ContohBlok from "./ContohBlok.vue";
import KuisBlok from "./KuisBlok.vue";
import Animasi from "./Animasi.vue";
import type { Blok } from "@/types/kegiatan";

defineProps<{ blok: Blok; kegiatanId: string }>();
</script>

<template>
  <GambarBlok v-if="blok.tipe === 'gambar'" :blok="blok" />
  <TeksBlok v-else-if="blok.tipe === 'teks'" :blok="blok" />
  <IsianBlok v-else-if="blok.tipe === 'isian'" :blok="blok" :kegiatan-id="kegiatanId" />
  <TabelBlok v-else-if="blok.tipe === 'tabel'" :blok="blok" />
  <CalloutBlok v-else-if="blok.tipe === 'callout'" :blok="blok" />
  <SimulasiBlok v-else-if="blok.tipe === 'simulasi'" :blok="blok" />
  <RumusBlok v-else-if="blok.tipe === 'rumus'" :blok="blok" />
  <ContohBlok v-else-if="blok.tipe === 'contoh'" :blok="blok" />
  <KuisBlok v-else-if="blok.tipe === 'kuis'" :blok="blok" :kegiatan-id="kegiatanId" />
  <Animasi v-else-if="blok.tipe === 'animasi'" :blok="blok" />
</template>
