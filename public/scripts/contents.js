// public/scripts/contents.js
let slideIndex = 0;
const banners = document.querySelectorAll('.banner-wrapper img');
const totalSlides = banners.length;
const maxVisibleSlides = 3;

function applyPadding() {
    banners.forEach((banner, index) => {
        banner.style.paddingLeft = '8px';
        banner.style.paddingRight = '8px';
    });

    // 현재 보여지는 슬라이드에 따라 패딩 조정
    const firstVisibleSlide = slideIndex;
    const lastVisibleSlide = slideIndex + maxVisibleSlides - 1;

    if (banners[firstVisibleSlide]) {
        banners[firstVisibleSlide].style.paddingLeft = '0';
    }
    if (banners[lastVisibleSlide]) {
        banners[lastVisibleSlide].style.paddingRight = '0';
    }
}

function showSlide(index) {
    const wrapper = document.querySelector('.banner-wrapper');
    let newTranslateX = -index * 392; // 376px is the width of each banner

    // 마지막 슬라이드 이후 처음 슬라이드로 돌아가기 위해 인덱스 조정
    if (index > totalSlides - maxVisibleSlides) {
        slideIndex = 0;
        newTranslateX = 0;
    }

    wrapper.style.transform = `translateX(${newTranslateX}px)`;
    applyPadding(); // 슬라이드를 이동할 때마다 패딩 적용
}

function nextSlide() {
    slideIndex++;
    showSlide(slideIndex);
    applyPadding();
}

function prevSlide() {
    slideIndex--;
    if (slideIndex < 0) {
        slideIndex = totalSlides - maxVisibleSlides;
    }
    showSlide(slideIndex);
    applyPadding();
}

function autoSlide() {
    nextSlide();
    setTimeout(autoSlide, 5000); // 5초마다 자동으로 다음 슬라이드로 이동
    applyPadding();
}

document.addEventListener('DOMContentLoaded', () => {
    showSlide(slideIndex);
    setTimeout(autoSlide, 5000);
});
