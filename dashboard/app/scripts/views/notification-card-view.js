/*global define*/
'use strict';
define(['jquery', 'underscore', 'collections/notifications', 'views/notification-collection-view'], function($, _, NC, NCV) {
    var collection = new NC();
    var view = new NCV({
        collection: collection
    });
    return {
        collection: collection,
        view: view
    };
});
