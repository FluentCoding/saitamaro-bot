<script lang="ts">
  import { client } from "../client";
  import { closeModal, triggerRerenderGuideList } from "../store";

  let disabled = false;
  let champion: string | undefined;
  async function createGuide() {
    if (!champion) return;
    disabled = true;
    await client.guide.new({ champion }).get();
    triggerRerenderGuideList();
    closeModal();
  }
</script>

<div class="modal-dialog outer-border w-[20rem]">
  <div class="inner-border center">
    <div class="modal-contents">
      <h1 class="modal-text mb-2">Create new guide</h1>
      <div class="field-row">
        <label
          >Select champ: <input
            bind:value={champion}
            list="champs"
            name="champ"
            autocomplete="off"
          /></label
        >
        <datalist id="champs">
          {#await client.riot["open-champs"].get() then champs}
            {#each champs.data ?? [] as champ}
              <option value={champ}></option>{/each}
          {/await}
        </datalist>
      </div>
      <section class="field-row justify-end">
        <button class="btn" on:click={closeModal}>Cancel</button>
        <button
          class="btn w-[95px]"
          id="create-guide-btn"
          on:click={createGuide}
          disabled={!champion || disabled}>OK</button
        >
      </section>
    </div>
  </div>
</div>
