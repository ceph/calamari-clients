/*global define*/
// ignore non-camel case decided by server
/* jshint -W106*/
define(['underscore', 'backbone'], function(_, Backbone) {
    'use strict';

    var UserRequestModel = Backbone.Model.extend({
        url: function() {
            return '/api/v2/cluster/' + this.get('cluster') + '/request/' + this.get('id');
        },
        defaults: {
            id: 0,
            cluster: 1
        }
    });
    return UserRequestModel;
});
