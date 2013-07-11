/*global define*/

define(['underscore', 'backbone', 'models/osd-model', 'models/usage-model'], function(_, Backbone, OSD, Usage) {
    'use strict';

    var ApplicationModel = Backbone.Model.extend({
        defaults: {}
    });

    // OSDModel
    // --------
    //
    // This is the model backing the OSD entity
    //

    return {
        AppModel: ApplicationModel,
        OSDModel: OSD,
        UsageModel: Usage
    };
});
