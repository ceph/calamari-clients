/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', '../models/application-model'], function($, _, Backbone, JST, model) {
    'use strict';

    var ApplicationView = Backbone.View.extend({
        tagName: 'tbody',
        template: JST['app/scripts/templates/application.ejs'],
        initialize: function() {
            this.model = new model.OSDModel();
            this.listenTo(this.model, 'change', this.render);
        },
        render: function() {
//          console.log(this.model.toJSON());
            this.$el.html(this.template(this.model.toJSON()));
        }
    });

    return ApplicationView;
});
