/* global define */
(function() {
    'use strict';
    define(['lodash'], function() {

        var UserDropDownController = function($location, $scope, ClusterResolver, ClusterService, UserService) {
            ClusterResolver.then(function() {
                if (ClusterService.clusterId === null) {
                    $location.path('/first');
                    return;
                }
                $scope.userdropdownTemplate = 'views/userdropdown.html';
                $scope.clusterName = ClusterService.clusterModel.name;
                UserService.me().then(function(me) {
                    $scope.username = me.username;
                });
                $scope.userdropdown = [{
                        'text': '<i class="fa fa-fw fa-cogs"></i> Settings',
                        'href': '/admin/'
                    },
                    {
                        'text': '<i class="fa fa-fw fa-power-off"></i> Logout',
                        'click': function($event) {
                            $event.preventDefault();
                            $event.stopPropagation();
                            UserService.logout().then(function() {
                                document.location = '/login/';
                            });
                        }
                    }
                ];
            });
        };
        return ['$location', '$scope', 'ClusterResolver', 'ClusterService', 'UserService', UserDropDownController];
    });
})();
