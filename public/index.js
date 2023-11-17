const templates = Object.fromEntries([
    'guide-option-template',
    'guide-content-init-template',
    'guide-content-template',
    'create-guide-template'
].map((id) => [id, Handlebars.compile(document.getElementById(id).innerHTML)]))

Handlebars.registerHelper('escape', function(variable) {
    return variable.replace(/(['"])/g, '\\$1');
});

const guidesDiv = document.getElementById("guides")
const guideContentDiv = document.getElementById("guide-content")
let currentGuideView = undefined
let swapperoo = 0

async function guides() {
    const guides = await (await fetch("/guides")).json()
    guidesDiv.innerHTML = guides.reduce((a, v, i) => a + templates['guide-option-template']({ index: i, guide: v }), "")
    if (currentGuideView) {
        document.getElementById(`guide${guides.findIndex((g) => g == currentGuideView.guide.name)}`).checked = true
    }
}

async function newGuide() {
    openModal(templates['create-guide-template']({ champs: await (await fetch('/riot/open-champs')).json() }))
    canCreateGuide()
}

function newPage() {
    const pageLen = Object.keys(currentGuideView.guide.contents).length
    let suffix = -1
    while(true) {
        const name = `Page ${pageLen + 1}${suffix == -1 ? "" : ` (${suffix})`}`
        if (currentGuideView.guide.contents[name] !== undefined) {
            suffix++
        } else {
            currentGuideView.guide.contents[name] = ""
            break
        }
    }
    storeGuideValues() && renderGuide(currentGuideView.guide.name, 'contents', pageLen)
}

function removePage() {
    delete currentGuideView.guide.contents[Object.keys(currentGuideView.guide.contents)[currentGuideView.pageTab]]
    if (currentGuideView.pageTab >= Object.keys(currentGuideView.guide.contents).length) currentGuideView.pageTab--
    renderGuide(currentGuideView.guide.name, 'contents', currentGuideView.pageTab)
}

function _preferredOrder(obj, order) {
    var newObject = {}
    for(var i = 0; i < order.length; i++) {
        if(obj.hasOwnProperty(order[i])) {
            newObject[order[i]] = obj[order[i]]
        }
    }
    return newObject
}

function renamePage() {
    storeGuideValues()

    const oldPage = Object.keys(currentGuideView.guide.contents)[currentGuideView.pageTab]
    // removing non-ascii characters, 40 characters max
    const newPage = prompt("Enter new page name").replace(/[^\x00-\x7F]/g, "").substring(0, 40)

    if (newPage.length < 3) {
        alert("Too short! 3 characters or more.")
        return
    }
    if (currentGuideView.guide.contents[newPage] !== undefined) {
        alert("Page already exists! Aborting.")
        return
    }
    
    delete Object.assign(currentGuideView.guide.contents, {[newPage]: currentGuideView.guide.contents[oldPage]})[oldPage]
    let currentOrder = Object.keys(currentGuideView.guide.contents)
    currentOrder = [...currentOrder.slice(0, currentGuideView.pageTab), newPage, ...currentOrder.slice(currentGuideView.pageTab, currentOrder.length - 1)]
    currentGuideView.guide.contents = _preferredOrder(currentGuideView.guide.contents, currentOrder)

    renderGuide(currentGuideView.guide.name, 'contents', currentGuideView.pageTab)
}

function movePage(d) {
    storeGuideValues()

    let currentOrder = Object.keys(currentGuideView.guide.contents)
    const currentTab = currentGuideView.pageTab
    const next = (currentGuideView.pageTab + d + currentOrder.length) % currentOrder.length;
    [currentOrder[currentTab], currentOrder[next]] = [currentOrder[next], currentOrder[currentTab]]
    currentGuideView.guide.contents = _preferredOrder(currentGuideView.guide.contents, currentOrder)
    currentGuideView.pageTab = next

    renderGuide(currentGuideView.guide.name, 'contents', currentGuideView.pageTab)
}

function resetGuideView() {
    guideContentDiv.innerHTML = templates['guide-content-init-template']()
}

async function renderImage() {
    if (!currentGuideView.isPropertiesTab) return
    function urlContentToDataUri(url){
        return fetch(url)
            .then(response => response.blob())
            .then(blob => new Promise(callback => {
                let reader = new FileReader()
                reader.onload = function(){callback(this.result)}
                reader.readAsDataURL(blob)
            }))
    }
    const imgContainer = document.getElementById("img-container")
    imgContainer.innerHTML = ""
    const imgEl = document.createElement("img")
    imgEl.src = await urlContentToDataUri(`/guide/image/${currentGuideView.guide.name}`)
    imgEl.width = 482
    imgEl.onload = () => {
        imgContainer.style.height = `${imgEl.clientHeight}px`
    }
    imgContainer.appendChild(imgEl)
}

async function renderGuide(champion, tab = 'properties', pageTab = 0) {
    const guide = currentGuideView?.guide?.name == champion ? currentGuideView.guide : await (await fetch(`/guide/${champion}`)).json()
    currentGuideView = { guide, isPropertiesTab: tab == 'properties', pageTab }
    guideContentDiv.innerHTML = templates['guide-content-template'](currentGuideView)
    document.getElementById("guide-tabs").childNodes.forEach((child) => {
        if (child.id == tab) return
        child.onclick = () => storeGuideValues() && renderGuide(champion, child.id)
    })
    document.querySelector(`#guide-tabs > #${tab}`).classList.add("active")
    // set values
    if (currentGuideView.isPropertiesTab) {
        document.getElementById(guide.image.starter).setAttribute("selected", true)
        document.getElementById(`diff-${guide.image.difficulty}`).setAttribute("selected", true)
        guide.image.runes.forEach((v) => document.getElementById(v).classList.add("active"))
        document.querySelectorAll('.rune').forEach((runeBtn, i) => {
            runeBtn.onclick = () => {
                if (runeBtn.classList.contains("active")) return
                const row = Math.floor(i / 3)
                const rowDiv = [...document.getElementById(`rune-select`).children[row].children]
                let active = rowDiv.find(btn => btn.classList.contains("active"))
                if (active) {
                    active.classList.remove("active")
                } else {
                    const other = [...document.getElementsByClassName("rune")].findIndex((e) => e.classList.contains("active"))
                    const otherRow = Math.floor(other / 3)
                    document.querySelectorAll('.rune.active')[swapperoo].classList.remove("active")
                    if (otherRow < row) swapperoo = 1 - swapperoo
                }
                runeBtn.classList.add("active")
            }
        })
        await renderImage()
    } else {
        document.getElementsByClassName("page")[pageTab].classList.add("active");
        [...document.getElementsByClassName("page")].forEach((child, i) => {
            if (i == pageTab) return
            child.onclick = () => storeGuideValues() && renderGuide(champion, tab, i)
        })
        document.getElementById("page-text").value = Object.values(guide.contents)[pageTab]
        Object.keys(guide.contents).length == 4 && document.getElementById("new-page").setAttribute("disabled", true)
        Object.keys(guide.contents).length == 1 && document.getElementById("delete-page").setAttribute("disabled", true)
    }
}

function storeGuideValues() {
    if (!currentGuideView) return

    if (currentGuideView.isPropertiesTab) {
        const starterOptions = document.getElementById("starter")
        currentGuideView.guide.image.starter = starterOptions[starterOptions.selectedIndex].id
        currentGuideView.guide.image.difficulty = document.getElementById("difficulty").selectedIndex + 1
        currentGuideView.guide.image.smallText = document.getElementById("optional_text").value
        currentGuideView.guide.image.runes = [...document.querySelectorAll('.rune.active')].map((e) => e.id)
    } else {
        currentGuideView.guide.contents[Object.keys(currentGuideView.guide.contents)[currentGuideView.pageTab]] = document.getElementById("page-text").value
        // todo
    }
    console.log("Updated:", currentGuideView.guide)
    return true
}

async function removeGuide() {
    await fetch(`/guide/remove/${currentGuideView.guide.name}`)
    currentGuideView = undefined
    await guides()
    resetGuideView()
}

async function saveGuide() {
    if (!currentGuideView) return
    storeGuideValues()

    await fetch(`/guide/save/${currentGuideView.guide.name}`, {
        method: 'POST',
        body: JSON.stringify(currentGuideView.guide)
    })
    await renderImage()
    console.log("Saved!")
}

async function canCreateGuide() {
    const el = document.getElementById("new-champ")
    const okBtn = document.getElementById("create-guide-btn")
    const list = [...document.getElementById("champs").children].map((c) => c.value)
    const disabled = !list.includes(el.value)
    disabled ? okBtn.setAttribute("disabled", true) : okBtn.removeAttribute("disabled")
    okBtn.onclick = disabled ? null : createGuide
}

async function createGuide() {
    const res = await fetch(`/guide/new/${document.getElementById("new-champ").value}`)
    if (res.status == 500) {
        alert()
        return
    }
    await guides()
    closeModal()
}

guides()