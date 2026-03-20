// Meta Pixel fallback: ensure PageView is tracked on pages that don't embed inline pixel code
(function () {
    if (window.fbq) return;

    var pixelId = '2521676828246674';
    !function (f, b, e, v, n, t, s) {
        if (f.fbq) return;
        n = f.fbq = function () {
            n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
        };
        if (!f._fbq) f._fbq = n;
        n.push = n;
        n.loaded = !0;
        n.version = '2.0';
        n.queue = [];
        t = b.createElement(e);
        t.async = !0;
        t.src = v;
        s = b.getElementsByTagName(e)[0];
        s.parentNode.insertBefore(t, s);
    }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');

    fbq('init', pixelId);
    fbq('track', 'PageView');
})();

(function ($) {
    "use strict";

    // Spinner
    var spinner = function () {
        setTimeout(function () {
            if ($('#spinner').length > 0) {
                $('#spinner').removeClass('show');
            }
        }, 1);
    };
    spinner();
    
    
    // Initiate the wowjs
    if (typeof WOW !== 'undefined') {
        new WOW().init();
    }


    // Sticky Navbar - modificar la función existente
    $(window).scroll(function () {
        if ($(window).width() > 767) {
            // Comportamiento original solo para desktop
            if ($(this).scrollTop() > 300) {
                $('.sticky-top').addClass('shadow-sm').css('top', '0px');
            } else {
                $('.sticky-top').removeClass('shadow-sm').css('top', '-100px');
            }
        } else {
            // Comportamiento simplificado para móviles
            if ($(this).scrollTop() > 50) {
                $('.sticky-top').addClass('shadow-sm');
            } else {
                $('.sticky-top').removeClass('shadow-sm');
            }
        }
    });
    
    
    // Back to top button
    $(window).scroll(function () {
        if ($(this).scrollTop() > 300) {
            $('.back-to-top').fadeIn('slow');
        } else {
            $('.back-to-top').fadeOut('slow');
        }
    });
    $('.back-to-top').click(function () {
        if ($.easing && $.easing.easeInOutExpo) {
            $('html, body').animate({ scrollTop: 0 }, 1500, 'easeInOutExpo');
        } else {
            $('html, body').animate({ scrollTop: 0 }, 1500);
        }
        return false;
    });


    // Facts counter
    if ($.fn.counterUp) {
        $('[data-toggle="counter-up"]').counterUp({
            delay: 10,
            time: 2000
        });
    }


    // Date and time picker
    if ($.fn.datetimepicker) {
        $('.date').datetimepicker({
            format: 'L'
        });
        $('.time').datetimepicker({
            format: 'LT'
        });
    }


    // Header carousel
    if ($.fn.owlCarousel) {
        $(".header-carousel").owlCarousel({
            autoplay: true,
            smartSpeed: 1500,
            loop: true,
            nav: false,
            dots: true,
            items: 1,
            dotsData: true,
        });
    }


    // Testimonials carousel
    if ($.fn.owlCarousel) {
        $('.testimonial-carousel').owlCarousel({
            autoplay: true,
            smartSpeed: 1000,
            loop: true,
            nav: false,
            dots: true,
            items: 1,
            dotsData: true,
        });
    }

    
})(jQuery);

// Add this to your main.js file or include inline
document.addEventListener('DOMContentLoaded', function() {
    // Add click event listeners to all flip buttons
    const flipButtons = document.querySelectorAll('.btn-flip');
    flipButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const card = this.closest('.news-card');
            card.classList.add('flipped');
        });
    });

    // Add click event listeners to all back buttons
    const flipBackButtons = document.querySelectorAll('.btn-flip-back');
    flipBackButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            const card = this.closest('.news-card');
            card.classList.remove('flipped');
        });
    });
});
