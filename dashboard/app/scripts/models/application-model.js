/*global define*/

define(['underscore', 'backbone', 'models/osd-model', 'models/usage-model', 'models/health-model', 'models/status-model', 'models/graph-model', 'models/graphite-cpu-model', 'models/graphite-iostat-model', 'models/graphite-net-model', 'marionette'], function(_, Backbone, OSD, Usage, Health, Status, Graph, GraphiteCPU, GraphiteIO, GraphiteNet) {
    'use strict';

    // All Models
    // ---------
    //
    return {
        OSDModel: OSD,
        UsageModel: Usage,
        HealthModel: Health,
        StatusModel: Status,
        GraphModel: Graph,
        GraphiteCPUModel: GraphiteCPU,
        GraphiteIOModel: GraphiteIO,
        GraphiteNetModel: GraphiteNet
    };
});
