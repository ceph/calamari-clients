/* global define */
(function() {
    'use strict';
    define(['lodash'], function(_) {
        // **MenuService**
        // Menu service keeps track of the currently active menu entry.
        //
        // **Constructor**
        var Service = function() {
            this.menus = [{
                    label: 'Cluster',
                    id: 'cluster',
                    href: '/',
                    active: true
                }, {
                    label: 'OSD',
                    id: 'osd',
                    href: '/osd',
                    active: false
                }, {
                    label: 'Pools',
                    id: 'pool',
                    href: '/pool',
                    active: false
                }, {
                    label: 'Logs',
                    id: 'tools',
                    href: '/tools',
                    active: false
                }
            ];
        };
        Service.prototype = _.extend(Service.prototype, {
            // Change the active menu item
            setActive: function(menuId) {
                this.menus = _.map(this.menus, function(menu) {
                    menu.active = menu.id === menuId;
                    return menu;
                });
            },
            // Get the current menu metadata
            getMenus: function() {
                return this.menus;
            }
        });
        return [Service];
    });
})();
