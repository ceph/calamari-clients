/* global define */

define(['jquery', 'underscore', 'backbone', 'templates'], function($, _, backbone, JST) {
    'use strict';

    /*
     * Creates a partial applied function which is pre-bound to the underscore.template
     * to create the target.
     *
     * This returns a function with the following signature:
     *
     * function(metrics)
     *
     * @param metrics is an array of strings for specific leaf keys of Graphite Targets we're looking
     *        to request. e.g. [ 'tx_errors', 'rx_errors' ]
     *
     * This creates another partially applied function with the following signature:
     *
     * function(hostname, id)
     *
     * @param hostname - hostname of target we want
     * @param id - subkey of target we're looking for e.g. [ 'eth0', 'eth1' ]
     *
     * Which is used to create more specific target keys which target specific parts of the graphite hierarchy.
     * We do it this way because we know which metrics want ahead of time, but need
     * to dynamically fill in the hostname and subkey we need to request usually after making a 2nd request to graphite
     * to find out what subkeys are available.
     */

    function makeTargetTemplate(path) {
        var template = JST[path];
        return function(metrics) {
            // pre-bind the metrics list using partial application
            return function(hostname, id) {
                // returns a list of metrics target values as an array
                // e.g. [ 'servers.mira064.memory.Active' ]
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
        makePoolIOPSTargets: makeTargetTemplate('app/scripts/templates/graphite/PoolIOPSTarget.ejs'),
        makePoolDiskFreeTargets: makeTargetTemplate('app/scripts/templates/graphite/PoolDiskFreeTarget.ejs'),
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
        /*
         * takes a function which returns an array of strings, graphite target list values.
         * Returns a function which applies any arguments to the partially applied function parameter.
         * The returned function returns a url param string containing target params suitable for graphite.
         *
         */
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
                    return memo + '&' + valueFn.apply(this, args);
                }, initValue);
            };
        },
        graphiteJsonArrayToDygraph: function(resp) {
            // convert time which is usually the first part of a series tuple
            var data = _.map(resp.datapoints, function(series) {
                return _.map(series, function(value, index) {
                    if (index === 0) {
                        return new Date(value * 1000);
                    }
                    return value;
                });
            });
            return {
                labels: resp.targets,
                data: data
            };
        },
        sumSeries: function(fn) {
            return function() {
                var args = arguments;
                return [ 'sumSeries(' + _.reduce(fn.apply(this, args), function(memo, value) {
                    return memo + ',' + value;
                }) + ')' ];
            };
        }
    };
});
