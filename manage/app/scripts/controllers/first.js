/* global define */
(function() {
    'use strict';
    define(['lodash', 'helpers/modal-helpers'], function(_) {

        var clusterPollIntervalMs = 1000;
        // **FirstTimeController** should only be invoked on a fresh Calamari install where there are
        // no currently accepted cluster hosts. Calamari root.js detects this condition by requesting a list of
        // the current clusters and if there are none, redirects to this controller.
        //
        // We handle the initial bootstrapping of Calamari by offering a visual way for the end-user
        // to accept all the registered hosts. This makes the assumption that they are all members of
        // the same cluster. Something which may not necessarily be true if this is a multi-cluster
        // installation.
        //
        var FirstTimeController = function($q, $log, $timeout, $location, $scope, KeyService, ClusterService, $modal) {
            var promises = [KeyService.getList()];
            // Start the view out with adds disabled via ng-disabled
            $scope.addDisabled = true;
            // Used to show more detail debug info in view
            $scope.debug = false;
            // Display an alternate message is we can't discover a cluster in a reasonable amount
            // of time. e.g. 3 minutes.
            $scope.clusterDiscoveryTimedOut = false;
            $q.all(promises).then(function(results) {

                // **up** is used to control whether the view is rendered yet via ng-show.
                $scope.up = true;
                if (ClusterService.clusterId !== null) {
                    // The user has navigated to this URL erroneously, send them back to
                    // the default cluster page.
                    $location.path('/');
                    return;
                }

                // Process the returned list of server minion key states.
                (function(keys) {
                    // Bucket the keys in **pre**, **accepted** and **blocked** sets.
                    // We really only care about accepted ones.
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
                    // Re-enable add button via ng-disabled
                    $scope.addDisabled = false;

                    // Install the click event handler.
                    $scope.acceptAll = function() {
                        // get the ids of all pre-accepted hosts
                        var ids = _.map($scope.hosts.pre, function(key) {
                            return key.id;
                        });
                        $log.debug(ids);
                        // Disable add button via ng-disabled because we are now done
                        // unless there is an error.
                        $scope.addDisabled = true;

                        // Create a modal we will show while we are waiting for Calamari to accept
                        // the servers.
                        var modal = $modal({
                            'title': '<i class="text-success fa fa-check-circle fa-lg"></i> Accept Request Sent',
                            'template': 'views/new-install-modal.html',
                            'content': '<p><i class="fa fa-spinner fa-spin"></i> Waiting for First Cluster to Join</p>',
                            'backdrop': 'static',
                            'html': true
                        });
                        // Disable closing of the modal while we are in this state.
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
                                    // A Cluster is now available. Release the modal
                                    // lockdown and tell the user.
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
                            // Uh-oh, an error occurred. Tell the user.
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
