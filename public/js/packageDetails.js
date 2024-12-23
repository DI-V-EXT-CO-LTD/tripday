// public/js/packageDetails.js

document.addEventListener('DOMContentLoaded', () => {
    const reserveButton = document.getElementById('reservePackageBtn');
    
    
    if (reserveButton) {
        reserveButton.addEventListener('click', () => {
            const packageId = reserveButton.getAttribute('data-package-id');
            const packagePrice = reserveButton.getAttribute('data-package-price');
            const checkIn = document.getElementById('check-in').value;
            const checkOut = document.getElementById('check-out').value;
            const nights = document.getElementById('nights').value;
            const quantity = document.getElementById('quantity').value;
            
            if (!checkIn || !checkOut) {
                alert('Please select check-in and check-out dates before reserving a package.');
                return;
            }
            
            addPackageToCart(packageId, packagePrice, checkIn, checkOut, nights, quantity);
        });
    }

   
});

function addPackageToCart(packageId, packagePrice, checkIn, checkOut, nights, quantity) {
    console.log('===============================addToCart function called');
    fetch('/cart/addPackage', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            packageId: packageId,
            packagePrice: packagePrice,
            checkIn: checkIn,
            checkOut: checkOut,
            nights: nights,
            quantity: quantity
        }),
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            if (confirm('Package added to cart successfully! Do you want to view your cart?')) {
                window.location.href = '/dashboard#cart';
            }
            // You can update the UI here to reflect the change, e.g., update a cart icon
        } else {
            alert(data.message || 'Failed to add package to cart. Please try again.');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('An error occurred while adding the package to the cart. Please check the console for more details and try again.');
    });
}

function proceedToPayment() {
    console.log('proceedToPayment function called');
    
    // Retrieve cart information
    fetch('/cart/info', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
        },
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(cartInfo => {
        console.log('Cart info received:', cartInfo);

        // Get the selected payment method
        const paymentMethod = document.querySelector('input[name="paymentMethod"]:checked').value;
        console.log('Selected payment method:', paymentMethod);

        const requestBody = {
            packageName: cartInfo.packageName,
            checkIn: cartInfo.checkIn,
            checkOut: cartInfo.checkOut,
            nights: cartInfo.nights,
            quantity: cartInfo.quantity,
            amount: cartInfo.totalPrice,
            paymentMethod: paymentMethod,
            cartItemId: cartInfo.cartItemId
        };

        console.log('Request body for purchase creation:', requestBody);

        // Create a new purchase
        return fetch('/booking/createPackage', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        console.log('Purchase creation response:', data);
        if (data.success) {
            alert('Purchase created successfully! Redirecting to payment page...');
            window.location.href = '/payment/' + data.purchaseId;
        } else {
            alert(data.message || 'Failed to create purchase. Please try again.');
        }
    })
    .catch((error) => {
        console.error('Error:', error);
        alert('An error occurred while processing your payment. Please check the console for more details and try again.');
    });
}