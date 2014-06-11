/* global define */
(function() {
    'use strict';
    define(['lodash', 'helpers/modal-helpers'], function(_) {

        var clusterPollIntervalMs = 1000;
        var FirstTimeController = function($q, $log, $timeout, $location, $scope, KeyService, ClusterService, $modal) {
            var promises = [KeyService.getList()];
            $scope.addDisabled = true;
            // Used to show more detail debug info in view
            $scope.debug = false;
            // Display an alternate message is we can't discover a cluster in a reasonable amount
            // of time. e.g. 3 minutes.
            $scope.clusterDiscoveryTimedOut = false;
            $q.all(promises).then(function(results) {

                $scope.up = true;
                if (ClusterService.clusterId !== null) {
                    $location.path('/');
                    return;
                }

                (function(keys) {
                    $scope.hosts = _.reduce(keys, function(result, key) {
                        if (key.status === 'pre') {
                            result.pre.push(key);
                        } else if (key.status === 'accepted') {
                            result.accepted.push(key);
                        } else {
                            result.blocked.push(key);
                        }
                        return result;
                    }, {
                        accepted: [],
                        pre: [],
                        blocked: []
                    });
                    $scope.addDisabled = false;
                    $scope.acceptAll = function() {
                        var ids = _.map($scope.hosts.pre, function(key) {
                            return key.id;
                        });
                        $log.debug(ids);
                        $scope.addDisabled = true;
                        var modal = $modal({
                            'title': '<i class="text-success fa fa-check-circle fa-lg"></i> Accept Request Sent',
                            'template': 'views/new-install-modal.html',
                            'content': '<p><i class="fa fa-spinner fa-spin"></i> Waiting for First Cluster to Join</p>',
                            'backdrop': 'static',
                            'html': true
                        });
                        modal.$scope.closeDisabled = true;

                        // Cache original $hide before it gets wrapped
                        var _$hide = modal.$scope.$hide;
                        modal.$scope.skipClusterCheck = function() {
                            _$hide();
                            $scope.clusterDiscoveryTimedOut = true;
                        };

                        // Decorate the $hide method from angular-strap so we can
                        // add some behavior to it.
                        modal.$scope.$hide = _.wrap(_$hide, function($hide) {
                            $hide();
                            ClusterService.initialize().then(function() {
                                $location.path('/');
                            });
                        });

                        // Helper to poll Calamari until the cluster API responds
                        // with an actual cluster data structure.
                        function checkClusterUp() {
                            ClusterService.getList().then(function(clusters) {
                                if (clusters.length) {
                                    modal.$scope.closeDisabled = false;
                                    modal.$scope.content = 'Cluster Initialized.';
                                    return;
                                }
                                // Schedule poll again - Calamari is still working.
                                $scope.checkTimeout = $timeout(checkClusterUp, clusterPollIntervalMs);
                            });
                        }

                        // Create an elapsed counter for joining the cluster.
                        modal.$scope.elapsed = 180;
                        function increment() {
                            modal.$scope.elapsed--;
                            $scope.elapsedTimeout = $timeout(increment, 1000);
                        }
                        // Send the Accept command to Calamari and start polling.
                        KeyService.accept(ids).then(function(resp) {
                            $log.debug(resp);
                            if (resp.status === 204) {
                                // Start polling loop
                                $scope.checkTimeout = $timeout(checkClusterUp, clusterPollIntervalMs);
                                $timeout(function() {
                                    // Wait 3 minutes and then pop up a warning about no cluster being
                                    // available from Calamari.
                                    $timeout.cancel($scope.checkTimeout);
                                    $timeout.cancel($scope.elapsedTimeout);
                                    $scope.clusterDiscoveryTimedOut = true;
                                    _$hide();
                                }, 3 * 60 * 1000);
                                // 3 mins as Miillis
                                $scope.elapsedTimeout = $timeout(increment, 0);
                            }
                            $scope.addDisabled = false;

                        }, function(resp) {
                            modal.$scope.content = '<i class="text-danger fa fa-exclamation-circle fa-lg"></i> Error ' + resp.status + '. Please try reloading the page and logging in again.</p><h4>Raw Response</h4><p><pre>' + resp.data + '</pre></p>';
                            $scope.addDisabled = false;
                        });
                        return;
                    };
                })(results[0]);


            });
        };
        return ['$q', '$log', '$timeout', '$location', '$scope', 'KeyService', 'ClusterService', '$modal', FirstTimeController];
    });
})();
