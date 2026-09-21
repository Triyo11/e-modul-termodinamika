<script setup lang="ts">
import { RouterView } from "vue-router";
import Navbar from '@/components/Navbar.vue';
</script>

<template>
  <main class="mx-auto w-full lg:w-2/3">
    <RouterView />
    <Navbar />
  </main>
</template>
