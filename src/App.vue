<script setup lang="ts">
import { ref } from "vue";
import { RouterView, useRouter } from "vue-router";
import Navbar from '@/components/Navbar.vue';
import LoadingScreen from '@/components/LoadingScreen.vue';

const router = useRouter();

// Layar muat tampil saat pertama kali dibuka dan saat pindah halaman.
// Penundaan 150 ms mencegah kedip bila halaman sudah ada di cache.
const memuat = ref(true);
let timer: ReturnType<typeof setTimeout> | undefined;

router.beforeEach(() => {
  clearTimeout(timer);
  timer = setTimeout(() => (memuat.value = true), 150);
});

const selesai = () => {
  clearTimeout(timer);
  memuat.value = false;
};
router.afterEach(selesai);
router.onError(selesai);
router.isReady().then(selesai, selesai);
</script>

<template>
  <main class="mx-auto w-full lg:w-2/3">
    <Transition
      leave-active-class="transition-opacity duration-200"
      leave-to-class="opacity-0"
    >
      <LoadingScreen v-if="memuat" />
    </Transition>
    <RouterView />
    <Navbar />
  </main>
</template>
