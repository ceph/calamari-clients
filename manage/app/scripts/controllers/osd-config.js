/* global define */
(function() {
    'use strict';
    define(['lodash'], function(_) {

        var OSDConfigController = function($scope, ClusterService, OSDConfigService, $location) {
            if (ClusterService.clusterId === null) {
                $location.path('/first');
                return;
            }
            ClusterService.get().then(function(cluster) {
                $scope.clusterName = cluster.name;
            });
            OSDConfigService.get().then(function(config) {
                $scope.up = true;
                $scope.config = _.reduce(['pause', 'nobackfill', 'noout', 'nodeep-scrub', 'noscrub', 'noin', 'noup', 'norecover', 'nodown'], function(result, key) {
                    result[key] = config[key];
                    return result;
                }, {});
            });
        };
        return ['$scope', 'ClusterService', 'OSDConfigService', '$location', OSDConfigController];
    });
})();
