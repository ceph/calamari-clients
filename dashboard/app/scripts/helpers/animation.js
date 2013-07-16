/*global define*/

'use strict';
define(['jquery'], function($) {
    var events = 'webkitAnimationEnd animationend';
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
    return function(class1, class2) {
        return function(selector, fn1, fn2) {
            var d = $.Deferred();
            selector.on(events, d.resolve);
            var self = this;
            selector.addClass(class1);
            return d.promise().then(function() {
                if (fn1) {
                    fn1.apply(self);
                }
                selector.off(events, d.resolve).removeClass(class1);
                d = $.Deferred();
                selector.on(events, d.resolve).addClass(class2);
                return d.promise();
            }).then(function() {
                selector.removeClass(class2);
                selector.off(events, d.resolve);
                if (fn2) {
                    fn2.apply(self);
                }
            });
        };
    };

});
