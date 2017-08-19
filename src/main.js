import Vue from "vue";
import ToggleButton from "vue-js-toggle-button";

import App from "./App.vue";

import "./css/bootstrap.css";

Vue.use(ToggleButton);

new Vue({
  el: "#app",
  render: h => h(App)
});
