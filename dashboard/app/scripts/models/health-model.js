/*global define*/
/* jshint -W106 */

define(['underscore', 'backbone'], function(_, Backbone) {
    'use strict';

    // HealthModel
    // --------
    //
    // This is the model backing the Health Widget
    // There are 3 current states for state, HEALTH_OK, HEALTH_WARN and HEALTH_CRIT.
    // Details is optional and may contain extra info. The lastUpdate is the last
    // time we got an update from the server.
    //
    var Health = Backbone.Model.extend({
        url: function() {
            return '/api/v1/cluster/' + this.get('cluster') + '/health';
        },
        defaults: {
            cluster: 1,
            added: '',
            added_ms: Date.now(),
            report: {
                overall_status: 'HEALTH_OK',
                detail: [],
                summary: [{
                    'severity': 'HEALTH_OK',
                    'summary': ''
                }]
            }
        }
    });
    return Health;
});
