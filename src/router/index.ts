import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "home",
    component: () => import("../views/Home.vue"),
  },
  {
    path: "/informasi-umum",
    name: "informasi-umum",
    component: () => import("../views/Pendahuluan/InformasiUmum.vue"),
  },
  {
    path: "/capaian-pembelajaran",
    name: "capaian-pembelajaran",
    component: () => import("../views/Pendahuluan/CapaianPembelajaran.vue"),
  },
  {
    path: "/tujuan-pembelajaran",
    name: "tujuan-pembelajaran",
    component: () => import("../views/Pendahuluan/TujuanPembelajaran.vue"),
  },
  {
    path: "/peta-konsep",
    name: "peta-konsep",
    component: () => import("../views/Pendahuluan/PetaKonsep.vue"),
  },
  {
    path: "/prasyarat",
    name: "prasyarat",
    component: () => import("../views/Home.vue"),
  },
  {
    path: "/petunjuk-penggunaan",
    name: "petunjuk-penggunaan",
    component: () => import("../views/Home.vue"),
  },
  {
    path: "/materi",
    name: "materi",
    component: () => import("../views/Materi.vue"),
  },
  {
    path: "/kuis",
    name: "kuis",
    component: () => import("../views/Home.vue"),
  },
  {
    path: "/profil",
    name: "profil",
    component: () => import("../views/Home.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(_to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0, behavior: "smooth" };
    }
  },
});

export default router;
