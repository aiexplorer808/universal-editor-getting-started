/**
 * @file
 * Theme javascript.
 */

(function($) {

    /* global mejs */
    'use strict';
    $(document).ready(
        function() {
            initTray();
            initScrollUpdate();
            initTrayScroll();
        }
    );

    // isi tray behaviour.
    function initTray() {
        var isiContainer = $('.jsIsiContainer');
        var isiBtnMinimize = $('.jsIsiMinimize');
        var isiSwapText = $('.jsSwapText');
        setInterval(
            function() {
                initTrayScroll();
            }, 250
        );
        isiBtnMinimize.on(
            'click',
            function() {
                isiContainer.toggleClass('opened isi-drawer-expanded isi-drawer-collapsed');
                isiSwapText.toggleClass('hide');

                /*
                        if (isiContainer.hasClass('opened isi-drawer-expanded')) {
                            isiSwapText.text(isiSwapTextCollapse);
                        } else {
                            isiSwapText.text(isiSwapTextExpand);
                        }
                */
            }
        );

    }

    function initScrollUpdate() {
        var $window = $(window);
        var isiSection;
        if (window.location.href.indexOf('importantsafetyinformation') > 0) {
            isiSection = $('.info-with-summary-section');
        } else {
            isiSection = $('.isi-section');
        }
        var isiTray = $('.isi-tray');
        var windowOffset = $window.scrollTop();
        var docViewBottom = windowOffset + $window.height() - isiTray.height();
        var vertTopMargin = 80; // conceal tray when 80 px above isiTop anchor
        if (isiSection.length && isiTray.length) {
            var elemTop = isiSection.offset().top - vertTopMargin;
            if (elemTop <= docViewBottom) {
                $(isiTray).addClass('hide-tray');
            } else {
                $(isiTray).removeClass('hide-tray');
            }
        }
    }
    // Minimize tray on scroll event
    $(window).on(
        'scroll resize',
        function() {
            initScrollUpdate();
        }
    );

    function initTrayScroll() {
        $('.jcf-scrollable').mCustomScrollbar({
            autoDraggerLength: false,
            mouseWheel: { preventDefault: true },
            documentTouchScroll: false
        });
    }
})(jQuery);