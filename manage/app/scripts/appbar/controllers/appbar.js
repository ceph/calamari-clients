/* global define */
(function() {
    'use strict';
    define(['lodash'], function(_) {
        var AppBarController = function($log, $scope, BroadcastService) {
            $scope.menus = [{
                    label: 'cluster',
                    target: 'cluster',
                    active: true
                }, {
                    label: 'osd',
                    target: 'osd',
                    active: false
                }, {
                    label: 'pool',
                    target: 'pool',
                    active: false
                }, {
                    label: 'tools',
                    target: 'tools',
                    active: false
                }
            ];
            $scope.template = 'views/appbar.html';
            $scope.route = function(target) {
                $log.debug('target=' + target);
                var menus = _.map($scope.menus, function(menu) {
                    menu.active = (menu.target === target);
                    return menu;
                });
                $scope.menus = menus;
                BroadcastService.emit('route', target);
            };
        };
        return ['$log', '$scope', 'BroadcastService', AppBarController];
    });

})();
