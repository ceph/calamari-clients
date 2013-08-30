/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', '../models/application-model', 'humanize', 'helpers/animation'], function($, _, Backbone, JST, model, humanize, animation) {
    'use strict';

    var OSDDetailView = Backbone.Marionette.ItemView.extend({
        tagName: 'div',
        template: JST['app/scripts/templates/osd-details-full.ejs'],
        state: 'dashboard',
        events: {
            'click .icon-remove': 'removeDialog',
            'click .icon-bar-chart': 'goToGraph'
        },
        ui: {},
        initialize: function(options) {
            this.replaceAnimation = animation.pair('fadeOutRightToLeftAnim', 'fadeInRightToLeftAnim');
            this.popInAnimation = animation.single('DialogInAnim');
            this.fadeOutAnimation = animation.single('fadeOutAnim');
            _.bindAll(this, 'clearDetail', 'template', 'replaceAnimation', 'toFullscreen', 'toDashboard', 'removeDialog');
            this.model = new model.OSDModel();
            this.listenTo(this.model, 'change', this.render);
            if (options.App !== undefined) {
                this.App = options.App;
                this.listenTo(this.App.vent, 'status:healthok status:healthwarn', this.clearDetail);
                this.listenTo(this.App.vent, 'viz:fullscreen', this.toFullscreen);
                this.listenTo(this.App.vent, 'viz:dashboard', this.toDashboard);
                this.listenTo(this.App.vent, 'escapekey', this.removeDialog);
            }
        },
        goToGraph: function(evt) {
            evt.stopPropagation();
            evt.preventDefault();
            this.App.vent.trigger('app:graph', this.model.get('host'));
        },
        set: function(attr) {
            this.model.clear({
                silent: true
            }).set(attr);
        },
        removeDialog: function() {
            if (this.state === 'fullscreen') {
                var self = this;
                return this.fadeOutAnimation(this.ui.detail).then(function() {
                    self.$el.css('display', 'none');
                });
            }
        },
        toFullscreen: function() {
            this.state = 'fullscreen';
            this.hide().addClass('detail-outer-popover');
            this.ui.detail = this.$('.detail');
        },
        toDashboard: function() {
            this.state = 'dashboard';
            this.hide().removeClass('detail-outer-popover');
        },
        isVisible: function() {
            return this.$el.is(':visible');
        },
        clearDetail: function() {
            if (!this.isVisible() || this.state === 'dashboard') {
                return;
            }
            return this.removeDialog();
        },
        statusLabel: ['down', 'down/in', 'up/out', 'up/in'],
        serializeData: function() {
            var model = this.model.toJSON();
            var index = 0;
            if (model['in']) {
                index += 1;
            }
            if (model.up) {
                index += 2;
            }
            model.status = this.statusLabel[index];
            return model;
        },
        show: function() {
            return this.$el.css('display', 'block');
        },
        hide: function() {
            return this.$el.css('display', 'none');
        },
        render: function() {
            if (this.state === 'dashboard') {
                return;
            }
            if (this.state === 'fullscreen') {
                this.ui.detail.html(this.template(this.serializeData()));
                this.$el.removeClass('detail-outer-top-left detail-outer-top-right detail-outer-bottom-left detail-outer-bottom-right').addClass(this.model.get('clazz'));
                var d = $.Deferred();
                var placement = 'right';
                if (this.model.get('clazz').indexOf('right') !== -1) {
                    // make popver appear to the left if dialog is on right
                    placement = 'left';
                }
                var self = this;
                d.promise().then(function() {
                    var pools = self.model.get('pools');
                    var $sign = self.$('.icon-info-sign');
                    $sign.popover({
                        title: 'Pool Membership',
                        content: pools.join(', '),
                        trigger: 'hover',
                        container: 'body',
                        placement: placement
                    });
                    var pgs = self.model.get('pg_states') || [];
                    var $cloud = self.$('.icon-cloud');
                    $cloud.popover({
                        title: 'PG States',
                        content: _.flatten(pgs).join(', '),
                        trigger: 'hover',
                        container: 'body',
                        placement: placement
                    });
                });
                if (this.isVisible()) {
                    return this.replaceAnimation(this.ui.detail, function() {
                        d.resolve();
                    });
                } else {
                    this.show();
                    return this.popInAnimation(this.ui.detail, function() {
                        d.resolve();
                    });
                }
            }
        }
    });

    return OSDDetailView;
});
