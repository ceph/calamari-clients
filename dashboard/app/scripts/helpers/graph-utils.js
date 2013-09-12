/* global define */

define(['jquery', 'underscore', 'backbone', 'templates'], function($, _, backbone, JST) {
    'use strict';

    function makeTargetTemplate(path) {
        var template = JST[path];
        return function(metrics) {
            return function(hostname, id) {
                return _.map(metrics, function(metric) {
                    return $.trim(template({
                        metric: metric,
                        hostname: hostname,
                        id: id
                    }));
                });
            };
        };
    }
    return {
        makeCPUTargets: makeTargetTemplate('app/scripts/templates/graphite/CPUTargets.ejs'),
        makeCPUDetailedTargets: makeTargetTemplate('app/scripts/templates/graphite/CPUDetailedTargets.ejs'),
        makeDiskSpaceTargets: makeTargetTemplate('app/scripts/templates/graphite/DiskSpaceTargets.ejs'),
        makeOpLatencyTargets: makeTargetTemplate('app/scripts/templates/graphite/OSDOpLatencyTarget.ejs'),
        makeFilestoreTargets: makeTargetTemplate('app/scripts/templates/graphite/OSDFilestoreTarget.ejs'),
        makeLoadAvgTargets: makeTargetTemplate('app/scripts/templates/graphite/LoadAvgTarget.ejs'),
        makeMemoryTargets: makeTargetTemplate('app/scripts/templates/graphite/MemoryTarget.ejs'),
        makeIOStatIOPSTargets: makeTargetTemplate('app/scripts/templates/graphite/IOStatIOPSTargets.ejs'),
        makeNetworkTargets: makeTargetTemplate('app/scripts/templates/graphite/NetworkTargets.ejs'),
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
            var template = _.template('<%= args.host %>/render/?', undefined, {
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
