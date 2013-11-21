/*global define*/
/* jshint -W106, -W069*/
define(['jquery', 'underscore', 'backbone', 'templates', 'marionette'], function($, _, Backbone, JST) {
    'use strict';

    return Backbone.Marionette.Layout.extend({
        className: 'row gauges',
        template: JST['app/scripts/templates/gauges.ejs'],
        regions: {
            a: {
                selector: '.one',
            },
            b: {
                selector: '.two',
            },
            c: {
                selector: '.three',
            },
            d: {
                selector: '.four',
            }
        }
    });
});
