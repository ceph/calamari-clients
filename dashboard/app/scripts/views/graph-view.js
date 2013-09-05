/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'marionette' ], function($, _, Backbone, JST) {
    'use strict';

    var GraphView = Backbone.Marionette.ItemView.extend({
        className: 'graph span3',
        template: JST['app/scripts/templates/graph.ejs'],
        serializeData: function() {
            var url = this.model.get('origin') + '/render?format=' + this.model.get('format') + '&target=' + _.reduce(this.model.get('target'), function(memo, value) {
                return memo + '&target=' + value;
            });
            return {
                url: url
            };
        }
    });

    return GraphView;
});
