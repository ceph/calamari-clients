/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'helpers/animation', 'marionette'], function($, _, Backbone, JST, animation) {
    'use strict';

    var PgView = Backbone.Marionette.ItemView.extend({
        className: 'gauge card pg',
        template: JST['app/scripts/templates/pg-view.ejs'],
        ui: {
            'spinner': '.fa-spinner'
        },
        initialize: function() {
            _.bindAll(this, 'disappear', 'reappear', 'expand', 'collapse');
            this.model = new Backbone.Model();
            this.disappearAnimation = animation.single('fadeOutUpAnim');
            this.reappearAnimation = animation.single('fadeInDownAnim');
            this.App = Backbone.Marionette.getOption(this, 'App');
            if (this.App) {
//                this.listenTo(this.App.vent, 'status:update', this.set);
                this.listenTo(this.App.vent, 'gauges:disappear', this.disappear);
                this.listenTo(this.App.vent, 'gauges:reappear', this.reappear);
                this.listenTo(this.App.vent, 'gauges:collapse', this.collapse);
                this.listenTo(this.App.vent, 'gauges:expand', this.expand);
            }
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
        }
    });

    return PgView;
});
