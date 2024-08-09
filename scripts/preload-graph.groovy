g = traversal().withRemote(DriverRemoteConnection.using('gremlin-server', 8182))

def execute() {
    def count = g.V().hasLabel("Entity").has("name", "China Northern Rare").count().next()
    def exists = count > 0
    if (!exists) {   
        g.io('/app/graph.graphml').with(IO.reader, IO.graphml).read().iterate()
    }
}
execute()