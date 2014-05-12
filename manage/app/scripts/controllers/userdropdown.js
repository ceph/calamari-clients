/* global define */
(function() {
    'use strict';
    define(['lodash'], function() {

        var UserDropDownController = function($location, $scope, ClusterResolver, ClusterService, UserService, config, $modal, $http) {
            ClusterResolver.then(function() {
                if (ClusterService.clusterId === null) {
                    $location.path(config.getFirstViewPath());
                    return;
                }
                $scope.userdropdownTemplate = 'views/userdropdown.html';
                $scope.clusterName = ClusterService.clusterModel.name;
                UserService.me().then(function(me) {
                    $scope.username = me.username;
                    $scope.userdropdown = [{
                            'clazz': 'fa fa-user fa-lg fa-2x fa-fw',
                            userinfo: true
                        }, {
                            divider: true
                        }, {
                            'text': '<i class="fa fa-fw fa-info-circle"></i> About Calamari',
                            'click': function($event) {
                                $event.preventDefault();
                                $event.stopPropagation();
                                var modal = $modal({
                                    title: '<i class="fa fa-lg fa-info-circle"></i> About Calamari',
                                    html: true,
                                    template: 'views/about-modal.html'
                                });
                                modal.$scope.version = {
                                    calamariAPI: '1',
                                    client: window.inktank.commit
                                };
                                $http.get('/api/v2/info').then(function(resp) {
                                    if (resp.data.version) {
                                        modal.$scope.version.calamariAPI = resp.data.version;
                                    }
                                });
                            }
                        }, {
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
            });
        };
        return ['$location', '$scope', 'ClusterResolver', 'ClusterService', 'UserService', 'ConfigurationService', '$modal', '$http', UserDropDownController];
    });
})();
