/*global define*/
/* jshint -W106, -W069*/
define(['jquery', 'underscore', 'backbone', 'templates', 'humanize', 'helpers/animation', 'marionette'], function($, _, Backbone, JST, humanize, animation) {
    'use strict';

    return Backbone.Marionette.ItemView.extend({
        className: 'gauge card status status-color',
        template: JST['app/scripts/templates/status.ejs'],
        statusTemplate: JST['app/scripts/templates/status-icon.ejs'],
        title: 'status',
        timer: null,
        ui: {
            cardTitle: '.card-title',
            subText: '.subtext',
            monstatus: '.mon-status',
            pgstate: '.pg-status',
            monstate: '.mon-status',
            osdstate: '.osd-status',
            okosd: '.ok-osd',
            warnosd: '.warn-osd',
            failosd: '.fail-osd',
            okpool: '.ok-pool',
            warnpool: '.warn-pool',
            failpool: '.fail-pool',
            okmds: '.ok-mds',
            warnmds: '.warn-mds',
            failmds: '.fail-mds',
            okpg: '.ok-pg',
            warnpg: '.warn-pg',
            failpg: '.fail-pg',
            okmon: '.ok-mon',
            warnmon: '.warn-mon',
            failmon: '.fail-mon',
            spinner: '.icon-spinner'
        },
        modelEvents: {
            'change': 'updateView'
        },
        serializeData: function() {
            return {
                title: this.title,
                relTime: humanize.relativeTime(Date.now() / 1000)
            };
        },
        initialize: function(options) {
            this.disappearAnimation = animation.single('fadeOutUpAnim');
            this.reappearAnimation = animation.single('fadeInDownAnim');
            _.bindAll(this, 'updateView', 'set', 'updateTimer', 'disappear', 'disappearAnimation', 'reappearAnimation', 'reappear', 'makeStatusTemplate');

            // The are defaults for Gauge.js and can be overidden from the contructor
            this.App = Backbone.Marionette.getOption(this, 'App');
            if (this.App) {
                this.listenTo(this.App.vent, 'status:update', this.set);
                this.listenTo(this.App.vent, 'gauges:disappear', this.disappear);
                this.listenTo(this.App.vent, 'gauges:reappear', this.reappear);
                this.listenTo(this.App.vent, 'gauges:expand', this.expand);
                this.listenTo(this.App.vent, 'gauges:collapse', this.collapse);
            }
            if (options && options.App !== undefined) {
                this.App = options.App;
            }
            if (this.App && !this.App.Config['offline']) {
                /* Placeholder */
            }

            var PGStatesTemplate = this.makeStateTemplate('PGs'),
                OSDStatesTemplate = this.makeStateTemplate('OSDs'),
                MONStatesTemplate = this.makeStateTemplate('MONs'),
                pgwarn = this.makeStateInfoView(this.makeStatusTemplate('PG Warn Status', 'icon-question-sign icon-large warn'), PGStatesTemplate, '.warn'),
                pgcrit = this.makeStateInfoView(this.makeStatusTemplate('PG Critical Status', 'icon-question-sign icon-large fail'), PGStatesTemplate, '.fail'),
                osdwarn = this.makeStateInfoView(this.makeStatusTemplate('OSD Warn Status', 'icon-question-sign icon-large warn'), OSDStatesTemplate, '.warn'),
                osdcrit = this.makeStateInfoView(this.makeStatusTemplate('OSD Critical Status', 'icon-question-sign icon-large fail'), OSDStatesTemplate, '.fail'),
                monwarn = this.makeStateInfoView(this.makeStatusTemplate('MON Warn Status', 'icon-question-sign icon-large warn'), MONStatesTemplate, '.warn'),
                moncrit = this.makeStateInfoView(this.makeStatusTemplate('MON Critical Status', 'icon-question-sign icon-large fail'), MONStatesTemplate, '.fail');

            var self = this;
            this.listenToOnce(this, 'render', function() {
                self.listenTo(self.App.vent, 'status:request', function() {
                    self.ui.spinner.css('visibility', 'visible');
                });
                self.listenTo(self.App.vent, 'status:sync status:error', function() {
                    self.ui.spinner.css('visibility', 'hidden');
                });
                if (self.timer === null) {
                    self.updateTimer();
                }
                // wait until self.ui is initialized
                var ui = self.ui;
                self.addPGStateInfo = self.makeStateView(ui.pgstate, pgwarn, pgcrit);
                self.addOSDStateInfo = self.makeStateView(ui.osdstate, osdwarn, osdcrit);
                self.addMONStateInfo = self.makeStateView(ui.monstate, monwarn, moncrit);
            });
        },
        set: function(model) {
            this.model.set(model.attributes);
        },
        updateTimer: function() {
            this.ui.subText.text(humanize.relativeTime(this.model.get('cluster_update_time_unix') / 1000));
            this.timer = setTimeout(this.updateTimer, 1000);
        },
        updateView: function(model) {
            var osd = model.getOSDCounts(),
                mon = model.getMONCounts(),
                pg = model.getPGCounts();
            this.ui.okosd.text(osd.ok);
            this.ui.warnosd.text(osd.warn);
            this.ui.failosd.text(osd.crit);
            this.ui.okmon.text(mon.ok);
            this.ui.warnmon.text(mon.warn);
            this.ui.failmon.text(mon.crit);
            this.ui.okpg.text(pg.ok);
            this.ui.warnpg.text(pg.warn);
            this.ui.failpg.text(pg.crit);
            this.ui.subText.text(humanize.relativeTime(model.get('cluster_update_time_unix') / 1000));
            (function(self, m) {
                setTimeout(function() {
                    self.addPGStateInfo.call(self, m.getPGStates());
                    self.addOSDStateInfo.call(self, m.getOSDStates());
                    self.addMONStateInfo.call(self, m.getMONStates());
                }, 0);
            })(this, model);

        },
        // use partial application to format warn and critical state
        // data for display
        makeStateInfoView: function(templateFn, contentFn, selector) {
            return function(obj) {
                var html = '',
                    selectors = '';
                if (_.keys(obj).length) {
                    html = templateFn(contentFn(obj));
                    selectors = selector;
                }
                return {
                    content: html,
                    selector: selectors
                };
            };
        },
        // Use partial application to display warn and critical info on status widget.
        // Also responsible for initializing bootstrap popover jquery plugin
        // Expects a jquery object, and a warn and critical StateInfoView formatting objects
        makeStateView: function($uiElement, warnFn, critFn) {
            return function(data) {
                var obj = _.reduce([warnFn(data.warn), critFn(data.crit)], function(memo, state) {
                    if (state.content.length) {
                        memo.html.push(state.content);
                        memo.selectors.push(state.selector);
                    }
                    return memo;
                }, {
                    html: [],
                    selectors: []
                });
                $uiElement.html(obj.html.join(''));
                _.each(obj.selectors, function(selector) {
                    $uiElement.find(selector).closest('div').popover();
                });
            };
        },
        // uses partial application to format state strings for display
        makeStateTemplate: function(entity) {
            return function(states) {
                return _.reduce(_.map(states, function(value, key) {
                    return value + ' ' + entity + ' ' + key;
                }), function(memo, string) {
                    return memo + ',<br /> ' + string;
                });
            };
        },
        // uses partial application function to create
        // markup/configuration for state popover
        makeStatusTemplate: function(title, iconClass) {
            var self = this;
            return function(status) {
                return self.statusTemplate({
                    iconClass: iconClass,
                    content: status,
                    title: title
                });
            };
        },
        disappear: function(callback) {
            return this.disappearAnimation(this.$el, function() {
                this.$el.css('visibility', 'hidden');
            }).then(function() {
                if (callback) {
                    callback.apply(this);
                }
            });
        },
        reappear: function(callback) {
            this.$el.css('visibility', 'visible');
            return this.reappearAnimation(this.$el, callback);
        },
        expand: function(callback) {
            this.$el.css('display', 'block');
            if (callback) {
                callback.apply(this);
            }
        },
        collapse: function(callback) {
            this.$el.css('display', 'none');
            if (callback) {
                callback.apply(this);
            }
        }
    });
});
