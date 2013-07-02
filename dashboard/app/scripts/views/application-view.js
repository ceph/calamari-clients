/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', '../models/application-model'], function($, _, Backbone, JST, model) {
    'use strict';

    var ApplicationView = Backbone.View.extend({
        tagName: 'tbody',
        template: JST['app/scripts/templates/application.ejs'],
        initialize: function() {
            this.model = new model.OSDModel();
            this.listenTo(this.model, 'change', this.render);
            _.bindAll(this, 'animationFinished');
        },
        animationFinished: function() {
            if (this.$el.hasClass('part1')) {
                //console.log('done with part1');
                this.$el.html(this.template(this.model.toJSON()));
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
