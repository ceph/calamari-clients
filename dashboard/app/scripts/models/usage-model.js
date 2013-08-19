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
            space: {
                free_bytes: 0,
                used_bytes: 0,
                capacity_bytes: 0
            }
        },
        getPercentageUsed: function() {
            var space = this.get('space');
            if (space.capacity_bytes === 0) {
                return 0;
            }
            return (space.used_bytes / space.capacity_bytes) * 100;
        }

    });
    return window.Usage;
});
