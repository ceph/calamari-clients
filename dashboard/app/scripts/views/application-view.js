/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', '../models/application-model', 'humanize'], function($, _, Backbone, JST, model, humanize) {
    'use strict';

    var ApplicationView = Backbone.View.extend({
        tagName: 'tbody',
        template: JST['app/scripts/templates/application.ejs'],
        initialize: function() {
            this.model = new model.OSDModel();
            this.listenTo(this.model, 'change', this.render);
            _.bindAll(this, 'animationFinished', 'toJSON');
        },
        toJSON: function() {
            var model = this.model.toJSON();
            model.created = humanize.date('Y-M-d H:i', model.created / 1000);
            model.modified = humanize.date('Y-M-d H:i', model.modified / 1000);
            model.status = model.up && model['in'] ? 'up/in' : model.up && !model['in'] ? 'up/out' : 'down';
            return model;
        },
        animationFinished: function() {
            if (this.$el.hasClass('part1')) {
                //console.log('done with part1');
                this.$el.html(this.template(this.toJSON()));
                this.$el.removeClass().addClass('fadeInAnim part2');
            } else if (this.$el.hasClass('part2')) {
                this.$el.removeClass();
                this.$el.off('webkitAnimationEnd animationend', this.animationFinished);
            }
        },
        render: function() {
            //          console.log(this.model.toJSON());
            this.$el.on('webkitAnimationEnd animationend', this.animationFinished);
            this.$el.addClass('part1 fadeOutAnim');
        }
    });

    return ApplicationView;
});
