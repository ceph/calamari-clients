/* global define */
define(['jquery', 'underscore', 'backbone', 'marionette'], function($, _, Backbone) {
    'use strict';
    var NotificationBellView = Backbone.Marionette.ItemView.extend({
        className: '',
        events: {
            'click': 'sendEvent',
        },
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            _.bindAll(this, 'sendEvent');
        },
        sendEvent: function() {
            this.App.vent.trigger('UserRequestView:toggle');
        }

    });
    return NotificationBellView;
});
