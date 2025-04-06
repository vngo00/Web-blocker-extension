// Load blocked sites on popup open
document.addEventListener("DOMContentLoaded", async function () {
    const siteList = document.getElementById("siteList");
    const storedSites = await chrome.storage.sync.get("blockedSites");
    const blockedSites = storedSites.blockedSites || [];

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
                updateRules();
                updateUI();
            };
            li.appendChild(removeBtn);
            siteList.appendChild(li);
        });
    }

    document.getElementById("addSite").addEventListener("click", () => {
        const siteInput = document.getElementById("siteInput").value.trim();
        
        if (siteInput && !blockedSites.includes(siteInput)) {
            blockedSites.push(siteInput);
            chrome.storage.sync.set({ blockedSites });
            updateRules();
            updateUI();
        }
    });

    updateUI();
});

// Update extension rules
async function updateRules() {
    const storedSites = await chrome.storage.sync.get("blockedSites");
    const blockedSites = storedSites.blockedSites || [];

    const rules = blockedSites.map((site, index) => ({
        id: index + 1,
        priority: 1,
        action: { type: "redirect", redirect: { extensionPath: "/blocked.html" } },
        condition: { urlFilter: site, resourceTypes: ["main_frame"] }
    }));

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: Array.from({ length: 100 }, (_, i) => i + 1), // Clear old rules
        addRules: rules
    });
}
