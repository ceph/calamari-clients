/*jshint -W106*/
/*global define*/

define(['underscore', 'backbone', 'models/application-model'], function(_, Backbone, models) {
    'use strict';

    var PoolCollection = Backbone.Collection.extend({
        cluster: 1,
        url: function() {
            return '/api/v1/cluster/' + this.cluster + '/pool';
        },
        initialize: function(models, options) {
            if (options && options.cluster) {
                this.cluster = options.cluster;
            }
        },
        model: models.PoolModel
    });

    return PoolCollection;
});
