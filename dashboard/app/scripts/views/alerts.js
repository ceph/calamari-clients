/*global define, noty */

define(['jquery', 'underscore', 'backbone', 'templates', 'marionette'], function($, _, Backbone, JST) {
    'use strict';

    var AlertsView = Backbone.Marionette.ItemView.extend({
        throttleMs: 10000,
        throttleCount: 3,
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            this.listenTo(this.App.vent, 'app:neterror', this.neterrorHandler);
            this.error = _.after(this.throttleCount, _.throttle(this.error, this.throttleMs));
            _.bindAll(this, 'neterrorHandler');
        },
        notyDefaults: {
            layout: 'top',
            type: 'error'
        },
        timeoutCount: 0,
        error: function(msg) {
            noty(msg);
            console.log('timeout count ' + this.timeoutCount);
        },
        neterrorHandler: function(source, xhr) {
            var errorType = xhr.statusText;

            if (errorType) {
                var msg = _.extend({}, this.notyDefaults);
                if (errorType === 'timeout') {
                    msg.text = 'Dashboard Update Timed Out. Please check your connection.';
                    this.timeoutCount++;
                    this.error(msg);
                }
            }
        },
        template: JST['app/scripts/templates/alerts.ejs']
    });

    return AlertsView;
});
