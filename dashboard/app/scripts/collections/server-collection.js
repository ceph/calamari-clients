/*jshint -W106*/
/*global define*/

define(['underscore', 'backbone', 'models/application-model'], function(_, Backbone, models) {
    'use strict';

    var ServerCollection = Backbone.Collection.extend({
        cluster: 1,
        url: function() {
            return '/api/v1/cluster/' + this.cluster + '/server';
        },
        initialize: function(models, options) {
            if (options && options.cluster) {
                this.cluster = options.cluster;
            }
        },
        model: models.ServerModel
    });

    return ServerCollection;
});
