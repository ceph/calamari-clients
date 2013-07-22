/*jshint -W106*/
/*global define*/

define(['underscore', 'backbone', 'models/application-model'], function(_, Backbone, models) {
    'use strict';

    var OSDCollection = Backbone.Collection.extend({
        cluster: 1,
        epoch: 1,
        added_ms: 0,
        url: function() {
            return '/api/v1/cluster/' + this.cluster + '/osds';
        },
        parse: function(response) {
            this.epoch = response.epoch;
            this.added_ms = response.added_ms;
            return response.osds;
        },
        model: models.OSDModel

    });

    return OSDCollection;
});
