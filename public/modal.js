const modalDiv = document.getElementById("modal")
function openModal(html) {
    modalDiv.innerHTML = html;
    [...document.getElementsByClassName('window')].forEach((window) => window.classList.add("disabled-window"))
}
function closeModal() {
    modalDiv.innerHTML = "";
    [...document.getElementsByClassName('window')].forEach((window) => window.classList.remove("disabled-window"))
}