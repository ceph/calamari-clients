/* global define */
(function() {
    'use strict';
    define(['lodash'], function(_) {
        var Service = function() {
        };
        Service.prototype = _.extend(Service.prototype, {
            getPollTimeoutMs: function() {
                return 20000;
            },
            getSpinnerAnimationTimeoutMs: function() {
                return 1000;
            },
            getFirstViewPath: function() {
                return '/first';
            }
        });
        return [Service];
    });
})();
