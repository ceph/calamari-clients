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
        makeColorListParams: function(list) {
            var template = _.template('colorList=<%- args.list %>', undefined, {
                variable: 'args'
            });
            var colorList = list.join(',');
            var result = template({
                list: colorList
            });
            return function() {
                return _.identity(result);
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
        makeParam: function(key, value) {
            var param = _.template('<%- key %>=<%- value %>', {
                key: key,
                value: value
            });
            return function() {
                return param;
            };
        },
        makeGraphURL: function(baseUrlFn, fns) {
            var initValue = baseUrlFn() + _.first(fns)();
            var restFns = _.rest(fns);
            return function() {
                var args = arguments;
                return _.reduce(restFns, function(memo, valueFn) {
                    console.log(valueFn);
                    return memo + '&' + valueFn.apply(this, args);
                }, initValue);
            };
        }
    };
});
