/*global define*/

define(['underscore', 'backbone', 'models/osd-model', 'models/usage-model', 'models/health-model'], function(_, Backbone, OSD, Usage, Health) {
    'use strict';

    var ApplicationModel = Backbone.Model.extend({
        defaults: {}
    });

    // All Models
    // ---------
    //
    return {
        AppModel: ApplicationModel,
        OSDModel: OSD,
        UsageModel: Usage,
        HealthModel: Health
    };
});
