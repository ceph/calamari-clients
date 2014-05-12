/*jshint -W106*/
/*global define*/

define(['underscore', 'backbone', 'models/user-request-model'], function(_, Backbone, UserRequestModel) {
    'use strict';

    var UserRequestCollection = Backbone.Collection.extend({
        url: function() {
            return '/api/v2/cluster/' + this.cluster + '/request' + this.params;
        },
        parse: function(resp) {
            return resp.results;
        },
        model: UserRequestModel,
        params: '?page_size=32',
        initialize: function(models, options) {
            if (options && options.cluster) {
                this.cluster = options.cluster;
            }
        },
        // Only grab requests with state submitted
        getSubmitted: function(options) {
            this.params = '?state=submitted&page_size=32';
            var self = this;
            return this.fetch(options).always(function() {
                self.params = '?page_size=32';
            });
        }
    });

    return UserRequestCollection;
});
