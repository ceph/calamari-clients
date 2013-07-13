/*global define*/
// ignore non-camel case decided by server
/* jshint -W106*/
define(['underscore', 'backbone'], function(_, Backbone) {
    'use strict';

    // UsageModel
    // --------
    //
    // This is the model backing the Usage Widget
    //
    window.Usage = Backbone.Model.extend({
        url: function() {
            return '/api/v1/cluster/' + this.get('cluster') + '/space';
        },
        defaults: {
            added_date: Date.now(),
            cluster: 1,
            id: 0,
            total_avail: 0,
            total_space: 0,
            total_used: 0
        },
        parse: function(response /*, options*/ ) {
            response.total_used *= 1024;
            response.total_avail *= 1024;
            response.total_space *= 1024;
            return response;
        },
        getPercentageUsed: function() {
            return this.get('total_used') / this.get('total_avail') * 100;
        }

    });
    return window.Usage;
});
