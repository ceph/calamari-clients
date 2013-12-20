/*global define*/
/* jshint -W106 */

define(['underscore', 'backbone'], function(_, Backbone) {
    'use strict';

    var ServerModel = Backbone.Model.extend({
        url: function() {
            return '/api/v1/cluster/' + this.get('cluster') + '/server';
        },
        defaults: {
            cluster: 1,
        }
    });
    return ServerModel;
});
