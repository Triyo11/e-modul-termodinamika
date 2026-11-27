import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import { hapusJawabanKb3Lama } from "./lib/jawabanTersimpan";
import { pasangEfekTekan } from "./lib/efekTekan";

hapusJawabanKb3Lama();
// Dipasang sebelum App dibuat agar jeda tekan berjalan sebelum penjaga layar muat di App.vue.
pasangEfekTekan(router);

createApp(App)
    .use(router)
    .mount("#app");
