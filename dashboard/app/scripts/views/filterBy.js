/*global define*/

define(['jquery', 'underscore', 'backbone', 'templates', 'marionette'], function($, _, Backbone, JST) {
    'use strict';

    var FilterbyView = Backbone.Marionette.ItemView.extend({
        current: 'OSD',
        initialize: function() {
            this.App = Backbone.Marionette.getOption(this, 'App');
            _.bindAll(this, 'postRender');
            this.listenTo(this, 'render', this.postRender);
        },
        postRender: function() {
            var $switch = this.$el.bootstrapSwitch();
            var self = this;
            $switch.on('switch-change', function() {
                var d = $.Deferred();
                $switch.bootstrapSwitch('setActive', false);
                if (self.current === 'OSD') {
                    self.App.vent.trigger('switcher:two', d);
                    self.current = 'PG';
                } else {
                    self.App.vent.trigger('switcher:one', d);
                    self.current = 'OSD';
                }
                d.done(function() {
                    $switch.bootstrapSwitch('setActive', true);
                });
            }).on('click', function(evt) {
                evt.stopPropagation();
                evt.preventDefault();
            });
        },
        template: JST['app/scripts/templates/filterBy.ejs']
    });

    return FilterbyView;
});
