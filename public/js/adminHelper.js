$(document).ready(function() {
    // Function to show content and update page title
    function showContent(contentId, title) {
        // Hide all content sections
        $('.content-section').hide();
        // Show the selected content section
        $(`#${contentId}-content`).show();
        // Update the page title
        $('#pageTitle').text(title);
    }

    // Event listener for admin menu items
    $('.nav-link').on('click', function(e) {
        e.preventDefault();
        var $this = $(this);
        var contentId = $this.attr('id').replace('Btn', '');
        var title = $this.text().trim();

        showContent(contentId, title);

        // Remove active class from all nav links
        $('.nav-link').removeClass('active');
        // Add active class to the clicked nav link
        $this.addClass('active');

        // Ensure the Users button works correctly
        if (contentId === 'users') {
            $('#users-content').show();
        }
    });

    // Handle browser back/forward buttons
    $(window).on('popstate', function() {
        var path = window.location.pathname;
        var contentId = path.split('/').pop() || 'dashboard';
        var title = $(`#${contentId}Btn`).text().trim() || 'Admin Dashboard';

        showContent(contentId, title);
    });

    // Show initial content based on current URL
    var initialPath = window.location.pathname;
    var initialContentId = initialPath.split('/').pop() || 'dashboard';
    var initialTitle = $(`#${initialContentId}Btn`).text().trim() || 'Admin Dashboard';
    showContent(initialContentId, initialTitle);

    // Handle hotel tabs
    $('#hotelTabs a').on('click', function(e) {
        e.preventDefault();
        $(this).tab('show');
    });

    // Function to handle AJAX errors
    function handleAjaxError(jqXHR, textStatus, errorThrown) {
        if (jqXHR.status === 403) {
            var response = JSON.parse(jqXHR.responseText);
            alert(response.message);
            window.location.href = '/'; // Redirect to index page
        } else {
            console.error('Error:', textStatus, errorThrown);
        }
    }

    // Add this to all AJAX requests
    $.ajaxSetup({
        error: handleAjaxError
    });
});