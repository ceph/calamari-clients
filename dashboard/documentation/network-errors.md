Sources of Network Errors
=========================

- network failure
  - this is likely common on mobile/laptop platforms
- timeout
  - the server doesn't respond in enough time
    - the server is temporarily unavailable due to load
    - the network is too slow due to long RTT
- api returns error codes
  - this could be incompatible API changes, *today the network code does no version checks*
  - the server has crashed on an API call
  - our authentication token has timed out and we need to reauthenticate
  - transient errors that are not critical
- calamari/kraken errors
  - kraken has stopped running
  - we infer this error by looking at how long since the last time the database was updated using a timestamp field.
  

 


Network Aware Objects
=====================

To avoid duplicating network code, most of the network code is dependent on **Backbone.Model.sync**. This provides a uniform interface that is easy to customize and has published documentation. Underlying sync is jQuery.Ajax which has a reasonable Deferred based implementation.


Models
------

model | subsystem | api | desc |
------|-----------|-------------
graphite-net-model| graphite | TBD |
graphite-cpu-model| graphite | TBD |
health-model | calamari | api/v1/cluster/{id}/health | |
status-model | calamari | api/v1/cluster/{id}/health_counters | |
usage-model | calamari | api/v1/cluster/{id}/space | |


Collections
-----------

collection | subsystem | api | desc|
-----------|-----------|-----|------
cluster-collection | calamari | api/v1/cluster| |
osd-collection | calamari | api/v1/cluster/{id}/osd| |