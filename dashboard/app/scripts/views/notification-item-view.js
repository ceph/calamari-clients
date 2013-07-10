/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'humanize', '../models/notification', 'marionette'], function($, _, Backbone, JST, humanize, Notification) {
    'use strict';

    var NotificationItemView = Backbone.Marionette.ItemView.extend({
        tagName: 'div',
        className: 'notification',
        model: Notification,
        template: JST['app/scripts/templates/notification.ejs'],
        modelEvents: {},
        serializeData: function() {
            var model = this.model.toJSON();
            var className = '';
            switch (model.priority) {
            case 0:
                className = 'icon-ok-sign ok';
                break;
            case 1:
                className = 'icon-warning-sign warn';
                break;
            case 2:
                className = 'icon-exclamation-sign fail';
                break;
            default:
                className = '';
            }
            model.className = className;
            model.timeStr = humanize.relativeTime(model.timestamp);
            return model;
        },
        initialize: function() {}
    });

    return NotificationItemView;
});
