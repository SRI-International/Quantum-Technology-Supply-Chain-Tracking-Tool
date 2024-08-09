# Gremlin-Visualizer
This project is to visualize and edit the graph network corresponding to a gremlin query.

## Setting Up Gremlin Visualizer
To set up gremlin visualizer, you need to have `node.js` and `npm` installed in your system.

* Clone the project
```sh
git clone https://github.com/SRI-International/gremlin-visualizer.git
```
* Install dependencies
```sh
npm install
```
* Run the project
```sh
npm start
```
* Open the browser and navigate to
```sh
http://localhost:3000
```

Note - Frontend starts on port 3000 and simple Node.js server also starts on port 3001. If you need to change the ports, configure in `package.json`, `proxy-server.js`, `src/constants.js` 

### Setting up with Docker

You can build a Docker image of the gremlin visualizer with the included `Dockerfile`.
This will use the current version of the `master` branch of the source GitHub repository.
The Docker image can be built by calling the `docker build` command, for example:

```sh
docker build --tag=gremlin-visualizer:latest .
```

The Docker image can then be run by calling `docker run` and exposing the necessary ports for communication. See [Docker's documentation](https://docs.docker.com/engine/reference/commandline/run/) for more options on how to run the image.

```sh
docker run --rm -d -p 3000:3000 -p 3001:3001 --name=gremlin-visualizer --add-host=host.docker.internal:host-gateway gremlin-visualizer:latest
```
Note that `--add-host=host.docker.internal:host-gateway` is not needed if you don't run your gremlin server in the host machine. 
If trying to access a gremlin server on `localhost`, set `host.docker.internal` in the gremlin-visualizer settings instead.

The Docker container can be stopped by calling `docker stop gremlin-visualizer`.

## Usage
* Start Gremlin-Visualizer as mentioned above
* Start or tunnel a gremlin server
* Specify the host and port of the gremlin server
* Write a gremlin query to retrieve a set of nodes (eg. `g.V()`)

### Adding Nodes and Edges
Shift-clicking in empty space will open a dialog to add a new node to the graph.

Shift-click-drag between two nodes will add an edge.

### Query Builder Tab
Select a node type: Component, Entity, or Material
Under the "Where" section
  - "WHERE" dropdown indicates the property name.
  - "CLAUSE" dropdown indicates the comparator to use(< is less than, <= is less than or equal to, > is greater than, >= is greater than or equal to, == is equals)
  - The right-most text field is the value to use.
  - add additional "And" or "Or" conditions by clicking buttons.
  - submit to run the query. Matching nodes will be in the graph and Table View and final query run will be in query history.
    
Query conditions are run left to right.
For example:
  Select "Entity" WHERE name == "FormFactor" AND country == "United States" OR risk == "low" AND type == "Manufacturer"
  with parentheses is ((name == "FormFactor" && country == "United States") || risk == "low") && (type == "Manufacturer")

### Adding Custom Icons
Add icons into the src/assets/icons folder.
Edit src/assets/icons.ts to add a mapping for node type to icon.

Example:
```typescript
const icons: Record<string, string> = {
  person: require("./icons/person.jpg"),
};
```
This would render person.jpg for all nodes with the 'person' type label. Capitalization matters.

### Custom Node Labels
To configure the initial displayed node labels, edit INITIAL_LABEL_MAPPINGS in src/constants.js.
Maps the value of the given node property to the display label of the given node type.
Example:
```typescript
export const INITIAL_LABEL_MAPPINGS = {
  person: 'name'
}
```
This would set the default display label to the name property on nodes with type 'person'. Capitalization matters.

### Changing Graph Visualization Implementation
The graph can be rendered with vis-network, cytoscapejs, or sigmajs.
The default is vis-network.
To change the graph implementation, edit src/constants.js and change GRAPH_IMPL.
The possible values are 'vis', 'cytoscape', or 'sigma'.
Available layouts algorithms are specific to each graph implementation.

## Features
* If you don't clear the graph and execute another gremlin query, results of previous query and new query will be merged and be shown.
* Node and edge properties are shown once you click on a node/edge
* Change the labels of nodes to any property
* View the set of queries executed to generate the graph
* Traverse in/out from the selected node
* Edit, add, or remove properties to existing nodes and edges
* Add new nodes and edges
* Change layout algorithm
* Save and restore node positions into layout
* Customize node icons and labels base on node types
* Vis-network, cytoscape, and sigma graph rendering engines
