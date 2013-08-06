/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', '../models/application-model', 'humanize', 'helpers/animation'], function($, _, Backbone, JST, model, humanize, animation) {
    'use strict';

    var OSDDetailView = Backbone.Marionette.ItemView.extend({
        tagName: 'dev',
        className: 'detail span2',
        template: JST['app/scripts/templates/osd-details.ejs'],
        initialize: function(options) {
            this.fadeInOutAnimation = animation.pair('fadeOutRightToLeftAnim', 'fadeInRightToLeftAnim');
            _.bindAll(this, 'clearDetail', 'fadeInOutAnimation');
            this.model = new model.OSDModel();
            this.listenTo(this.model, 'change', this.render);
            if (options.App !== undefined) {
                this.App = options.App;
                this.App.vent.on('status:healthok status:healthwarn', this.clearDetail);
            }
        },
        clearDetail: function() {
            this.fadeInOutAnimation(this.$el, function() {
                this.$el.text('No OSD Selected');
            });
        },
        serializeData: function() {
            var model = this.model.toJSON();
            model.status = model.up && model['in'] ? 'up/in' : model.up && !model['in'] ? 'up/out' : 'down';
            return model;
        },
        render: function() {
            this.fadeInOutAnimation(this.$el, function() {
                this.$el.html(this.template(this.serializeData()));
            });
        }
    });

    return OSDDetailView;
});
