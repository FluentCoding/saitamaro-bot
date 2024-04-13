<script lang="ts">
  import type { Guide } from "../../../src/features/store/guides";
  import { client } from "../client";
  import { selectedGuide, triggerRerenderGuideList } from "../store";
  import { preferredOrder } from "../util/order";
  import Runes from "./Runes.svelte";

  const tabs = ["Image", "Text"] as const;

  let currentTab: (typeof tabs)[number] = "Image";
  let currentPage = 0;

  let saveDisabled: boolean = false;

  let champion: string | undefined;
  let guide: Guide | undefined | null;
  let guideImageSrc: string | undefined;

  $: if ($selectedGuide) {
    champion = $selectedGuide;
    client
      .guide({ champion })
      .get()
      .then((v) => (guide = v.data));
    renderImage();
    currentPage = 0;
  }

  function newPage() {
    if (!guide) return;

    const pageLen = Object.keys(guide.contents).length;
    let suffix = -1;
    while (true) {
      const name = `Page ${pageLen + 1}${suffix == -1 ? "" : ` (${suffix})`}`;
      if (guide.contents[name] !== undefined) {
        suffix++;
      } else {
        guide.contents[name] = "";
        break;
      }
    }
  }
  function movePage(delta: number) {
    if (!guide) return;
    const currentOrder = Object.keys(guide.contents);
    const next =
      (currentPage + delta + currentOrder.length) % currentOrder.length;
    [currentOrder[currentPage], currentOrder[next]] = [
      currentOrder[next],
      currentOrder[currentPage],
    ];
    guide.contents = preferredOrder(guide.contents, currentOrder);
    currentPage = next;
  }
  function renamePage() {
    if (!guide) return;

    const oldPage = Object.keys(guide.contents)[currentPage];
    // removing non-ascii characters, 40 characters max
    const newPage = prompt("Enter new page name")
      ?.replace(/[^\x00-\x7F]/g, "")
      .substring(0, 40);
    if (newPage === undefined) return;

    if (newPage.length < 3 || newPage.length > 25) {
      alert("The new name is only allowed to be 3-25 characters long.");
      return;
    }
    if (guide.contents[newPage] !== undefined) {
      alert("Page already exists! Aborting.");
      return;
    }

    delete Object.assign(guide.contents, {
      [newPage]: guide.contents[oldPage],
    })[oldPage];
    let currentOrder = Object.keys(guide.contents);
    currentOrder = [
      ...currentOrder.slice(0, currentPage),
      newPage,
      ...currentOrder.slice(currentPage, currentOrder.length - 1),
    ];
    guide.contents = preferredOrder(guide.contents, currentOrder);
  }
  function deletePage() {
    if (!guide) return;
    delete guide.contents[Object.keys(guide.contents)[currentPage]];
    if (currentPage >= Object.keys(guide.contents).length) currentPage--;
    guide.contents = guide.contents; // trigger rerender manually
  }
  async function removeGuide() {
    if (
      !champion ||
      !confirm(`Are you sure you want to delete the ${champion} guide?`)
    )
      return;
    await client.guide.remove({ champion }).get();
    guide = undefined;
    triggerRerenderGuideList();
  }
  async function toggleVisibility() {
    if (!champion) return;
    guide!.public = !guide!.public;
    await client.guide.visibility({ champion }).post({ public: guide!.public });
    triggerRerenderGuideList();
  }
  async function saveGuide() {
    if (!guide || !champion) return;
    saveDisabled = true;

    await client.guide.save({ champion }).post(guide);
    currentTab == "Image" && (await renderImage());
    saveDisabled = false;
    console.info("Saved!");
  }
  async function renderImage() {
    if (!champion) return;
    guideImageSrc = await client.guide
      .image({ champion })
      .get()
      .then((v) => new Blob([v.data!]))
      .then(
        (blob) =>
          new Promise((callback) => {
            let reader = new FileReader();
            reader.onload = function () {
              callback(this.result as string);
            };
            reader.readAsDataURL(blob);
          })
      );
  }
</script>

{#if !guide}
  <div class="title-bar">
    <h1 class="title">No guide selected</h1>
  </div>
{:else}
  <div class="title-bar">
    <h1 class="title">{champion}</h1>
  </div>
  <div class="separator"></div>
  <div class="modeless-dialog">
    <ul role="menubar" class="!mb-2">
      {#each tabs as tab}
        <button
          class="btn spaced {currentTab == tab && 'active'}"
          on:click={() => (currentTab = tab)}>{tab}</button
        >
      {/each}
    </ul>
    {#if currentTab == "Image"}
      <div class="rowLayout">
        <div>
          <section class="field-row">
            <span class="modeless-text image-prop-label">Starter item:</span>
            <select bind:value={guide.image.starter} class="pl-1">
              <option value="dblade">Doran's Blade</option>
              <option value="dshield">Doran's Shield</option>
            </select>
          </section>
          <section class="field-row">
            <span class="modeless-text image-prop-label">Difficulty:</span>
            <select bind:value={guide.image.difficulty} class="pl-1">
              <option value={1}>Very easy</option>
              <option value={2}>Easy</option>
              <option value={3}>Moderate</option>
              <option value={4}>Hard</option>
              <option value={5}>Very hard</option>
            </select>
          </section>
          <section class="field-row">
            <span class="modeless-text image-prop-label">Runes:</span>
            <div><Runes {guide} /></div>
          </section>
          <section class="field-row">
            <label for="optional_text" class="modeless-text image-prop-label"
              >Optional text:</label
            >
            <input
              id="optional_text"
              type="text"
              class="w-full"
              placeholder=""
              maxlength="48"
              bind:value={guide.image.smallText}
            />
          </section>
          <section class="field-row">
            <label for="primary_rune" class="modeless-text image-prop-label"
              >Primary rune | example: <i>fleet,conq,lt</i></label
            >
            <input
              id="primary_rune"
              type="text"
              class="w-full"
              placeholder=""
              maxlength="48"
              bind:value={guide.image.primaryRune}
            />
          </section>
          <section class="field-row">
            <label for="sums" class="modeless-text image-prop-label"
              >Summoners | example:
              <i>flash,tp | flash,exhaust</i></label
            >
            <input
              id="sums"
              type="text"
              class="w-full"
              placeholder=""
              maxlength="48"
              bind:value={guide.image.sums}
            />
          </section>
        </div>
        <div class="window m-0 ml-5 mb-5">
          <div class="title-bar">
            <h1 class="title">Preview</h1>
          </div>
          <div id="img-container" class="w-[482px] h-[284px]">
            {#if guideImageSrc}
              <img width="482" alt={`${champion} image`} src={guideImageSrc} />
            {/if}
          </div>
        </div>
      </div>
    {:else}
      <div class="rowLayout">
        <!-- svelte-ignore a11y-unknown-role -->
        <ul role="menu-bar" class="flex-col w-[200px]">
          {#each Object.keys(guide.contents) as key, pageIndex}
            <button
              class="btn spaced page {currentPage == pageIndex && 'active'}"
              on:click={() => (currentPage = pageIndex)}>{key}</button
            >
          {/each}
          <div class="mt-1 mb-1" />
          <button class="btn spaced page" on:click={() => movePage(-1)}
            >Move up</button
          >
          <button class="btn spaced page" on:click={() => movePage(1)}
            >Move down</button
          >
          <div class="mt-1 mb-1" />
          <button
            class="btn spaced page"
            on:click={newPage}
            disabled={Object.keys(guide.contents).length == 4}>New page</button
          >
          <button id="rename-page" class="btn spaced page" on:click={renamePage}
            >Rename page</button
          >
          <button
            class="btn spaced page"
            disabled={Object.keys(guide.contents).length == 1}
            on:click={deletePage}>Delete page</button
          >
        </ul>
        <textarea
          spellcheck="false"
          maxlength="1992"
          class="w-full min-h-[400px] resize-none text-sm font-[monospace] leading-4 p-1 border-2 border-black rounded-sm"
          bind:value={guide.contents[Object.keys(guide.contents)[currentPage]]}
        ></textarea>
      </div>
      <div class="mt-1 mb-1" />
    {/if}
    <section class="field-row justify-end">
      <button class="btn" on:click={toggleVisibility}>
        {#if guide.public}Public{:else}Private{/if}
      </button>
      <button class="btn" on:click={removeGuide}>Remove guide</button>
      <button class="btn" on:click={saveGuide} disabled={saveDisabled}
        >Save</button
      >
    </section>
  </div>
{/if}
