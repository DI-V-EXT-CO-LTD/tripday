// cart.js

document.addEventListener('DOMContentLoaded', () => {
  // Add event listeners to all "Reserve" buttons
  const reserveButtons = document.querySelectorAll('.reserve-btn');
  reserveButtons.forEach(button => {
    button.addEventListener('click', addToCart);
  });

  // Function to add item to cart
  function addToCart(event) {
    const button = event.target;
    const roomId = button.getAttribute('data-room-id');
    const roomTitle = button.getAttribute('data-room-title');
    const roomPrice = button.getAttribute('data-room-price');

    // Send POST request to add item to cart
    fetch('/add-to-cart', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ roomId, roomTitle, roomPrice }),
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('Room added to cart successfully!');
        updateCartUI();
      } else {
        alert('Failed to add room to cart. Please try again.');
      }
    })
    .catch((error) => {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    });
  }

  // Function to update cart UI
  function updateCartUI() {
    // You can implement this function to update any cart-related UI elements
    // For example, updating a cart icon with the number of items in the cart
    fetch('/get-cart')
      .then(response => response.json())
      .then(data => {
        const cartItemCount = document.getElementById('cart-item-count');
        if (cartItemCount) {
          cartItemCount.textContent = data.itemCount;
        }
      })
      .catch((error) => {
        console.error('Error updating cart UI:', error);
      });
  }

  // Initial update of cart UI
  updateCartUI();
});