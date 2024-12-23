// Function to handle content switching for admin dashboard
function switchAdminContent(contentType, menuTitle) {
    // Update the page title
    const pageTitleElement = document.getElementById('pageTitle');
    if (pageTitleElement) {
        pageTitleElement.textContent = menuTitle;
    }

    // Update active menu item
    const menuItems = document.querySelectorAll('#sidebar .nav-link');
    menuItems.forEach(item => item.classList.remove('active'));
    const activeItem = document.querySelector(`#sidebar .nav-link[data-content="${contentType}"]`);
    if (activeItem) {
        activeItem.classList.add('active');
    }

    // Load the content
    loadContent(contentType);
}

// Function to handle menu toggle
function toggleAdminMenu() {
    const sidebar = document.getElementById('sidebar');
    const content = document.querySelector('main');
    if (sidebar && content) {
        sidebar.classList.toggle('active');
        content.classList.toggle('active');
    }
}

// Function to load content via AJAX
function loadContent(contentType) {
    const contentDiv = document.getElementById('content');
    fetch(`/admin/${contentType}`)
        .then(response => response.text())
        .then(html => {
            contentDiv.innerHTML = html;
        })
        .catch(error => {
            console.error('Error loading content:', error);
            contentDiv.innerHTML = '<p>Error loading content. Please try again.</p>';
        });
}

// Function to initialize the admin dashboard
function initAdminDashboard() {
    const menuItems = document.querySelectorAll('#sidebar .nav-link[data-content]');
    menuItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const contentType = this.getAttribute('data-content');
            const menuTitle = this.getAttribute('data-title');
            switchAdminContent(contentType, menuTitle);
        });
    });

    const menuToggle = document.getElementById('menu-toggle');
    if (menuToggle) {
        menuToggle.addEventListener('click', toggleAdminMenu);
    }

    // Initialize with the dashboard section
    switchAdminContent('dashboard', 'Dashboard');
}

// Run initialization when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', initAdminDashboard);

// Additional functions for specific admin tasks can be added here
// For example:

function handleUserManagement() {
    // Logic for user management
}

function handleBookingManagement() {
    // Logic for booking management
}

function handleHotelManagement() {
    // Logic for hotel management
}

function handleGolfCourseManagement() {
    // Logic for golf course management
}

function handleVoucherManagement() {
    // Logic for voucher management
}

function handleInvoiceManagement() {
    // Logic for invoice management
}

function handleCustomerService() {
    // Logic for customer service management
}

function handleNotices() {
    // Logic for notices management
}

function handleSalesManagement() {
    // Logic for sales management
}

// These functions can be called within the loaded content or set up with event listeners as needed