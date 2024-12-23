// public/scripts/index.js
document.addEventListener("DOMContentLoaded", function() {
    const scrollToTopBtn = document.getElementById("scrollToTopBtn");
    const signInRegisterBtn = document.getElementById("signInRegisterBtn");
    const registerPopup = document.getElementById("registerPopup");
    const closeBtn = document.querySelector(".popup-content .close");
    const checkin = document.getElementById("checkin");
    const checkout = document.getElementById("checkout");
    const nights = document.querySelector(".nightsdisplayer");
    const roomsGuestsDisplay = document.getElementById("rooms-guests-display");
    const dropdownContent = document.querySelector(".dropdown-content");

    signInRegisterBtn.addEventListener("click", function() {
        registerPopup.style.display = "block";
    });
    //위에서 can not read property 'addEventListener' of null 에러가 뜨는 이유는 해당 id를 찾지 못해서 발생하는 에러이다.
    //따라서 해당 id를 찾을 수 있도록 코드를 수정해주어야 한다.
    

    closeBtn.addEventListener("click", function() {
        registerPopup.style.display = "none";
    });

    window.addEventListener("click", function(event) {
        if (event.target === registerPopup) {
            registerPopup.style.display = "none";
        }
    });

    flatpickr(checkin, {
        dateFormat: "D, M j",
        defaultDate: "today",
        onChange: function(selectedDates, dateStr, instance) {
            const checkinDate = selectedDates[0];
            checkout.flatpickr({
                dateFormat: "D, M j",
                defaultDate: new Date(checkinDate.getTime() + 24 * 60 * 60 * 1000),
                minDate: new Date(checkinDate.getTime() + 24 * 60 * 60 * 1000)
            });
            calculateNights();
        }
    });

    flatpickr(checkout, {
        dateFormat: "D, M j",
        defaultDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        minDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
        onChange: calculateNights
    });

    window.addEventListener("scroll", function() {
        if (window.scrollY > 200) {
            scrollToTopBtn.style.display = "block";
        } else {
            scrollToTopBtn.style.display = "none";
        }
    });

    scrollToTopBtn.addEventListener("click", function() {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    function calculateNights() {
        if (checkin.value && checkout.value) {
            const checkinDate = new Date(checkin.value);
            const checkoutDate = new Date(checkout.value);
            const diffTime = Math.abs(checkoutDate - checkinDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            nights.textContent = `${diffDays} nights`;
        } else {
            nights.textContent = `1 night`;
        }
    }

    window.changeValue = function(id, delta) {
        const element = document.getElementById(id);
        let value = parseInt(element.textContent);
        value = Math.max(0, value + delta);
        element.textContent = value;
        updateRoomsGuestsDisplay();
    };

    function updateRoomsGuestsDisplay() {
        const rooms = document.getElementById("rooms").textContent;
        const adults = document.getElementById("adults").textContent;
        const children = document.getElementById("children").textContent;
        roomsGuestsDisplay.textContent = `${rooms} Room${rooms > 1 ? 's' : ''}, ${adults} Adult${adults > 1 ? 's' : ''}, ${children} Child${children > 1 ? 'ren' : ''}`;
    }

    document.querySelector(".dropbtn").addEventListener("click", function() {
        dropdownContent.style.display = dropdownContent.style.display === "block" ? "none" : "block";
    });

    document.addEventListener("click", function(event) {
        if (!event.target.closest(".rooms-and-guests-box")) {
            dropdownContent.style.display = "none";
        }
    });

    const authForm = document.getElementById("authForm");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const authButton = document.getElementById("authButton");
    const popupTitle = document.getElementById("popupTitle");

    authForm.addEventListener("submit", function(event) {
        event.preventDefault(); // 기본 폼 제출 중지
        console.log('폼 제출 이벤트 발생');

        const email = emailInput.value;
        const password = passwordInput.value;

        console.log('입력된 이메일:', email);

        // 서버에 이메일 존재 여부 확인 요청
        fetch(`/check-email?email=${email}`)
            .then(response => response.json())
            .then(data => {
                console.log('서버 응답 데이터:', data);
                if (data.exists) {
                    // 이메일이 존재할 경우 로그인 절차로 전환
                    passwordInput.style.display = 'block';
                    popupTitle.textContent = 'Sign In';
                    authButton.textContent = 'Sign In';
                    authForm.setAttribute('action', '/login');
                } else {
                    // 이메일이 없을 경우 회원가입 절차로 전환
                    passwordInput.style.display = 'block';
                    popupTitle.textContent = 'Register';
                    authButton.textContent = 'Register';
                    authForm.setAttribute('action', '/register');
                }
                authForm.submit(); // 폼 강제 제출
            })
            .catch(error => {
                console.error('서버 요청 오류:', error);
            });
    });
});
