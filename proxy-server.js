const express = require('express');
const bodyParser = require('body-parser');
const gremlin = require('gremlin');
const cors = require('cors');
const app = express();
const port = 3001;
const fs = require('fs');
const path = require('path');

app.use(cors({
  credentials: true,
}));

// parse application/json
app.use(bodyParser.json());

const workspacesDirPath = path.join(__dirname, 'workspaces');
if (!fs.existsSync(workspacesDirPath)) {
  fs.mkdirSync(workspacesDirPath);
}


const readWorkspace = (name) => {
  const workspaceFilePath = path.join(workspacesDirPath, `${name}.json`);
  if (!fs.existsSync(workspaceFilePath)) {
    return null;
  }
  const workspaceData = fs.readFileSync(workspaceFilePath);
  return JSON.parse(workspaceData);
};


const writeWorkspace = (name, data) => {
  const workspaceFilePath = path.join(workspacesDirPath, `${name}.json`);
  fs.writeFileSync(workspaceFilePath, JSON.stringify(data, null, 2));
};

const deleteWorkspaceFile = (name) => {
  const workspaceFilePath = path.join(workspacesDirPath, `${name}.json`);
  if (fs.existsSync(workspaceFilePath)) {
    fs.unlinkSync(workspaceFilePath);
  }
};

app.post('/workspaces', (req, res) => {
  const newWorkspace = req.body;
  const name = newWorkspace.name;
  writeWorkspace(name, newWorkspace);
  res.status(201).send(newWorkspace);
});

app.get('/workspaces', (_req, res) => {
  const files = fs.readdirSync(workspacesDirPath);
  const workspaces = files.map(file => {
    const filePath = path.join(workspacesDirPath, file);
    const workspaceData = fs.readFileSync(filePath);
    return JSON.parse(workspaceData);
  });
  res.send(workspaces);
});

app.put('/workspaces/:name', (req, res) => {
  const name = req.params.name;
  const updatedWorkspace = req.body;
  if (readWorkspace(name)) {
    writeWorkspace(name, updatedWorkspace);
    res.send(updatedWorkspace);
  } else {
    res.status(404).send({ message: 'Workspace not found' });
  }
});

app.delete('/workspaces/:name', (req, res) => {
  const name = req.params.name;
  if (readWorkspace(name)) {
    deleteWorkspaceFile(name);
    res.status(204).send();
  } else {
    res.status(404).send({ message: 'Workspace not found' });
  }
});
function mapToObj(inputMap) {
  let obj = {};
  inputMap.forEach((value, key) => {
    obj[key] = value
  });

  return obj;
}

function edgesToJson(edgeList) {
  return edgeList.map(
    edge => ({
      id: typeof edge.get('id') !== "string" ? JSON.stringify(edge.get('id')) : edge.get('id'),
      from: edge.get('from'),
      to: edge.get('to'),
      label: edge.get('label'),
      properties: mapToObj(edge.get('properties')),
    })
  );
}

function nodesToJson(nodeList) {
  return nodeList.map(
    node => ({
      id: node.get('id'),
      label: node.get('label'),
      properties: mapToObj(node.get('properties')),
      edges: edgesToJson(node.get('edges'))
    })
  );
}

function queryEntityTablesProcessing(nodeList) {
  const uniqueNodes = new Map();
  nodeList.forEach(node => {
    const name = node.get('name');
    if (!uniqueNodes.has(name)) {
      uniqueNodes.set(name, {
        id: node.get('id'),
        name: name,
        level: node.get('level'),
        upstreamInput: node.get('upstreamInput')
      });
    }
  });
  return Array.from(uniqueNodes.values());
}
function queryEntitySupplierProcessing(nodeList) {
  const uniqueNodes = new Map();
  nodeList.forEach(node => {
    const name = node.get('name');
    if (!uniqueNodes.has(name)) {
      uniqueNodes.set(name, {
        id: node.get('id'),
        name: name,
        country: node.get('country'),
        risk: node.get('risk')
      });
    }
  });
  return Array.from(uniqueNodes.values());
}




function makeQuery(query, nodeLimit) {
  const nodeLimitQuery = !isNaN(nodeLimit) && Number(nodeLimit) > 0 ? `.limit(${nodeLimit})` : '';
  return `${query}${nodeLimitQuery}.dedup().as('node').project('id', 'label', 'properties', 'edges').by(__.id()).by(__.label()).by(__.valueMap().by(__.unfold())).by(__.outE().project('id', 'from', 'to', 'label', 'properties').by(__.id()).by(__.select('node').id()).by(__.inV().id()).by(__.label()).by(__.valueMap().by(__.unfold())).fold())`;

}

app.post('/query', (req, res, next) => {
  const gremlinHost = req.body.host;
  const gremlinPort = req.body.port;
  const nodeLimit = req.body.nodeLimit;
  const query = req.body.query;
  const isRawQuery = req.body.isRawQuery;
  const client = new gremlin.driver.Client(`ws://${gremlinHost}:${gremlinPort}/gremlin`, {
    traversalSource: 'g',
    mimeType: 'application/json'
  });
  client.submit(makeQuery(query, nodeLimit), {})
    .then((result) => {
      res.send(nodesToJson(result._items));
    })
    .catch((err) => {
      next(err);
    });

});

app.post('/query-raw', (req, res, next) => {
  const gremlinHost = req.body.host;
  const gremlinPort = req.body.port;
  const query = req.body.query;

  const client = new gremlin.driver.Client(`ws://${gremlinHost}:${gremlinPort}/gremlin`, {
    traversalSource: 'g',
    mimeType: 'application/json'
  });
  client.submit(query, {})
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      next(err);
    });
});


app.post('/query-entity-tables', (req, res, next) => {
  const gremlinHost = req.body.host;
  const gremlinPort = req.body.port;
  const query = req.body.query;

  const client = new gremlin.driver.Client(`ws://${gremlinHost}:${gremlinPort}/gremlin`, {
    traversalSource: 'g',
    mimeType: 'application/json'
  });
  client.submit(query, {})
    .then((result) => {
      res.send(queryEntityTablesProcessing(result._items));
    })
    .catch((err) => {
      next(err);
    });
});

app.post('/query-entity-supplier-tables', (req, res, next) => {
  const gremlinHost = req.body.host;
  const gremlinPort = req.body.port;
  const query = req.body.query;

  const client = new gremlin.driver.Client(`ws://${gremlinHost}:${gremlinPort}/gremlin`, {
    traversalSource: 'g',
    mimeType: 'application/json'
  });
  client.submit(query, {})
    .then((result) => {
      res.send(queryEntitySupplierProcessing(result._items));
    })
    .catch((err) => {
      next(err);
    });
});


app.listen(port, () => console.log(`Simple gremlin-proxy server listening on port ${port}!`));