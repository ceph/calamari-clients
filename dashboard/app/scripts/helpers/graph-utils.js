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
        makeOpLatencyTargets: function(targets) {
            var template = _.template('servers.<%- args.hostname %>.CephCollector.ceph.osd-<%- args.osd %>.osd.<%- args.metric %>.last_interval_avg', undefined, { variable: 'args' });
            return function(hostname, osd) {
                return _.map(targets, function(metric) {
                    return $.trim(template({
                        'metric': metric,
                        'hostname': hostname,
                        'osd': osd
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
            return function() {
                return baseUrlFn() + _.reduce([heightWidthFn(), targetsFn.apply(this, arguments), 'format=' + format], function(memo, value) {
                    return memo + '&' + value;
                });
            };
        }
    };
});
