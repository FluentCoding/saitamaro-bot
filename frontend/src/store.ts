import { writable } from "svelte/store";

export const selectedGuide = writable<string | undefined>();
export const rerenderGuideList = writable<boolean>(false);
export const triggerRerenderGuideList = () => rerenderGuideList.set(true);

type Modal = "new_game" | undefined;
export const modal = writable<Modal | undefined>();
export const openModal = (m: Modal) => modal.set(m);
export const closeModal = () => modal.set(undefined);
