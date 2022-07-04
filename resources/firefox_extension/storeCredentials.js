

function openPage() {
    alert('coucou')
    console.log("test")
}

browser.browserAction.onClicked.addListener(openPage);

// TODO autoriser le refus de cette extension (mais ça demandera a se log pour accéder à Agendis)
function storeToLocalStorage(userLogin, userPassword){
    browser.storage.local.set({userLogin:userLogin, userPassword:userPassword})
    const gettingStoredCredents = browser.storage.local.get();
    //TODO temp to show how to retrieve datas from storage
    gettingStoredCredents.then(storageContent => console.log(storageContent.userLogin))
    gettingStoredCredents.then(storageContent => console.log(storageContent.userPassword))

}

function extractCredentials(requestDetails) {
    console.log("Loading: " + requestDetails.url);
    const formData = requestDetails.requestBody.formData;
    const userOperation = formData.JCMS_opLogin[0];
    const userLogin = formData.JCMS_login[0];
    const userPassword = formData.JCMS_password[0];

    if (userOperation === "S'identifier"){
        storeToLocalStorage(userLogin, userPassword);
    }
}


browser.webRequest.onBeforeRequest.addListener(
    extractCredentials,
    {urls: ["*://*.portail.sdis78.fr/front/privateLogin.jsp"]},
    ["requestBody"],
);
