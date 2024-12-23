document.addEventListener('DOMContentLoaded', function() {
  const cardPaymentRadio = document.getElementById('card-payment');
  const confirmPaymentBtn = document.getElementById('confirm-payment');
  let nationalIdUpload, nationalIdFile;

  function createNationalIdUpload() {
    const uploadDiv = document.createElement('div');
    uploadDiv.id = 'national-id-upload';
    uploadDiv.style.display = 'none';
    uploadDiv.innerHTML = `
      <p>For secure payment and KYC purposes, please upload your National Identification.</p>
      <input type="file" id="national-id-file" accept="image/*,.pdf">
    `;
    
    const paymentModal = document.querySelector('#payment-modal .modal-content');
    paymentModal.insertBefore(uploadDiv, paymentModal.querySelector('.modal-buttons'));

    nationalIdUpload = uploadDiv;
    nationalIdFile = uploadDiv.querySelector('#national-id-file');
  }

  createNationalIdUpload();

  cardPaymentRadio.addEventListener('change', function() {
    if (this.checked) {
      nationalIdUpload.style.display = 'block';
    } else {
      nationalIdUpload.style.display = 'none';
    }
  });

  const originalConfirmPayment = window.confirmPayment;
  window.confirmPayment = function() {
    const selectedPaymentMethod = document.querySelector('input[name="payment-method"]:checked');

    if (selectedPaymentMethod && selectedPaymentMethod.value === 'credit_card') {
      if (!nationalIdFile.files.length) {
        alert('Please upload your National Identification before proceeding with credit card payment.');
        return;
      }

      const formData = new FormData();
      formData.append('nationalId', nationalIdFile.files[0]);

      fetch('/upload-national-id', {
        method: 'POST',
        body: formData
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          originalConfirmPayment();
        } else {
          alert('Failed to upload National Identification. Please try again.');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        alert('An error occurred while uploading the National Identification. Please try again.');
      });
    } else {
      originalConfirmPayment();
    }
  };

  confirmPaymentBtn.addEventListener('click', window.confirmPayment);
});