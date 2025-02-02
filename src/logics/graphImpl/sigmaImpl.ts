import FA2Layout from "graphology-layout-forceatlas2/worker";
import Graph from "graphology";
import Sigma from "sigma";
import store from "../../app/store";
import { setSelectedEdge, setSelectedNode, updateColorMap } from "../../reducers/graphReducer";
import { Workspace } from "../../components/Details/SettingsComponent";
import { getColor, GraphData, GraphOptions, GraphTypes } from "../utils";
import { setIsPhysicsEnabled } from "../../reducers/optionReducer";
import { createNodeImageProgram } from "@sigma/node-image";
import getIcon from "../../assets/icons";
import { openEdgeDialog, openNodeDialog } from "../../reducers/dialogReducer";
import { circular } from "graphology-layout";
import { animateNodes } from "sigma/utils";
import { EdgeArrowProgram } from "sigma/rendering";
import { DEFAULT_EDGE_CURVATURE, EdgeCurvedArrowProgram, indexParallelEdgesIndex } from "@sigma/edge-curve";
import FileSaver from "file-saver";
import { EdgeDisplayData, NodeDisplayData } from "sigma/types";


export const layoutOptions = ['force-directed', 'circular']
const graph: Graph = new Graph({ multi: true });
let sigma: Sigma | null = null;
let sigmaLayout: FA2Layout | null = null;
let layoutName = 'force-directed'

function getCurvature(index: number, maxIndex: number): number {
  if (maxIndex <= 0) throw new Error("Invalid maxIndex");
  if (index < 0) return -getCurvature(-index, maxIndex);
  const amplitude = 3.5;
  const maxCurvature = amplitude * (1 - Math.exp(-maxIndex / amplitude)) * DEFAULT_EDGE_CURVATURE;
  return (maxCurvature * index) / maxIndex;
}


function createSigmaGraph(container: HTMLElement) {
  const sigma = new Sigma(graph!, container as HTMLElement, {
    allowInvalidContainer: true,
    enableEdgeEvents: true,
    renderEdgeLabels: true,
    defaultNodeType: "image",
    defaultEdgeType: "straight",
    edgeProgramClasses: {
      straight: EdgeArrowProgram,
      curved: EdgeCurvedArrowProgram,
    },
    nodeProgramClasses: {
      image: createNodeImageProgram({
        correctCentering: true,
        objectFit: 'cover'
      })
    },
  });

  let selectedNode: string | undefined;
  let selectedEdge: string | undefined;
  let nodesOfSelectedEdge: { source: string, target: string } | undefined;
  let selectedNeighbors: Set<string> | undefined;

  sigma.on("clickEdge", e => {
    store.dispatch(setSelectedEdge(e.edge))
    selectNode(undefined);
    selectEdge(e.edge);

  })
  sigma.on("clickNode", (e) => {
    store.dispatch(setSelectedNode(e.node))
  });

  sigma.setSetting("nodeReducer", (node, data) => {
    const res: Partial<NodeDisplayData> = { ...data };
    if ((selectedNode && selectedNode !== node && (selectedNeighbors && !selectedNeighbors.has(node))) ||
      (!selectedNode && (nodesOfSelectedEdge && nodesOfSelectedEdge.source !== node && nodesOfSelectedEdge.target !== node))
    ) {
      res.color = "#b4b8bf";
    }
    if (selectedNode === node || (nodesOfSelectedEdge && (nodesOfSelectedEdge.source === node || nodesOfSelectedEdge.target === node)) || (selectedNeighbors && selectedNeighbors.has(node))) {
      res.highlighted = true;
    }
    return res;
  });

  sigma.setSetting("edgeReducer", (edge, data) => {
    const res: Partial<EdgeDisplayData> = { ...data };
    if ((selectedEdge && selectedEdge !== edge) || (selectedNode && !graph.hasExtremity(edge, selectedNode))) {
      res.color = "#b5b8bd";
      res.size = 2;
    }
    return res;
  });

  function selectNode(node?: string) {
    if (node) {
      selectedNode = node;
      selectedNeighbors = new Set(graph.neighbors(node));
    }
    else if (!node) {
      selectedNode = undefined;
      selectedNeighbors = undefined;
    }
    sigma.refresh();
  }

  function selectEdge(edge?: string) {
    if (edge) {
      const [source, target] = graph.extremities(edge);
      nodesOfSelectedEdge = { source: source, target: target };
      selectedEdge = edge;
    }
    else if (!edge) {
      selectedEdge = undefined;
      nodesOfSelectedEdge = undefined;
    }
    sigma.refresh();
  }


  // State for drag'n'drop
  let draggedNode: string | null = null;
  let isDragging = false;

  //State for creating edge
  let shiftKeyDown = false;
  let draggingEdge = false;
  let startNode: string | null = null;

  // On mouse down on a node
  //  - we enable the drag mode
  //  - save in the dragged node in the state
  //  - highlight the node
  //  - disable the camera so its state is not updated
  sigma.on("downNode", (e) => {
    if (shiftKeyDown) {
      draggingEdge = true;
      startNode = e.node;
    } else {
      isDragging = true;
      draggedNode = e.node;
      graph!.setNodeAttribute(draggedNode, "highlighted", true);
      selectEdge(undefined);
      selectNode(e.node);
    }
    sigmaLayout?.stop()
    store.dispatch(setIsPhysicsEnabled(false))
  });
  sigma.on("upNode", (e) => {
    if (shiftKeyDown && draggingEdge && startNode) {
      const edgeFrom = startNode;
      const edgeTo = e.node;
      store.dispatch(openEdgeDialog({ edgeFrom: edgeFrom, edgeTo: edgeTo }));
      startNode = null;
      draggingEdge = false;
    }
  });

  // On mouse move, if the drag mode is enabled, we change the position of the draggedNode
  sigma.getMouseCaptor().on("mousemovebody", (e) => {
    if ((!isDragging || !draggedNode) && (!shiftKeyDown || !draggingEdge)) return;

    // Get new position of node
    if (isDragging && draggedNode) {
      const pos = sigma!.viewportToGraph(e);

      graph!.setNodeAttribute(draggedNode, "x", pos.x);
      graph!.setNodeAttribute(draggedNode, "y", pos.y);
    }

    // Prevent sigma to move camera:
    e.preventSigmaDefault();
    e.original.preventDefault();
    e.original.stopPropagation();
  });

  // On mouse up, we reset the autoscale and the dragging mode
  sigma.getMouseCaptor().on("mouseup", () => {
    if (draggedNode) {
      graph!.removeNodeAttribute(draggedNode, "highlighted");
    }
    isDragging = false;
    draggedNode = null;
  });

  // Disable the autoscale at the first down interaction
  sigma.getMouseCaptor().on("mousedown", () => {
    if (!sigma!.getCustomBBox()) sigma!.setCustomBBox(sigma!.getBBox());
  });

  sigma.on('clickStage', function (params) {
    let jsEvent = params.event.original;
    if (jsEvent.shiftKey && !draggingEdge) {
      store.dispatch(openNodeDialog({ x: params.event.x, y: params.event.y }));
    }
    else if (selectedNode || selectedNeighbors) {
      selectNode(undefined);
    }
    else if (selectedEdge || nodesOfSelectedEdge) {
      selectEdge(undefined);
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Shift' && shiftKeyDown !== true) {
      shiftKeyDown = true;
    }
  }
  );
  document.addEventListener('keyup', function (e) {
    if (e.key === 'Shift' && shiftKeyDown === true) {
      shiftKeyDown = false;
      startNode = null;
      draggingEdge = false;
    }
  });
  return sigma
}

function curveEdges(graph: Graph) {
  indexParallelEdgesIndex(graph, {
    edgeIndexAttribute: "parallelIndex",
    edgeMinIndexAttribute: "parallelMinIndex",
    edgeMaxIndexAttribute: "parallelMaxIndex",
  });
  graph.forEachEdge((edge, { parallelIndex, parallelMinIndex, parallelMaxIndex, }:
    | { parallelIndex: number; parallelMinIndex?: number; parallelMaxIndex: number }
    | { parallelIndex?: null; parallelMinIndex?: null; parallelMaxIndex?: null },
  ) => {
    if (typeof parallelMinIndex === "number") {
      graph.mergeEdgeAttributes(edge, {
        type: parallelIndex ? "curved" : "straight",
        curvature: getCurvature(parallelIndex, parallelMaxIndex),
      });
    } else if (typeof parallelIndex === "number") {
      graph.mergeEdgeAttributes(edge, {
        type: "curved",
        curvature: getCurvature(parallelIndex, parallelMaxIndex),
      });
    } else {
      graph.setEdgeAttribute(edge, "type", "straight");
    }
  },
  );
}

export function getSigmaGraph(container?: HTMLElement, data?: GraphData, options?: GraphOptions | undefined, workspace?: Workspace | null): GraphTypes {
  // create graph if it doesn't exist
  if (!sigma) {
    sigma = createSigmaGraph(container!)
    sigmaLayout = new FA2Layout(graph!, {
      settings: { gravity: .01, linLogMode: true }
    });
    if (options?.isPhysicsEnabled) {
      sigmaLayout.start()
    }
    return sigma
  }
  // update options
  if (options) {
    if (options.isPhysicsEnabled) applyLayout(layoutName)
    else sigmaLayout?.stop()
  }
  // updates graph data
  if (container && data) {
    for (let element of data.nodes) {
      let color = getColor(element);
      if (color === undefined) {
        color = '#000000'
      }
      if (!graph.nodes().includes(element.id.toString())) {
        let pos = { x: Math.random(), y: Math.random() }
        if (element.x && element.y) {
          pos = sigma.viewportToGraph({ x: element.x, y: element.y })
        }
        let { x, y } = pos
        graph.addNode(element.id, {
          x: x,
          y: y,
          size: 20,
          label: element.label,
          color: color,
          image: getIcon(element.type)
        })
      } else {
        graph.updateNode(element.id, attr => {
          return {
            ...attr,
            label: element.label,
            color: color,
          }
        })
      }
      if (workspace) {
        setNodePositions(workspace as Workspace | undefined);
      }
    }
    for (let id of graph!.nodes()) {
      if (!data.nodes.map(x => x.id.toString()).includes(id)) {
        graph.dropNode(id)
      }
    }
    for (let element of data.edges) {
      if (!graph.edges().includes(element.id!.toString()) && graph.nodes().includes(element.to!.toString())) {
        const fromNode = graph.getNodeAttributes(element.from);
        graph.addDirectedEdgeWithKey(element.id, element.from, element.to, {
          size: 3,
          type: 'arrow',
          label: element.label,
          color: fromNode.color
        })
      }
    }
    for (let edge of graph!.edges()) {
      if (!data.edges.map(x => x.id.toString()).includes(edge)) {
        graph.dropEdge(edge)
      }
    }
  }
  curveEdges(graph);
  return sigma;
}

export function applyLayout(name: string) {
  layoutName = name
  if (!sigma) return
  sigmaLayout?.stop()
  switch (name) {
    case 'circular': {
      sigmaLayout = null
      const circularPosition = circular(graph, { scale: 10 })
      animateNodes(graph, circularPosition, { duration: 1000 })
      store.dispatch(setIsPhysicsEnabled(false))
      break
    }
    case 'force-directed': {
      sigmaLayout = new FA2Layout(graph!, {
        settings: { gravity: .1, linLogMode: true }
      });
      sigmaLayout.start()
      store.dispatch(setIsPhysicsEnabled(true))
      break
    }
    default: {
      console.warn(`Unknown layout ${name} applied`)
    }
  }
}

export function getNodePositions() {
  sigmaLayout?.stop()
  store.dispatch(setIsPhysicsEnabled(false))
  let positions: Record<string, { x: number, y: number }> = {};
  sigma?.getGraph().forEachNode((node, attributes) => {
    positions[node] = { x: attributes.x, y: attributes.y }
  })
  return {
    layout: positions,
    zoom: sigma?.getCamera().ratio,
    view: {
      x: sigma?.getCamera().x,
      y: sigma?.getCamera().y
    }
  }
}

export function setNodePositions(workspace: Workspace | undefined) {
  sigmaLayout?.stop()
  store.dispatch(setIsPhysicsEnabled(false))
  graph.forEachNode((node, attributes) => {
    let newPosition = workspace?.layout[node]
    if (newPosition !== undefined) graph.updateNode(node, attributes => {
      return {
        ...attributes,
        x: newPosition?.x,
        y: newPosition?.y
      }
    })
  })
  sigma?.getCamera().setState({
    ...sigma?.getCamera().getState(),
    x: workspace?.view.x,
    y: workspace?.view.y,
    ratio: workspace?.zoom
  })
}

export function zoomIn() {
  let camera = sigma?.getCamera();
  camera?.animate({
    ratio: camera.ratio / 1.5
  }, {
    duration: 200
  });
}

export function zoomOut() {
  let camera = sigma?.getCamera();
  camera?.animate({
    ratio: camera.ratio * 1.5
  }, {
    duration: 200
  });
}

export function fitTo() {
  let camera = sigma?.getCamera();
  camera?.animatedReset({ duration: 200 });
}

export function exportIMG() {
  const inputLayers = ["edges", "nodes", "edgeLabels", "labels"];
  const { width, height } = sigma!.getDimensions();

  // This pixel ratio is here to deal with retina displays.
  // Indeed, for dimensions W and H, on a retina display, the canvases
  // dimensions actually are 2 * W and 2 * H. Sigma properly deals with it, but
  // we need to readapt here:
  const pixelRatio = window.devicePixelRatio || 1;

  const tmpRoot = document.createElement("DIV");
  tmpRoot.style.width = `${width}px`;
  tmpRoot.style.height = `${height}px`;
  tmpRoot.style.position = "absolute";
  tmpRoot.style.right = "101%";
  tmpRoot.style.bottom = "101%";
  document.body.appendChild(tmpRoot);

  // Instantiate sigma:
  const tmpRenderer = new Sigma(sigma!.getGraph(), tmpRoot, sigma!.getSettings());

  // Copy camera and force to render now, to avoid having to wait the schedule /
  // debounce frame:
  tmpRenderer.getCamera().setState(sigma!.getCamera().getState());
  tmpRenderer.refresh();

  // Create a new canvas, on which the different layers will be drawn:
  const canvas = document.createElement("CANVAS") as HTMLCanvasElement;
  canvas.setAttribute("width", width * pixelRatio + "");
  canvas.setAttribute("height", height * pixelRatio + "");
  const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;

  // Draw a white background first:
  ctx.fillStyle = "#fff";
  ctx.fillRect(0, 0, width * pixelRatio, height * pixelRatio);

  // For each layer, draw it on our canvas:
  const canvases = tmpRenderer.getCanvases();
  const layers = inputLayers ? inputLayers.filter((id) => !!canvases[id]) : Object.keys(canvases);
  layers.forEach((id) => {
    ctx.drawImage(
      canvases[id],
      0,
      0,
      width * pixelRatio,
      height * pixelRatio,
      0,
      0,
      width * pixelRatio,
      height * pixelRatio,
    );
  });

  // Save the canvas as a PNG image:
  canvas.toBlob((blob) => {
    if (blob) FileSaver.saveAs(blob, "graph.png");

    // Cleanup:
    tmpRenderer.kill();
    tmpRoot.remove();
  }, "image/png");
}