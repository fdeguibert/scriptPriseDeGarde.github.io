const allButtonsRow = document.querySelector('div.row:nth-child(2)');

const vehicleChiefModalButtonId = 'vehicle-chief-modal-button-id';

let VehicleChiefButton = document.createElement('div');
VehicleChiefButton.id = vehicleChiefModalButtonId
VehicleChiefButton.innerHTML = '<a class="modal btn btn-default" title="Saisie garde remise" href="plugins/MainCourantePlugin/jsp/modal-saisie-evenement-manuel.jsp?codeCentre=CHE">' +
    '<img src="https://cdn-icons-png.flaticon.com/512/63/63939.png" width="30" height="30"/>' +
    ' Saisie garde remise' +
    '</a>'
VehicleChiefButton.className = 'col-md-3 col-xs-12'
if (!document.getElementById(vehicleChiefModalButtonId)) {
    allButtonsRow.append(VehicleChiefButton)
}

VehicleChiefButton.onclick = () => {

    loader();

    function loader() {
        const divTitle = document.querySelector('div[id="modalLabel"]')
        const intituleArea = document.querySelector('input[name="intitule"]');
        const textArea = document.querySelector('textarea[name="detail"]');
        if (divTitle != null && textArea != null && intituleArea != null && divTitle.offsetParent != null && intituleArea.offsetParent != null && textArea.offsetParent != null) {
            const modalFooter = document.querySelector('.modal-footer');
            const sendButton = modalFooter.querySelector('.btn-primary')
            sendButton.value = 'Envoyer';

            divTitle.innerHTML = "Saisie d'une Signature Garde Remise"
            intituleArea.value = 'Signature Garde Remise'
            textArea.textContent = "Vérifications effectuées: XXXXXX\n" +
                "A faire: XXXXX\n" +
                "Bref contenu à définir."

        } else {
            setTimeout(loader, 15);
        }
    }
}