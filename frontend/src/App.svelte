<script lang="ts">
  import DarkModeButton from "./lib/DarkModeButton.svelte";
  import GuideList from "./lib/GuideList.svelte";
  import GuideView from "./lib/GuideView.svelte";
  import NewGameModal from "./lib/NewGameModal.svelte";
  import { modal, openModal, selectedGuide } from "./store";
</script>

<div
  id="modal"
  style="
        position: absolute;
        z-index: 1;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
      "
>
  {#key $modal}
    {#if $modal == "new_game"}
      <NewGameModal />
    {/if}
  {/key}
</div>
<div class="rowLayout">
  <div>
    <div class="window" style="width: 30rem">
      <div class="title-bar">
        <h1 class="title">Guides</h1>
      </div>
      <div class="separator"></div>
      <div class="modeless-dialog">
        <div style="justify-content: flex-start">
          <GuideList
            updateSelectedGuide={(guide) => selectedGuide.set(guide)}
          />
        </div>
        <section
          class="field-row"
          style="justify-content: flex-end; margin-top: 10px"
        >
          <button class="btn" on:click={() => openModal("new_game")}
            >New guide</button
          >
        </section>
      </div>
    </div>
    <div class="window" style="width: 30rem">
      <div class="title-bar">
        <h1 class="title">Settings</h1>
      </div>
      <div class="separator"></div>
      <div class="modeless-dialog">
        <DarkModeButton />
      </div>
    </div>
  </div>
  <div class="window" style="width: 70rem" id="guide-content">
    <GuideView />
  </div>
</div>
