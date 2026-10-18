import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./router";
import { hapusJawabanKb3Lama } from "./lib/jawabanTersimpan";

hapusJawabanKb3Lama();

createApp(App)
    .use(router)
    .mount("#app");
