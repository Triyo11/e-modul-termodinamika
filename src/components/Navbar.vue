<script setup lang="ts">
import ButtonNavbar from '@/components/micro/ButtonNavbar.vue';
</script>

<template>
  <nav
    class="fixed bottom-0 inset-x-0 z-20 mx-auto w-full lg:w-2/3 bg-white border-t border-ink-200 pb-[env(safe-area-inset-bottom)]"
  >
    <!-- 4 tab, tiap tombol min-h-[44px] -->
    <div class="flex justify-center items-center">
      <ButtonNavbar namebutton="beranda" pathbutton="home" />
      <ButtonNavbar namebutton="materi" pathbutton="materi" />
      <ButtonNavbar namebutton="kuis" pathbutton="kuis" />
      <ButtonNavbar namebutton="profil" pathbutton="profil" />
    </div>
  </nav>
</template>
