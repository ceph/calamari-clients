/*global define*/

define(['underscore', 'backbone', 'raphael'], function(_, Backbone) {
    'use strict';

    var Notification = Backbone.Model.extend({
        initialize: function() {
            if (this.timestamp === 0) {
                this.timestamp = Date.now();
            }
        },
        defaults: {
            title: '',
            message: '',
            priority: 0,
            timestamp: 0,
            acked: false
        }
    });

    return Notification;
});
