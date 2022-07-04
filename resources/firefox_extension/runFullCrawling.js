
function openPage() {

    browser.tabs.executeScript({file: "/fullCrawling.js"})

}

browser.pageAction.onClicked.addListener(openPage);
