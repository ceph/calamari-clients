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
    return Backbone.Model.extend({
        defaults: {
            added_date: Date.now(),
            cluster: 0,
            id: 0,
            total_avail: 0,
            total_space: 0,
            total_used: 0
        },
        getPercentageUsed: function() {
            return this.get('total_used') / this.get('total_avail') * 100;
        }

    });
});
