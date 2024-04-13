<script lang="ts">
  import { onMount } from "svelte";

  function applyDarkMode() {
    const isDarkMode = localStorage.getItem("darkMode") == "1";
    if (!isDarkMode) {
      document.adoptedStyleSheets = [];
      return;
    }

    const stylesheet = new CSSStyleSheet();
    stylesheet.replaceSync("html, img, video, iframe { filter: invert(1) }");
    document.adoptedStyleSheets = [stylesheet];
  }
  function toggleDarkMode() {
    localStorage.setItem(
      "darkMode",
      `${1 - parseInt(localStorage.getItem("darkMode") ?? "0")}`
    );
    applyDarkMode();
  }

  onMount(applyDarkMode);
</script>

<button class="btn" on:click={toggleDarkMode}> Toggle dark mode </button>
