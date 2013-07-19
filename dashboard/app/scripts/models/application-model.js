/*global define*/

define(['underscore', 'backbone', 'models/osd-model', 'models/usage-model', 'models/health-model', 'models/status-model'], function(_, Backbone, OSD, Usage, Health, Status) {
    'use strict';

    // All Models
    // ---------
    //
    return {
        OSDModel: OSD,
        UsageModel: Usage,
        HealthModel: Health,
        StatusModel: Status
    };
});
