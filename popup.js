/***********************
 * Popup Script for Blocker Extension
 * This script manages the UI and interactions for the popup of the blocker extension.
 * It allows users to add/remove sites from their blocklist or allowlist and toggle between modes.
 ***********************/


/***********************
 * Constants and Variables
 ***********************/

var blacklist = [];
var whitelist = []; 
var currentMode = "blacklist";




/***********************
 * Storage Helpers
 ***********************/
/**
 * Get locally stored blocked url list
 * @param {str} mode : blacklist || whitelist
 * @returns array of blocked urls
 */
// async function getSites(mode = "blacklist") {
//   mode = (mode === "blacklist") ? "blocklist" : "allowlist";
//   const stored = await chrome.storage.sync.get(mode);
//   return stored[mode] || [];
// }

function getSites(mode = "blacklist") {
  if (mode == "blacklist") {
    return blacklist;
  }
  return whitelist;
}
  
async function retrieveSites() {
  const stored = await chrome.storage.sync.get(["blocklist", "allowlist"]);
  blacklist = stored.blocklist || [];
  whitelist = stored.allowlist || [];

}

/**
 * Set the blocked url list to local storage
 * @param {*} sites : list of blocked urls
 * @param {str} mode : blacklist || whitelist
 * @returns sites
 */
async function setSite( mode = "blacklist") {
  mode = (mode == "blacklist") ? "blocklist" : "allowlist";
  let sites = (mode == "blacklist") ? blacklist : whitelist;
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
async function updateRules(mode = "blacklist") {
  let rules = [];
  let sites = [];
  if (mode === "blacklist"){
    sites = blacklist;
    rules = sites.map((site, index) => ({
    id: index + 1,
    priority: 1,
    action: { type: "redirect", redirect: { extensionPath: "/blocked.html" } },
    condition: { urlFilter: site, resourceTypes: ["main_frame"] }
  }));
  } else if (mode === "whitelist"){
    sites  = whitelist;
    rules.push({
      id: 1,
      priority:1,
      action: {type: "block"},
      condition: {urlFilter: "||", resourceTypes: ["main_frame"]},
    });

    sites.map((site, index) => {
      rules.push({
        id: index + 2,
        priority: 10,
        action: {type: "allow"},
        condition:{ urlFilter: "||" + site, resourceTypes: ["main_frame"]},
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
    //const mode = await chrome.storage.sync.get("mode");
    let mode = currentMode;
    console.log(mode.mode);
    const sites = getSites(mode);
    sites.forEach((site, index) => {
        const li = document.createElement("li");
        li.textContent = site;

        const removeBtn = document.createElement("button");
        removeBtn.textContent = "Remove";
        removeBtn.onclick = async () => {
            //const updatedSites = sites.filter((_, i) => i !== index); // what does this do ?

            await setSite(mode);
            await updateRules(mode);
            await renderSiteList();
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
    //const mode = await chrome.storage.sync.get("mode");
    let mode = currentMode; 
    let sites =  getSites(mode);
    if (!sites.includes(site)){
        sites.push(site);
        await setSite(sites, mode);
        await updateRules(sites, mode);
        await renderSiteList();
    }
}

/***
 * Switch between blacklist and whitelist mode
 */
async function toggleMode() {
  const modeBtn = document.getElementById("modeToggle");
  //const stored = await chrome.storage.sync.get("mode");
  let mode = currentMode;
  //let mode = stored.mode || "blacklist"
  mode = (mode == "blacklist") ? "whitelist" : "blacklist";
  if (mode == "blacklist") {
    console.log(blacklist)
  }
  else {
    console.log(whitelist);
  }
  currentMode = mode;
  await chrome.storage.sync.set({mode});
  modeBtn.textContent = mode
  const updatedSites =  getSites(mode);
  await renderSiteList();
  await updateRules(updatedSites, mode);
}

async function initModeButton() {
  const stored = await chrome.storage.sync.get("mode");
  const mode = stored.mode || "blacklist";
  currentMode = mode;
  const modeBtn = document.getElementById("modeToggle");
  modeBtn.textContent = mode.charAt(0).toUpperCase() + mode.slice(1);
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
  await initModeButton();
  await renderSiteList();
  await retrieveSites();
});