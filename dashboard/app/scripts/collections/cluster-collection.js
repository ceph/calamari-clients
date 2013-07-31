/*jshint -W106*/
/*global define*/

define(['underscore', 'backbone', 'models/cluster-model'], function(_, Backbone, clusterModel) {
    'use strict';

    var ClusterCollection = Backbone.Collection.extend({
        url: '/api/v1/cluster',
        model: clusterModel
    });

    return ClusterCollection;
});
