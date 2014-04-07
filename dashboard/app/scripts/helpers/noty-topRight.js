/* global jQuery */
(function($) {
    'use strict';

    $.noty.layouts.topRight = {
        name: 'topRight',
        options: { // overrides options

        },
        container: {
            object: '<ul id="noty_topRight_layout_container" />',
            selector: 'ul#noty_topRight_layout_container',
            style: function() {
                $(this).css({
                    top: 10,
                    right: 48,
                    float: 'right',
                    width: '250px',
                    'min-height': '50px',
                    position: 'fixed',
                    listStyleType: 'none',
                    zIndex: 10000000
                });

                if (window.innerWidth < 600) {
                    $(this).css({
                        right: 5
                    });
                }
            }
        },
        parent: {
            object: '<li />',
            selector: 'li',
            css: {
                'opacity': 0,
                'padding': '5px'
            }
        },
        css: {
            display: 'none',
            width: '250px'
        },
        addClass: ''
    };

})(jQuery);
