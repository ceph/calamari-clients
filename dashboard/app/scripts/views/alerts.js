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
        krakenFailThreshold: 1000 * 60 * 15,
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            this.listenTo(this.App.vent, 'app:neterror', this.neterrorHandler);
            this.listenTo(this.App.vent, 'krakenHeartBeat:update', this.heartBeat);
            _.each(['timeout', 'serverError', 'unexpectedError', 'parserError'], function(fnName) {
                this[fnName] = _.throttle(this[fnName], this.throttleMs);
            }, this);
            this.sessionExpired = _.once(this.sessionExpired);
            this.timeout = _.after(this.throttleCount, this.timeout);
            _.bindAll(this, 'neterrorHandler', 'heartBeat');
        },
        heartBeat: function(model) {
            if (model) {
                var attrs = model.attributes;
                //jshint camelcase: false
                if (attrs) {
                    var now = Date.now();
                    var deltaAttemptMs = now - attrs.cluster_update_attempt_time_unix;
                    var deltaSuccessMs = now - attrs.cluster_update_time_unix;
                    // If time since last success exceeds threshold we
                    // have a problem with kraken
                    if (deltaSuccessMs > this.krakenFailThreshold) {
                        var msg = _.extend({}, this.notyDefaults);
                        if (deltaAttemptMs > deltaSuccessMs) {
                            // if last attempt is older than last success
                            // then it's likely kraken has failed
                            this.clusterUpdateTimeout(msg);
                        } else {
                            // kraken's still trying, we suspect cluster
                            // API communication issues
                            this.clusterAPITimeout(msg);
                        }
                    }
                }
            }
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
        clusterUpdateTimeout: function(msg) {
            msg.text = 'Cluster Updates Are Stale. ICE update process may have failed.';
            this.warning(msg);
        },
        clusterAPITimeout: function(msg) {
            msg.text = 'Cluster Updates Are Stale. Cluster isn\'t responding to ICE requests.';
            this.warning(msg);
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
