/*global define*/

define(['underscore', 'backbone', ], function(_, Backbone) {
    'use strict';

    var StatusModel = Backbone.Model.extend({
        url: function() {
            return '/api/v1/cluster/' + this.cluster + '/health_counters';
        },
        cluster: 1,
        defaults: {
            'added_ms': Date.now(),
            'mon': {
                'not_in_quorum': 0,
                'in_quorum': 0,
                'total': 0
            },
            'mds': {
                'not_up_not_in': 0,
                'total': 0,
                'up_in': 0,
                'up_not_in': 0
            },
            'osd': {
                'up_not_in': 0,
                'not_up_not_in': 0,
                'total': 0,
                'up_in': 0
            },
            'pool': {
                'total': 0
            }
        }
    });

    return StatusModel;
});
