document.addEventListener('DOMContentLoaded', () => {
  const forms = document.querySelectorAll('form[id^="voucherForm"]');

  forms.forEach(form => {
    const startDateInput = form.querySelector('.start-date');
    const endDateInput = form.querySelector('.end-date');

    if (startDateInput && endDateInput) {
      // Set minimum date for start date to today
      const today = new Date().toISOString().split('T')[0];
      startDateInput.min = today;

      // Set minimum date for end date to today
      endDateInput.min = today;

      // Update end date min date when start date changes
      startDateInput.addEventListener('change', (e) => {
        const selectedDate = new Date(e.target.value);
        endDateInput.min = e.target.value;

        // If end date is before new min, update it
        if (new Date(endDateInput.value) < selectedDate) {
          endDateInput.value = e.target.value;
        }
      });
    }
  });
});