/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'humanize', 'helpers/animation', 'marionette'], function($, _, Backbone, JST, humanize, animation) {
    'use strict';

    var OsdView = Backbone.Marionette.ItemView.extend({
        className: 'gauge card osd',
        template: JST['app/scripts/templates/osd.ejs'],
        countTemplate: _.template('<%- count %>'),
        totalTemplate: _.template('<%- total %> Total'),
        ui: {
            osdCount: '.osd-count',
            osdState: '.osd-state',
            osdOne: '.osd-one',
            osdTwo: '.osd-two',
            osdThree: '.osd-three',
            osdTotal: '.osd-total',
            spinner: '.fa-spinner'
        },
        timeoutMs: 3000,
        timeoutId: null,
        state: ['one'],
        position: 0,
        count: 1,
        events: {
            'mouseenter': 'stopCarousel',
            'mouseleave': 'carousel',
            'click .osd-dot': 'changeCarousel'
        },
        stopCarousel: function(evt) {
            evt.stopPropagation();
            evt.preventDefault();
            if (this.timeoutId !== null) {
                clearTimeout(this.timeoutId);
                this.timeoutId = null;
            }
        },
        changeCarousel: function(evt) {
            evt.stopPropagation();
            evt.preventDefault();
            var $tgt = $(evt.target);
            var state = 'one';
            if ($tgt.hasClass('osd-two')) {
                state = 'two';
            } else if ($tgt.hasClass('osd-three')) {
                state = 'three';
            }
            this.position = _.indexOf(this.state, state);
            this.updateView();
        },
        modelEvents: {
            'change': 'updateModel'
        },
        carousel: function() {
            this.position = (this.position + 1) % this.count;
            this.updateView();
            this.timeoutId = setTimeout(this.carousel, this.timeoutMs);
        },
        initialize: function() {
            _.bindAll(this, 'set', 'updateModel', 'updateView', 'carousel', 'stopCarousel', 'changeCarousel', 'disappear', 'reappear', 'expand', 'collapse');
            this.model = new Backbone.Model();
            this.disappearAnimation = animation.single('fadeOutUpAnim');
            this.reappearAnimation = animation.single('fadeInDownAnim');
            this.App = Backbone.Marionette.getOption(this, 'App');
            if (this.App) {
                this.listenTo(this.App.vent, 'status:update', this.set);
                this.listenTo(this.App.vent, 'gauges:disappear', this.disappear);
                this.listenTo(this.App.vent, 'gauges:reappear', this.reappear);
                this.listenTo(this.App.vent, 'gauges:collapse', this.collapse);
                this.listenTo(this.App.vent, 'gauges:expand', this.expand);
            }
            this.timeoutId = setTimeout(this.carousel, this.timeoutMs);
            var self = this;
            this.listenToOnce(this, 'render', function() {
                self.listenTo(self.App.vent, 'status:request', function() {
                    self.ui.spinner.css('visibility', 'visible');
                });
                self.listenTo(self.App.vent, 'status:sync status:error', function() {
                    setTimeout(function() {
                        self.ui.spinner.css('visibility', 'hidden');
                    }, 250);
                });
            });
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
        },
        disappear: function(callback) {
            return this.disappearAnimation(this.$el, function() {
                this.$el.css('visibility', 'hidden');
                if (callback) {
                    callback.apply(this);
                }
            });
        },
        reappear: function(callback) {
            this.$el.css('visibility', 'visible');
            return this.reappearAnimation(this.$el, callback);
        },
        set: function(model) {
            this.model.set(model.attributes.osd);
        },
        updateElements: function(count, total, text, className, elem) {
            this.ui.osdCount.text(this.countTemplate({
                count: humanize.numberFormat(count, 0),
                total: total
            }));
            this.ui.osdState.text(text).addClass(className);
            this.ui[elem].removeClass('fa-circle-o').addClass('fa-dot-circle-o');
        },
        updateView: function() {
            var state = this.state[this.position];
            var attr = this.model.attributes;
            if (attr.length === 0) {
                return;
            }
            this.ui.osdCount.removeClass('ok fail warn');
            this.ui.osdState.removeClass('ok fail warn');
            this.$('.fa-dot-circle-o').removeClass('fa-dot-circle-o').addClass('fa-circle-o');
            this.ui.osdTotal.text(this.totalTemplate({
                total: humanize.numberFormat(attr.total, 0)
            }));
            if (state === 'one') {
                this.updateElements(attr.ok.count, attr.total, 'OK', 'ok', 'osdOne');
            } else if (state === 'two') {
                this.updateElements(attr.warn.count, attr.total, 'WARN', 'warn', 'osdTwo');
            } else {
                this.updateElements(attr.critical.count, attr.total, 'CRITICAL', 'fail', 'osdThree');
            }
        },
        updateModel: function(model) {
            var attr = model.attributes;
            var total = attr.ok.count + attr.warn.count + attr.critical.count;
            this.state = [];
            this.count = 0;
            this.position = 0;
            if (attr.length === 0) {
                return;
            }
            this.ui.osdOne.addClass('osd-hidden');
            this.ui.osdTwo.addClass('osd-hidden');
            this.ui.osdThree.addClass('osd-hidden');
            if (attr.ok.count) {
                this.count += 1;
                this.state.push('one');
            }
            if (attr.warn.count) {
                this.count += 1;
                this.state.push('two');
                this.ui.osdOne.removeClass('osd-hidden');
                this.ui.osdTwo.removeClass('osd-hidden');
            }
            if (attr.critical.count) {
                this.count += 1;
                this.state.push('three');
                this.ui.osdOne.removeClass('osd-hidden');
                this.ui.osdThree.removeClass('osd-hidden');
            }
            this.model.set('total', total, { silent: true });
            this.updateView();
        }
    });

    return OsdView;
});
