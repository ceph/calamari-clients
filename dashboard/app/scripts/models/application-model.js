/*global define*/

define(['underscore', 'backbone', 'models/osd-model'], function(_, Backbone, OSD) {
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
        OSDModel: OSD
    };
});
