/**
* Template Name: Mentor
* Template URL: https://bootstrapmade.com/mentor-free-education-bootstrap-theme/
* Updated: Aug 07 2024 with Bootstrap v5.3.3
* Author: BootstrapMade.com
* License: https://bootstrapmade.com/license/
*/

(function() {
  "use strict";

  /**
   * Apply .scrolled class to the body as the page is scrolled down
   */
  function toggleScrolled() {
    const selectBody = document.querySelector('body');
    const selectHeader = document.querySelector('#header');
    if (!selectHeader.classList.contains('scroll-up-sticky') && !selectHeader.classList.contains('sticky-top') && !selectHeader.classList.contains('fixed-top')) return;
    window.scrollY > 100 ? selectBody.classList.add('scrolled') : selectBody.classList.remove('scrolled');
  }

  document.addEventListener('scroll', toggleScrolled);
  window.addEventListener('load', toggleScrolled);

  /**
   * Mobile nav toggle
   */
  const mobileNavToggleBtn = document.querySelector('.mobile-nav-toggle');

  function mobileNavToogle() {
    document.querySelector('body').classList.toggle('mobile-nav-active');
    mobileNavToggleBtn.classList.toggle('bi-list');
    mobileNavToggleBtn.classList.toggle('bi-x');
  }
  mobileNavToggleBtn.addEventListener('click', mobileNavToogle);

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (document.querySelector('.mobile-nav-active')) {
        mobileNavToogle();
      }
    });

  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
   * Preloader
   */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
      preloader.remove();
    });
  }

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  scrollTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', aosInit);

  /**
   * Initiate glightbox
   */
  const glightbox = GLightbox({
    selector: '.glightbox'
  });

  /**
   * Initiate Pure Counter
   */
  new PureCounter();

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );

      if (swiperElement.classList.contains("swiper-tab")) {
        initSwiperWithCustomPagination(swiperElement, config);
      } else {
        new Swiper(swiperElement, config);
      }
    });
  }

  window.addEventListener("load", initSwiper);

})();



function login() {
  const err = document.getElementById("loginError");
  if (err) {
    err.textContent = "This page is not used for sign-in. Use the main website login.";
    err.style.display = "block";
  }
}

function logout() {
  document.getElementById('dashboardPage').style.display = 'none';
  document.querySelector('.login-container').style.display = 'block';

  // Reset input fields
  document.querySelector('.username').value = '';
  document.querySelector('.password').value = '';
  document.getElementById('loginError').style.display = 'none';
}

// ✅ Show/Hide password toggle
function togglePassword() {
  const passwordInput = document.querySelector('.password');
  const toggleBtn = document.getElementById('togglePassword');

  if (passwordInput.type === 'password') {
    passwordInput.type = 'text';
    toggleBtn.textContent = '🙈 Hide';
  } else {
    passwordInput.type = 'password';
    toggleBtn.textContent = '👁️ Show';
  }
}



// FIX ACTIVE LINKS IN SUBFOLDERS
document.querySelectorAll('#navmenu a').forEach(link => {
  let linkHref = link.getAttribute("href");

  // Ignore external links
  if (!linkHref || linkHref.startsWith("http")) return;

  // Compare using full URL instead of pathname
  if (window.location.href.includes(linkHref)) {
    link.classList.add("active");
  }
});
document.addEventListener('DOMContentLoaded', function () {

  const nav = document.getElementById('navmenu');
  if (!nav) return;

  const toggle = nav.querySelector('.mobile-nav-toggle');
  const menuLinks = nav.querySelector('.menu-links');
  const mobileCloseContainer = nav.querySelector('.mobile-close'); // <li>
  const mobileCloseIcon = mobileCloseContainer ? mobileCloseContainer.querySelector('i') : null;

  if (!toggle || !menuLinks) return;

  // ICON HELPERS
  function setHamburgerIcon() {
    toggle.classList.remove('bi-x');
    toggle.classList.add('bi-list');
  }

  function setCloseIcon() {
    toggle.classList.remove('bi-list');
    toggle.classList.add('bi-x');
  }

  // NAV OPEN/CLOSE
  function openNav() {
    nav.classList.add('nav-open');
    setCloseIcon();
  }

  function closeNav() {
    nav.classList.remove('nav-open');
    setHamburgerIcon();
    nav.querySelectorAll('.menu-links .dropdown.open')
       .forEach(d => d.classList.remove('open'));
  }

  // HAMBURGER CLICK
  toggle.addEventListener('click', function (e) {
    e.stopPropagation();
    if (nav.classList.contains('nav-open')) closeNav();
    else openNav();
  });

  // MOBILE CLOSE (X) BUTTON — FIXED WITH SAFETY CHECK
  if (mobileCloseContainer) {
    mobileCloseContainer.addEventListener('click', function (e) {
      e.stopPropagation();
      closeNav();
    });
  }

  if (mobileCloseIcon) {
    mobileCloseIcon.addEventListener('click', function (e) {
      e.stopPropagation();
      closeNav();
    });
  }

  // CLICK OUTSIDE CLOSE
  document.addEventListener('click', function (e) {
    if (!nav.classList.contains('nav-open')) return;
    if (!nav.contains(e.target)) closeNav();
  });

  // ESC CLOSE
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeNav();
  });

  // DROPDOWN ACCORDION
  function bindDropdowns() {
    const anchors = nav.querySelectorAll('.menu-links .dropdown > a');
    anchors.forEach(anchor => {
      if (anchor.dataset.mobileBound === '1') return;
      anchor.dataset.mobileBound = '1';

      anchor.addEventListener('click', function (ev) {
        if (window.innerWidth <= 1199) {
          ev.preventDefault();
          anchor.parentElement.classList.toggle('open');
        }
      });
    });
  }

  bindDropdowns();

  // RESIZE BEHAVIOR
  window.addEventListener('resize', function () {
    if (window.innerWidth >= 1200 && nav.classList.contains('nav-open')) {
      closeNav();
    }
    bindDropdowns();
  });

  // START WITH HAMBURGER
  setHamburgerIcon();

});

document.addEventListener("DOMContentLoaded", function() {
    let slides = document.querySelectorAll(".slide");
    let index = 0;

    if(slides.length > 0){
        slides[index].classList.add("active");

        setInterval(()=>{
            slides[index].classList.remove("active");
            index = (index+1) % slides.length;
            slides[index].classList.add("active");
        },4000);
    }
});





  