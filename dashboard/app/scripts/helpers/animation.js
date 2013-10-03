/*global define, Modernizr*/

'use strict';
define(['jquery', 'underscore'], function($, _) {
    var animationEndEventNames = {
        'WebkitAnimation': 'webkitAnimationEnd',
        'MozAnimation': 'animationEnd',
        'OAnimation': 'oanimationend',
        'msAnimation': 'MSAnimationEnd',
        'animation': 'animationend'
    },
        animationEndEvent = animationEndEventNames[Modernizr.prefixed('animation')];

    // Returns a function which animates using the specified CSS3 class1 and class2.
    // Signature of return function is:
    //   selector - jquery selector,
    //   fn1 - callback after first animation completes
    //   fn2 - callback after second animation completes
    //
    // Assumes you have bound the generated function to a useful instance.
    // @param class1 - css class of animation 1
    // @param class2 - css class of animation 2
    // @returns jQuery promise
    function pair(clazzA, clazzB) {
        return function($selector, fn1, fn2) {
            return single(clazzA)($selector, fn1).then(single(clazzB)($selector, fn2));
        };
    }

    function single(class1) {
        return function($selector, fn1) {
            var d = $.Deferred();
            var resolver = function(evt) {
                    evt.stopPropagation();
                    d.resolve();
                };
            var self = this;
            $selector.on(animationEndEvent, resolver);
            $selector.addClass(class1);
            return d.promise().then(function() {
                $selector.off(animationEndEvent, resolver).removeClass(class1);
                if (_.isFunction(fn1)) {
                    var args = _.toArray(arguments);
                    fn1.apply(self, args);
                }
            });
        };
    }

    return {
        pair: pair,
        single: single
    };

});
