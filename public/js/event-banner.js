document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('.event-banner').forEach(banner => {
    banner.addEventListener('click', () => {
      banner.classList.toggle('active');
    });
  });
});