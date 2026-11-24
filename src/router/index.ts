import { createRouter, createWebHistory } from "vue-router";

const routes = [
  {
    path: "/",
    name: "home",
    component: () => import("../views/Home.vue"),
  },
  {
    // Isi Identitas dipindah ke menu profil; alamat lama dialihkan agar tautan lama tetap jalan.
    path: "/informasi-umum",
    redirect: { name: "profil" },
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
    // Peta konsep dipindah ke menu materi (di atas daftar KB); alamat lama dialihkan.
    path: "/peta-konsep",
    redirect: { name: "materi" },
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
    // /materi menampilkan pilihan kegiatan belajar; /materi/3 membuka KB 3.
    path: "/materi",
    name: "materi",
    component: () => import("../views/DaftarMateri.vue"),
  },
  {
    // /materi/3 = pengantar KB 3; /materi/3/inkuiri = halaman tahap inkuiri KB 3.
    path: "/materi/:kb(\\d+)/:tahap?",
    name: "materi-kb",
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
    component: () => import("../views/Profil.vue"),
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, _from, savedPosition) {
    // Halaman KB memulihkan posisi gulirnya sendiri (lihat Materi.vue).
    if (to.name === "materi-kb") return false;
    if (savedPosition) {
      return savedPosition;
    } else {
      return { top: 0, behavior: "smooth" };
    }
  },
});

export default router;
