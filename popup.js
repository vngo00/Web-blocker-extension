/***
 * Retrieve from local storage if there is a list of blocked sites 
 * is stored.
 */
document.addEventListener("DOMContentLoaded", async function () {
    const siteList = document.getElementById("siteList");
    const blockedSites = await getSites();
    console.log(blockedSites)

    function updateUI() {
        siteList.innerHTML = "";
        blockedSites.forEach((site, index) => {
            const li = document.createElement("li");
            li.textContent = site;
            const removeBtn = document.createElement("button");
            removeBtn.textContent = "Remove";
            removeBtn.onclick = function () {
                blockedSites.splice(index, 1);
                chrome.storage.sync.set({ blockedSites });
                updateRules(blockedSites);
                updateUI();
            };
            li.appendChild(removeBtn);
            siteList.appendChild(li);
        });
    }


    const addSite = () => {
    const siteInput = document.getElementById("siteInput").value.trim();
    console.log(siteInput);

    if (siteInput && !blockedSites.includes(siteInput)) {
        blockedSites.push(siteInput);
        chrome.storage.sync.set({ blockedSites });
        updateRules(blockedSites);
        updateUI();
    }
    };

    // Click event for the button
    document.getElementById("addSite").addEventListener("click", addSite);

    // Enter key support for the input field
    document.getElementById("siteInput").addEventListener("keydown", (event) => {
        if (event.key === "Enter") {
            addSite();
        }
    });

    updateUI();
});



/***********************
 * Storage Helpers
 ***********************/
/**
 * Get locally stored blocked url list
 * @returns array of blocked urls
 */
async function getSites() {
    const stored = await chrome.storage.sync.get("blockedSites");
    return stored.blockedSites || [];
}

/**
 * Set the blocked url list to local storage
 * @param {*} sites : list of blocked urls
 * @returns sites
 */
async function setSite(sites) {
    await chrome.storage.sync.set({ blockedSites : sites});
    return sites;
}



/***********************
 * Rule Management
 ***********************/
/**
 * when new block site is added to the list, remove old rules and add new ones
 * along with the newly added site.
 * @param {*} sites - list of urls that need to be blocked.
 */
async function updateRules(sites) {
    const rules = sites.map((site, index) => ({
    id: index + 1,
    priority: 1,
    action: { type: "redirect", redirect: { extensionPath: "/blocked.html" } },
    condition: { urlFilter: site, resourceTypes: ["main_frame"] }
  }));

    await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: Array.from({ length: 100 }, (_, i) => i + 1),
    addRules: rules
    });
}



// /***********************
//  * UI Management
//  ***********************/



// /***********************
//  * Initialization
//  ***********************/