/*global define*/
define(['lodash'], function(_) {
    'use strict';
    var myid = 0;
    var broadcastService = function($log) {
        var Service = function() {
            this.myid = myid++;
            $log.debug(this.myid + ' Creating Module Broadcast Service');
            this.sources = [];
            this.sinks = [];
        };
        Service.prototype = _.extend(Service.prototype, {
            addSource: function(scope) {
                this.sources.push(scope);
            },
            addSink: function(scope) {
                this.sinks.push(scope);
            },
            on: function() {
                var self = this;
                var args = [].slice.call(arguments);
                _.each(this.sources, function(source) {
                    _.each(self.sinks, function(sink) {
                        source.$on.call(source, args[0], function() {
                            var sinkArgs = [].slice.call(arguments);
                            sinkArgs[0] = sinkArgs[0].name;
                            sink.$emit.apply(sink, sinkArgs);
                        });
                        sink.$on.apply(sink, args);
                    });
                });
            },
            emit: function() {
                var args = [].slice.call(arguments);
                _.each(this.sources, function(source) {
                    source.$emit.apply(source, args);
                });
            }
        });
        var svc = new Service();
        return svc;
    };
    var service = null;
    return function BroadcastServiceProvider() {
        // This is an App Wide singleton
        this.$get = ['$log',
            function($log) {
                if (service === null) {
                    // This truely needs to be a singleton
                    // This *only* works because JS is single threaded
                    service = broadcastService($log);
                }
                return service;
            }
        ];
    };
});
