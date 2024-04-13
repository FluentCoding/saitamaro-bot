<script lang="ts">
  import type { Guide, Rune } from "../../../src/features/store/guides";

  export let guide: Guide;

  let swapperoo = 0;
  const runes = [
    ["DEMOLISH", "FONT OF LIFE", "SHIELD BASH"],
    ["CONDITIONING", "SECOND WIND", "BONE PLATING"],
    ["OVERGROWTH", "REVITALIZE", "UNFLINCHING"],
  ] as Rune[][];

  function humanReadableRune(rune: Rune) {
    return rune
      .split(" ")
      .map((word) => `${word[0].toUpperCase()}${word.slice(1).toLowerCase()}`)
      .join(" ");
  }

  function onRuneClick(row: number, rune: Rune) {
    const activeRunes = guide.image.runes;
    // check if another rune is already active in the same row
    for (let i = 0; i < 2; i++) {
      const activeRune = activeRunes[i];
      const activeRow = runes.findIndex((runeRow) =>
        runeRow.includes(activeRune)
      );
      if (row == activeRow) {
        guide.image.runes[i] = rune;
        return;
      }
    }
    guide.image.runes[(swapperoo = 1 - swapperoo)] = rune;
  }
</script>

{#each runes as runeRow, row}
  <div>
    {#each runeRow as rune}
      <button
        style="text-transform: capitalize;"
        class="btn rune {guide.image.runes.includes(rune) && 'active'}"
        on:click={() => onRuneClick(row, rune)}
        >{humanReadableRune(rune)}</button
      >
    {/each}
  </div>
{/each}
