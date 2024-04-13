<script lang="ts">
  import DarkModeButton from "./lib/DarkModeButton.svelte";
  import GuideList from "./lib/GuideList.svelte";
  import GuideView from "./lib/GuideView.svelte";
  import NewGameModal from "./lib/NewGameModal.svelte";
  import { modal, openModal, selectedGuide } from "./store";
</script>

<div
  id="modal"
  class="absolute z-10 left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
>
  {#key $modal}
    {#if $modal == "new_game"}
      <NewGameModal />
    {/if}
  {/key}
</div>
<div class="rowLayout">
  <div class="w-[25rem]">
    <div class="window">
      <div class="title-bar">
        <h1 class="title">Guides</h1>
      </div>
      <div class="separator"></div>
      <div class="modeless-dialog">
        <GuideList updateSelectedGuide={(guide) => selectedGuide.set(guide)} />
        <section class="field-row justify-end mt-3">
          <button class="btn" on:click={() => openModal("new_game")}
            >New guide</button
          >
        </section>
      </div>
    </div>
  </div>
  <div class="window w-[70rem]">
    <GuideView />
  </div>
  <div class="window">
    <div class="title-bar">
      <h1 class="title">Settings</h1>
    </div>
    <div class="separator"></div>
    <div class="modeless-dialog">
      <DarkModeButton />
    </div>
  </div>
</div>
