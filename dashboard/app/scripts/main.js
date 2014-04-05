/*global require */
'use strict';

require.config({
    shim: {
        bootstrap: {
            deps: ['jquery'],
            exports: 'jquery'
        },
        gauge: {
            deps: ['jquery'],
            exports: 'Gauge'
        },
        flotr2: {
            deps: ['bean', 'underscore']
        },
        raphael: {
            exports: 'Raphael'
        },
        'bootstrap-switch': {
            deps: ['bootstrap']
        },
        'noty': {
            deps: ['jquery'],
            exports: 'noty'
        },
        'notylayoutTop': {
            deps: ['noty']
        },
        'notylayoutRight': {
            deps: ['noty']
        },
        'notytheme': {
            deps: ['notylayoutTop', 'notylayoutTopRight']
        },
        'popover': {
            deps: ['modal']
        },
        'l20n': {
            exports: 'L20n'
        }
    },
    paths: {
        kinetic: 'vendor/kinetic-v4.7.3',
        application: 'application',
        faker: '../bower_components/Faker/Faker',
        jquery: '../bower_components/jquery/jquery',
        noty: '../bower_components/noty/js/noty/jquery.noty',
        notylayoutTop: '../bower_components/noty/js/noty/layouts/top',
        notylayoutTopRight: '../bower_components/noty/js/noty/layouts/topRight',
        notytheme: '../bower_components/noty/js/noty/themes/default',
        backbone: '../bower_components/backbone-amd/backbone',
        underscore: '../bower_components/underscore-amd/underscore',
        bootstrap: 'vendor/bootstrap',
        popover: '../bower_components/sass-bootstrap/js/popover',
        modal: '../bower_components/sass-bootstrap/js/modal',
        gauge: 'vendor/gauge',
        bean: '../bower_components/bean/bean',
        'backbone.babysitter': '../bower_components/backbone.babysitter/lib/amd/backbone.babysitter',
        'backbone.wreqr': '../bower_components/backbone.wreqr/lib/amd/backbone.wreqr',
        flotr2: 'vendor/flotr2.amd',
        raphael: 'vendor/raphael',
        humanize: 'vendor/humanize',
        'bootstrap-switch': '../bower_components/bootstrap-switch/static/js/bootstrap-switch',
        statemachine: '../bower_components/javascript-state-machine/state-machine',
        marionette: '../bower_components/backbone.marionette/lib/core/amd/backbone.marionette',
        gitcommit: 'git',
        dygraphs: 'vendor/dygraph-combined',
        react: '../bower_components/react/react-with-addons',
        loglevel: '../bower_components/loglevel/dist/loglevel',
        l20n: 'vendor/l20n.min',
        l20nCtx: 'l20nCtxPlugin',
        jsuri: '../bower_components/jsuri/Uri',
        idbwrapper: '../bower_components/idbwrapper/idbstore',
        q: '../bower_components/q/q',
        moment: '../bower_components/momentjs/moment'
    }
});

require(['./app'], function() {});
