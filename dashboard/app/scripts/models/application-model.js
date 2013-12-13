/*global define*/

define(['underscore', 'backbone', 'models/osd-model', 'models/usage-model', 'models/health-model', 'models/status-model', 'models/server-model', 'models/pool-model', 'models/graph-model', 'models/graphite-cpu-model', 'models/graphite-iostat-model', 'models/graphite-net-model', 'models/graphite-pool-iops-model', 'marionette'], function(_, Backbone, OSD, Usage, Health, Status, Server, Pool, Graph, GraphiteCPU, GraphiteIO, GraphiteNet, GraphitePoolIOPS) {
    'use strict';

    // All Models
    // ---------
    //
    return {
        OSDModel: OSD,
        UsageModel: Usage,
        HealthModel: Health,
        StatusModel: Status,
        ServerModel: Server,
        PoolModel: Pool,
        GraphModel: Graph,
        GraphiteCPUModel: GraphiteCPU,
        GraphiteIOModel: GraphiteIO,
        GraphiteNetModel: GraphiteNet,
        GraphitePoolIOPSModel: GraphitePoolIOPS
    };
});
