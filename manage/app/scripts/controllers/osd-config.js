/* global define */
(function() {
    'use strict';
    define(['angular', 'lodash'], function(angular, _) {
        var OSDConfigController = function($log, $scope, ClusterService, OSDConfigService, $location) {
            $scope.helpInfo = function($event) {
                var $el = angular.element($event.target);
                var id = $el.attr('data-target');
                if (id !== undefined) {
                    $log.debug('helpInfo ' + $el.attr('data-target'));
                    $scope.helpDiv = id;
                }
            };
            $scope.reset = function() {
                $scope.configs = angular.copy($scope.defaults);
                $scope.osdmapForm.$setPristine();
            };
            if (ClusterService.clusterId === null) {
                $location.path('/first');
                return;
            }
            ClusterService.get().then(function(cluster) {
                $scope.clusterName = cluster.name;
            });
            $scope.cancel = function() {
                $location.path('/');
            };
            OSDConfigService.get().then(function(config) {
                $scope.configs = _.reduce(['pause', 'nobackfill', 'noout', 'nodeep-scrub', 'noscrub', 'noin', 'noup', 'norecover', 'nodown'], function(result, key) {
                    result[key] = config[key];
                    return result;
                }, {});
                $scope.defaults = angular.copy($scope.configs);
                $scope.up = true;
                $scope.$watch('configs.pause', function(newValue) {
                    console.log(newValue);
                });
            });
        };
        return ['$log', '$scope', 'ClusterService', 'OSDConfigService', '$location', OSDConfigController];
    });
})();
