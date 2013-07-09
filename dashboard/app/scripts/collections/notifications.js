/*global define*/

define([
    'underscore',
    'backbone',
    'models/notification'
], function (_, Backbone, Notification) {
    'use strict';

    var Notifications = Backbone.Collection.extend({
        model: Notification
    });

    return Notifications;
});
