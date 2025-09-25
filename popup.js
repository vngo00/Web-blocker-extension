
/***********************
 * Storage Helpers
 ***********************/
/**
 * Get locally stored blocked url list
 * @param {str} mode : blacklist || whitelist
 * @returns array of blocked urls
 */
async function getSites(mode = "blacklist") {
  mode = (mode === "blacklist") ? "blocklist" : "allowlist";
  const stored = await chrome.storage.sync.get(mode);
  return stored[mode] || [];
}

/**
 * Set the blocked url list to local storage
 * @param {*} sites : list of blocked urls
 * @param {str} mode : blacklist || whitelist
 * @returns sites
 */
async function setSite(sites, mode = "blacklist") {
  mode = (mode === "blacklist") ? "blocklist" : "allowlist";
  await chrome.storage.sync.set({[mode] : sites});
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
async function updateRules(sites, mode = "blacklist") {
  let rules = [];
  if (mode === "blacklist"){
    rules = sites.map((site, index) => ({
    id: index + 1,
    priority: 1,
    action: { type: "redirect", redirect: { extensionPath: "/blocked.html" } },
    condition: { urlFilter: site, resourceTypes: ["main_frame"] }
  }));
  } else if (mode === "whitelist"){
    rules.push({
      id: 1,
      priority:1,
      action: {type: "block"},
      condition: {urlFilter: "*", resourceTypes: ["main_frame"]},
    });

    sites.map((site, index) => {
      rules.push({
        id: index + 2,
        priority: 2,
        action: {type: "allow"},
        condition:{ urlFilter: site, resourceTypes: ["main_frame"]},
      });
    });
  }

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: Array.from({ length: 100 }, (_, i) => i + 1),
    addRules: rules
    });
}



/***********************
 * UI Management
 ***********************/
async function renderSiteList() {
    const siteList = document.getElementById("siteList");
    siteList.innerHTML ="";
    const mode = await chrome.storage.sync.get("mode");
    console.log(mode.mode);
    const sites = await getSites(mode.mode);
    sites.forEach((site, index) => {
        const li = document.createElement("li");
        li.textContent = site;

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove";
        removeBtn.onclick = async () => {
            const updatedSites = sites.filter((_, i) => i !== index);
            await setSite(updatedSites, mode.mode);
            await updateRules(updatedSites, mode.mode);
            renderSiteList();
        };

        li.appendChild(removeBtn);
        siteList.appendChild(li);
    });
}

/**
 * add site to blocked site list
 * @returns 
 */
async function addSite() {
    const site = document.getElementById("siteInput").value.trim();
    if (!site) return;
    console.log("better get here");
    const mode = await chrome.storage.sync.get("mode");
    const sites = await getSites(mode.mode);
    if (!sites.includes(site)){
        sites.push(site);
        await setSite(sites, mode.mode);
        await updateRules(sites, mode.mode);
        renderSiteList();
    }
}

/***
 * Switch between blacklist and whitelist mode
 */
async function toggleMode() {
  const modeBtn = document.getElementById("modeToggle");
  const stored = await chrome.storage.sync.get("mode");
  let mode = stored.mode || "blacklist"
  mode = (mode === "blacklist") ? "whitelist" : "blacklist";
  await chrome.storage.sync.set({mode});
  modeBtn.textContent = mode
}

function bindUIEvents() {
  document.getElementById("addSite").addEventListener("click", addSite);
  document.getElementById("siteInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") addSite();
  });
  document.getElementById("modeToggle").addEventListener("click", toggleMode);
  
}


/***********************
 * Initialization
 ***********************/

document.addEventListener("DOMContentLoaded", async () => {
  bindUIEvents();
  renderSiteList();
});