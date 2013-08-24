/* global define */

define(['jquery', 'underscore', 'backbone', 'templates'], function($, _, backbone, JST) {
    'use strict';
    return {
        makeCPUTargets: function(targets) {
            var cpuTargetTemplate = JST['app/scripts/templates/graphite/CPUTargets.ejs'];
            return function(hostname) {
                return _.map(targets, function(metric) {
                    return cpuTargetTemplate({
                        metric: metric,
                        hostname: hostname
                    });
                });
            };
        }
    };
});
