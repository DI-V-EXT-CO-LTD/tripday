document.addEventListener('DOMContentLoaded', function() {
    const hotelGolfButton = document.querySelector('.category-button:nth-child(4)');
    if (hotelGolfButton) {
        hotelGolfButton.addEventListener('click', function(event) {
            event.preventDefault();
            const isLoggedIn = document.querySelector('.user-dropdown') !== null;
            if (isLoggedIn) {
                window.location.href = '/packageDetails';
            } else {
                alert('Login is required');
            }
        });
    }
});