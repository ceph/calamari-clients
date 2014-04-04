/*jshint -W106*/
/*global define*/

define(['underscore', 'backbone', 'models/user-request-model'], function(_, Backbone, UserRequestModel) {
    'use strict';

    var UserRequestCollection = Backbone.Collection.extend({
        url: function() {
            return '/api/v2/cluster/' + this.cluster + '/request';
        },
        model: UserRequestModel,
        initialize: function(models, options) {
            if (options && options.cluster) {
                this.cluster = options.cluster;
            }
        }
    });

    return UserRequestCollection;
});
