/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', '../models/application-model', 'humanize', 'helpers/animation'], function($, _, Backbone, JST, model, humanize, animation) {
    'use strict';

    var OSDDetailView = Backbone.Marionette.ItemView.extend({
        tagName: 'div',
        className: 'detail span2',
        templateFullscreen: JST['app/scripts/templates/osd-details-full.ejs'],
        templateDashboard: JST['app/scripts/templates/osd-details.ejs'],
        template: function(args) {
            if (this.state === 'dashboard') {
                return this.templateDashboard.call(null, args);
            }
            return this.templateFullscreen.call(null, args);
        },
        state: 'dashboard',
        events: {
            'click .icon-remove': 'removeDialog'
        },
        initialize: function(options) {
            this.replaceAnimation = animation.pair('fadeOutRightToLeftAnim', 'fadeInRightToLeftAnim');
            this.popInAnimation = animation.single('DialogInAnim');
            this.fadeOutAnimation = animation.single('fadeOutAnim');
            _.bindAll(this, 'clearDetail', 'replaceAnimation', 'hide', 'show', 'removeDialog');
            this.model = new model.OSDModel();
            this.listenTo(this.model, 'change', this.render);
            if (options.App !== undefined) {
                this.App = options.App;
                this.listenTo(this.App.vent, 'status:healthok status:healthwarn', this.clearDetail);
                this.listenTo(this.App.vent, 'viz:fullscreen', this.hide);
                this.listenTo(this.App.vent, 'viz:dashboard', this.show);
                this.listenTo(this.App.vent, 'escapekey', this.removeDialog);
            }
        },
        removeDialog: function() {
            if (this.state === 'fullscreen') {
                var self = this;
                return this.fadeOutAnimation(this.$el).then(function() {
                    self.$el.css('display', 'none');
                });
            }
        },
        hide: function() {
            this.state = 'fullscreen';
            this.$el.hide().addClass('detail-popover');
            this.$el.closest('.detail-outer').addClass('detail-outer-popover');
        },
        show: function() {
            this.state = 'dashboard';
            this.render();
            this.$el.closest('.detail-outer').removeClass('detail-outer-popover');
            this.$el.show().removeClass('detail-popover');
        },
        clearDetail: function() {
            if (!this.$el.is(':visible')) {
                return;
            }
            if (this.state === 'dashboard') {
                return this.replaceAnimation(this.$el, function() {
                    this.$el.text('No OSD Selected');
                });
            }
            return this.removeDialog();
        },
        serializeData: function() {
            var model = this.model.toJSON();
            model.status = model.up && model['in'] ? 'up/in' : model.up && !model['in'] ? 'up/out' : 'down';
            return model;
        },
        render: function() {
            if (this.state === 'dashboard') {
                return this.replaceAnimation(this.$el, function() {
                    this.$el.html(this.template(this.serializeData()));
                });
            }
            if (this.state === 'fullscreen') {
                this.$el.html(this.template(this.serializeData()));
                if (this.$el.is(':visible')) {
                    return this.replaceAnimation(this.$el);
                } else {
                    this.$el.css('display', 'block');
                    return this.popInAnimation(this.$el);
                }
            }
        }
    });

    return OSDDetailView;
});
