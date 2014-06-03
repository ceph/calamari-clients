/*global define, noty */

define(['jquery', 'underscore', 'backbone', 'templates', 'l20nCtx!locales/{{locale}}/strings', 'loglevel', 'marionette'], function($, _, Backbone, JST, l10n, log) {
    'use strict';

    // Respond to Event Aggregator Bus events.
    //
    // | Event | Meaning |
    // |-------|---------|
    // | app:neterror | Display information about various network errors by Status Code |
    // | app:configerror | Usually caused by config.json syntax errors |
    // | krakenHeartBeat:update | Backend data appears to be old, based on last updated timestamps |
    // | request:success | Notification of successful User Request |
    // | request:error | Notification of Failed User Request |
    //
    //
    // This object handles general notifications using noty and
    // simulates angular-growl using a specialized theme file.
    //
    var AlertsView = Backbone.Marionette.ItemView.extend({
        template: JST['app/scripts/templates/alerts.ejs'],
        growlTemplate: JST['app/scripts/templates/growl.ejs'],
        throttleMs: 10000,
        throttleCount: 3,
        krakenFailThreshold: 1000 * 60 * 15,
        timeoutCount: 0,
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            this.listenTo(this.App.vent, 'app:neterror', this.neterrorHandler);
            this.listenTo(this.App.vent, 'krakenHeartBeat:update', this.heartBeat);
            this.listenTo(this.App.vent, 'request:success', this.requestSuccess);
            this.listenTo(this.App.vent, 'request:error', this.requestError);
            _.each(['timeout', 'serverError', 'unexpectedError', 'parserError'], function(fnName) {
                this[fnName] = _.throttle(this[fnName], this.throttleMs);
            }, this);
            this.sessionExpired = _.once(this.sessionExpired);
            this.serverUnreachable = _.once(this.serverUnreachable);
            this.timeout = _.after(this.throttleCount, this.timeout);
            this.clusterAPITimeout = _.throttle(this.clusterAPITimeout, this.krakenFailThreshold);
            _.bindAll(this, 'neterrorHandler', 'heartBeat', 'requestSuccess', 'requestError');
        },
        // **heartBeat**
        // Kraken HeartBeat Check. Compare the last cluster update time stamp against the current
        // time and report an error if they have diverged more than 15 minutes. This can
        // indicate loss of communication.
        heartBeat: function(model) {
            if (model) {
                var attrs = model.attributes;
                //jshint camelcase: false
                if (attrs) {
                    var now = Date.now();
                    var deltaSuccessMs = now - attrs.cluster_update_time_unix;
                    // If time since last success exceeds threshold we
                    // have a problem with kraken
                    if (deltaSuccessMs > this.krakenFailThreshold) {
                        var msg = _.extend({}, this.notyDefaults);
                        // kraken's still trying, we suspect cluster
                        // API communication issues
                        this.clusterAPITimeout(msg);
                    }
                }
            }
        },
        // **commonNotyNotification**
        // Default values for the AngularGrowl like Noty Notifications.
        commonNotyNotification: {
            layout: 'topRight',
            template: _.template('<div class="noty_message"><span class="noty_text"></span><div class="noty_close"></div></div>'),
            theme: 'growlTheme',
            animation: {
                open: {
                    opacity: 1,
                    height: 'toggle'
                },
                close: {
                    opacity: 0,
                    height: 'toggle'
                },
                easing: 'swing',
                speed: 500
            }
        },
        // **requestSuccess**
        // User Request completed successfully.
        requestSuccess: function(request) {
            var msg = {
                text: this.growlTemplate({
                    text: request.headline
                }),
                type: 'success',
                timeout: 10000
            };
            noty(_.extend({}, this.commonNotyNotification, msg));
        },
        // **requestError**
        // User Request failed.
        requestError: function(request) {
            var msg = {
                text: this.growlTemplate({
                    text: request.headline
                }),
                type: 'error'
            };
            noty(_.extend({}, this.commonNotyNotification, msg));
        },
        // **notyDefaults**
        // Default noty values for general notifications.
        notyDefaults: {
            layout: 'top',
            type: 'error'
        },
        // **error**
        // Error Helper.
        error: function(msg) {
            noty(msg);
        },
        // **wwarning**
        // Warning helper.
        warning: function(msg) {
            msg.type = 'warning';
            noty(msg);
        },
        // **timeout**
        // Dashboard timeout helper. If a request to the Calamari API timeouts,
        // this message is shown. These are usually transient errors.
        timeout: function(msg) {
            msg.text = l10n.getSync('dashboardUpdateTimeout');
            this.timeoutCount++;
            this.error(msg);
            log.debug('timeout count ' + this.timeoutCount);
        },
        // **clusterAPITimeout**
        // Cluster API backend may not be responding message.
        clusterAPITimeout: function(msg) {
            msg.text = l10n.getSync('clusterNotResponding');
            this.warning(msg);
        },
        // **sessionExpired**
        // Special message indicating user session has expired.
        // User is required to log back in. Redirect user back to
        // login app.
        sessionExpired: function(msg) {
            msg = _.extend(msg, {
                text: l10n.getSync('sessionTimeout'),
                buttons: [{
                        addClass: 'btn btn-primary',
                        text: l10n.getSync('loginButton'),
                        onClick: function($noty) {
                            $noty.close();
                            window.location = '/login/';
                        }
                    }
                ]
            });
            this.warning(msg);
        },
        // **serverError**
        // Generic Server Error handler.
        serverError: function(msg, xhr) {
            msg.text = l10n.getSync('serverErrorMessage', xhr);
            this.error(msg);
        },
        // **unexpectedError**
        // Unexpected error handler.
        unexpectedError: function(msg, xhr) {
            msg.text = l10n.getSync('unexpectedError', xhr);
            this.error(msg);
        },
        // **serverUnreachable**
        // If the server API stops responding completely, say due to the server being
        // down, block all further interaction with user and have them try re-loading.
        serverUnreachable: function(msg, xhr) {
            msg = _.extend(msg, {
                force: true,
                modal: true,
                text: l10n.getSync('serverUnreachable', xhr),
                closeWith: []
            });
            this.error(msg);
            // Disable the error and warning helpers.
            this.error = this.warning = _.identity;
        },
        // **parserError**
        // A JSON parsing error was encountered while trying to parse config.json.
        parserError: function(msg, xhr) {
            msg = _.extend(msg, {
                text: l10n.getSync('JSONParserError', xhr),
                timeout: 10000
            });
            this.error(msg);
        },
        // **neterrorHandler**
        // Dispatch error messages for the different types of
        // network error that can occur.
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
            if (xhr.status === 0) {
                return this.serverUnreachable(msg, xhr);
            }
            return this.unexpectedError(msg, xhr);
        }
    });

    return AlertsView;
});
