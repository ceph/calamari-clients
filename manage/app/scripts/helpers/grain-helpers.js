/*global define */ (function() {
    'use strict';
    define(['lodash'], function(_) {

        function formatCpuFlags(flags) {
            if (flags) {
                return flags.join(', ');
            }
            return '';
        }

        function formatIPAddresses(ips) {
            if (ips) {
                return ips.join(', ');
            }
            return '';
        }

        function formatInterfaces(interfaces) {
            if (interfaces) {
                return _.reduce(interfaces, function(results, value, key) {
                    results.push(key + ': ' + value);
                    return results;
                }, []).join(', ');
            }
            return '';
        }
        return {
            formatCpuFlags: formatCpuFlags,
            formatIPAddresses: formatIPAddresses,
            formatInterfaces: formatInterfaces
        };
    });
})();
