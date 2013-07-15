/*global define*/

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
    window.Health = Backbone.Model.extend({
        defaults: {
            state: 'HEALTH_OK',
            details: '',
            lastUpdate: Date.now()
        },
    });
    return window.Health;
});
