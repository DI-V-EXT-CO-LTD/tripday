console.log('Admin users script loaded');

document.addEventListener('DOMContentLoaded', function() {
  try {
    console.log('DOM fully loaded and parsed');
    
    const passwordButtons = document.querySelectorAll('.user-reset-password-btn');
    const passwordPopup = document.getElementById('passwordPopup');
    const closeBtn = document.querySelector('.close-btn');
    let currentUserEmail = '';

    console.log('Number of password buttons found:', passwordButtons.length);

    passwordButtons.forEach(button => {
      button.addEventListener('click', function(event) {
        event.preventDefault();
        console.log('Password button clicked');
        currentUserEmail = this.getAttribute('data-email');
        console.log('Current user email:', currentUserEmail);
        passwordPopup.style.display = 'flex';
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener('click', function() {
        console.log('Close button clicked');
        passwordPopup.style.display = 'none';
      });
    } else {
      console.error('Close button not found');
    }

    window.addEventListener('click', function(event) {
      if (event.target === passwordPopup) {
        console.log('Clicked outside the popup');
        passwordPopup.style.display = 'none';
      }
    });

    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
      passwordForm.addEventListener('submit', function(event) {
        event.preventDefault();
        console.log('Password form submitted');
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
          alert('Passwords do not match!');
          return;
        }

        // 비밀번호 변경 요청 보내기
        fetch('/admin/change-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: currentUserEmail,
            newPassword: newPassword
          })
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            alert('Password changed successfully');
            passwordPopup.style.display = 'none';
          } else {
            alert('Failed to change password: ' + data.message);
          }
        })
        .catch(error => {
          console.error('Error:', error);
          alert('An error occurred while changing the password');
        });
      });
    } else {
      console.error('Password form not found');
    }
  } catch (error) {
    console.error('An error occurred in the admin-users script:', error);
  }
});