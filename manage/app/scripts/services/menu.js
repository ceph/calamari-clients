/* global define */
(function() {
    'use strict';
    define(['lodash'], function(_) {
        var Service = function() {
            this.menus = [{
                    label: 'CLUSTER',
                    id: 'cluster',
                    href: '/#',
                    active: true
                }, {
                    label: 'OSD',
                    id: 'osd',
                    href: '/#osd',
                    active: false
                }, {
                    label: 'POOLS',
                    id: 'pool',
                    href: '/#pool',
                    active: false
                }, {
                    label: 'TOOLS',
                    id: 'tools',
                    href: '/#tools',
                    active: false
                }
            ];
        };
        Service.prototype = _.extend(Service.prototype, {
            setActive: function(menuId) {
                this.menus = _.map(this.menus, function(menu) {
                    menu.active = menu.id === menuId;
                    return menu;
                });
            },
            getMenus: function() {
                return this.menus;
            }
        });
        return [Service];
    });
})();
