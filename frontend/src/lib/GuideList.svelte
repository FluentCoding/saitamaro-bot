<script lang="ts">
  import { onMount } from "svelte";
  import { client } from "../client";
  import { rerenderGuideList } from "../store";

  let selection: string | undefined;
  export let updateSelectedGuide: (guide: string) => void;

  let guides: Awaited<ReturnType<typeof client.guide.all.get>>["data"];
  onMount(async () => {
    guides = (await client.guide.all.get()).data;
  });
  rerenderGuideList.subscribe(async (value) => {
    if (value) {
      guides = (await client.guide.all.get()).data;
      if (guides?.every((guide) => selection !== guide.name))
        selection = undefined;
      rerenderGuideList.set(false);
    }
  });
</script>

{#if guides}
  {#each guides ?? [] as guide, index}
    <div class="field-row">
      <input
        checked={guide.name == selection}
        id="guide{index}"
        type="radio"
        on:click={() => {
          selection = guide.name;
          updateSelectedGuide(guide.name);
        }}
      />
      <label style="width: 100%" for="guide{index}"
        >{guide.name}
        <b style="float: right">
          ({#if guide.public}PUBLIC{:else}PRIVATE{/if}) [SZN
          <span style="color: tomato">{guide.season}</span>]
        </b></label
      >
    </div>
  {/each}
{/if}
