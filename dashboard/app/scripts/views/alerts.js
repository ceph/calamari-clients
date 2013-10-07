/*global define, noty */

define(['jquery', 'underscore', 'backbone', 'templates', 'marionette'], function($, _, Backbone, JST) {
    'use strict';

    var AlertsView = Backbone.Marionette.ItemView.extend({
        serverErrorTemplate: _.template('Server Error (<%- status %>) <%- responseText %>. Please contact Administrator.'),
        unexpectedErrorTemplate: _.template('Unexpected Error (<%- status %>)<%- responseText %>. Please contact Administrator.'),
        parserErrorTemplate: _.template('Error decoding <%- source %> response from server. Please contact Administrator.'),
        template: JST['app/scripts/templates/alerts.ejs'],
        throttleMs: 10000,
        throttleCount: 3,
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            this.listenTo(this.App.vent, 'app:neterror', this.neterrorHandler);
            _.each(['timeout', 'serverError', 'unexpectedError', 'parserError'], function(fnName) {
                this[fnName] = _.throttle(this[fnName], this.throttleMs);
            }, this);
            this.sessionExpired = _.once(this.sessionExpired);
            this.timeout = _.after(this.throttleCount, this.timeout);
            _.bindAll(this, 'neterrorHandler');
        },
        notyDefaults: {
            layout: 'top',
            type: 'error'
        },
        timeoutCount: 0,
        error: function(msg) {
            noty(msg);
        },
        warning: function(msg) {
            msg.type = 'warning';
            noty(msg);
        },
        timeout: function(msg) {
            msg.text = 'Dashboard Update Timed Out. Please check your connection.';
            this.timeoutCount++;
            this.error(msg);
            console.log('timeout count ' + this.timeoutCount);
        },
        sessionExpired: function(msg) {
            msg.text = 'Session Has Timed Out. Please Login again.';
            msg.buttons = [{
                addClass: 'btn btn-primary',
                text: 'Login',
                onClick: function($noty) {
                    $noty.close();
                    window.location = '/login/';
                }
            }];
            this.warning(msg);
        },
        serverError: function(msg, xhr) {
            msg.text = this.serverErrorTemplate(xhr);
            this.error(msg);
        },
        unexpectedError: function(msg, xhr) {
            msg.text = this.unexpectedErrorTemplate(xhr);
            this.error(msg);
        },
        parserError: function(msg, xhr) {
            msg.text = this.parserErrorTemplate(xhr);
            msg.timeout = 10000;
            this.error(msg);
        },
        neterrorHandler: function(source, xhr) {
            var errorType = xhr.statusText;
            if (!errorType) {
                return;
            }
            var msg = _.extend({}, this.notyDefaults);
            if (errorType === 'timeout') {
                return this.timeout(msg);
            }
            // parsererror doesn't seem to work consistently
            if (errorType === 'parsererror' || (xhr.status === 200 && errorType === 'OK')) {
                return this.parserError(msg, _.extend({
                    source: source
                }, xhr));
            }
            if (xhr.status === 403) {
                return this.sessionExpired(msg);
            }
            if (xhr.status >= 500) {
                return this.serverError(msg, xhr);
            }
            return this.unexpectedError(msg, xhr);
        }
    });

    return AlertsView;
});
