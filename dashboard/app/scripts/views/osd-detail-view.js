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
                this.$el.hide();
            }
        },
        hide: function() {
            this.state = 'fullscreen';
            this.$el.hide().addClass('popover');
        },
        show: function() {
            this.state = 'dashboard';
            this.render();
            this.$el.show().removeClass('popover');
        },
        clearDetail: function() {
            this.replaceAnimation(this.$el, function() {
                this.$el.text('No OSD Selected');
            });
        },
        serializeData: function() {
            var model = this.model.toJSON();
            model.status = model.up && model['in'] ? 'up/in' : model.up && !model['in'] ? 'up/out' : 'down';
            return model;
        },
        render: function() {
            if (this.state === 'dashboard') {
                this.replaceAnimation(this.$el, function() {
                    this.$el.html(this.template(this.serializeData()));
                });
                return;
            }
            if (this.state === 'fullscreen') {
                this.$el.show();
                this.$el.html(this.template(this.serializeData()));
            }
        }
    });

    return OSDDetailView;
});
