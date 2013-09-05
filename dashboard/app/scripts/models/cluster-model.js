/*global define*/

define(['underscore', 'backbone'], function(_, Backbone) {
    'use strict';

    var ClusterModel = Backbone.Model.extend({
        defaults: {
            'name': 'unknown',
            'id': 0,
            'api_base_url': ''
        }
    });

    return ClusterModel;
});
