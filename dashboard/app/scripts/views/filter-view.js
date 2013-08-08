/*global define*/
define(['jquery', 'underscore', 'backbone', 'templates', 'marionette'], function($, _, Backbone, JST) {
    'use strict';

    /*
     * FilterView
     */
    return Backbone.Marionette.ItemView.extend({
        className: 'filter span2',
        template: JST['app/scripts/templates/filter.ejs'],
        events: {
            'click .label': 'clickHandler'
        },
        initialize: function() {
            Backbone.Marionette.getOption(this, 'App');
        },
        clickHandler: function(evt) {
            var $target = $(evt.target);
            console.log($target.attr('data-filter'));
        }
    });
});
