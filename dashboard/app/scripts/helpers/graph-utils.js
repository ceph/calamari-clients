/* global define */

define(['jquery', 'underscore', 'backbone', 'templates'], function($, _, backbone, JST) {
    'use strict';
    return {
        makeCPUTargets: function(targets) {
            var cpuTargetTemplate = JST['app/scripts/templates/graphite/CPUTargets.ejs'];
            return function(hostname) {
                return _.map(targets, function(metric) {
                    return $.trim(cpuTargetTemplate({
                        metric: metric,
                        hostname: hostname
                    }));
                });
            };
        },
        makeHeightWidthParams: function(width, height) {
            var template = _.template('width=<%- args.width %>&height=<%- args.height %>', undefined, {
                variable: 'args'
            });
            return function() {
                return template({
                    width: width,
                    height: height
                });
            };
        },
        makeBaseUrl: function(host) {
            var template = _.template('http://<%- args.host %>/render/?', undefined, {
                variable: 'args'
            });
            return function() {
                return template({
                    host: host
                });
            };
        },
        makeTargets: function(fn) {
            var template = _.template('target=<%- args.target %>', undefined, {
                variable: 'args'
            });
            return function() {
                return 'target=' + _.reduce(fn.apply(this, arguments), function(memo, value) {
                    return memo + '&' + template({
                        target: value
                    });
                });
            };
        },
        makeGraphURL: function(format, baseUrlFn, heightWidthFn, targetsFn) {
            return function(hostname) {
                return baseUrlFn() + _.reduce([heightWidthFn(), targetsFn(hostname), 'format=' + format], function(memo, value) {
                    return memo + '&' + value;
                });
            };
        }
    };
});
