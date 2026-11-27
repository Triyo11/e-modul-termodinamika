<script setup lang="ts">
import { ref } from "vue";
import { RouterView, useRoute, useRouter } from "vue-router";
import { PhHouse } from "@phosphor-icons/vue";
import LoadingScreen from '@/components/LoadingScreen.vue';

const router = useRouter();
const route = useRoute();

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
    <!-- Navbar bawah dihapus; halaman selain Beranda mendapat tombol kembali ke Beranda di atas. -->
    <div v-if="route.name && route.name !== 'home'" class="px-5 pt-5 sm:px-8 lg:px-12">
      <button
        type="button"
        class="inline-flex items-center gap-2 rounded-lg border-2 border-ink-300 px-3 py-1.5 text-sm font-semibold text-ink-800"
        @click="router.push({ name: 'home' })"
      >
        <PhHouse :size="16" weight="bold" /> Beranda
      </button>
    </div>
    <RouterView />
  </main>
</template>
