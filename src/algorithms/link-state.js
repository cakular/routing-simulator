/**
 * Run the Link State Algorithm
 * @param {Array} nodes - Array of node objects
 * @param {Array} edges - Array of edge objects
 * @param {number} startingNodeId - The starting node ID
 * @returns {Object} - steps
 */
export function runLinkStateAlgorithm(nodes, edges, startingNodeId) {
    
    const steps = [];

    const labelDict = nodes.reduce((dict, node) => {
        dict[node.id] = node.label;
        return dict;
    }, {});

    const tableState = [];
    // DIJKSTRA
    const traversed = [];
    const dists = {};
    const paths = {};
    const path = [];
    const Q = new Set();

    var iters = 0;
    
    for (const n of nodes) {
        dists[n.id] = Infinity;
        paths[n.id] = undefined;
        Q.add(n.id);
    }
    dists[startingNodeId] = 0;
    paths[startingNodeId] = [startingNodeId]

    while (Q.size>0) {
        iters++;
        const edgesChecked = []
        const nodesChecked = []
        // find closest unexplored
        let u = null;
        let minDist = Infinity;
        for (const nodeId of Q) {
            if (dists[nodeId] < minDist) {
                minDist = dists[nodeId];
                u = nodeId;
            }
        }
        if (u === null) break; // no more explorable
        Q.delete(u);
        path.push(u);

        for (const edge of edges) {
            if (edge.from === u || edge.to === u) {
                let v;
                if (edge.from === u) v = edge.to;
                else v = edge.from; // neighbour v
                    if (Q.has(v)) {
                    const alt = dists[u] + parseInt(edge.label) // alt path
                    if (alt < dists[v]) {
                        dists[v] = alt
                        paths[v] = path.concat([v])
                    }
                    edgesChecked.push(edge)
                    nodesChecked.push(v)
                }
            }
        }

        nodes = nodes.map(node => (node.id === u ? {
            ...node,
            color: {
                background: "lime",
                highlight: {
                background: 'lime'
                },
                hover: {
                background: 'lime'
                }
            }
        }:node));
        const lastEdge = paths[u].slice(-2)
        edges = edges.map(edge => {
            if (lastEdge[0] === edge.to && lastEdge[1] === edge.from) {
                return {...edge, color: "lime", arrows: "from"}
            }
            else if (lastEdge[0] === edge.from && lastEdge[1] === edge.to) {
                return {...edge, color: "lime", arrows: "to"}
            }
            else {
                return edge
            }
        });
        
        // STEP
        if (iters===1) {
            const tableState2 = structuredClone(tableState);
            const traversed = path.map(nodeId => labelDict[nodeId]).join(',');
            const routes = nodes.map(node => {
                const nodeId = node.id;
                const path = paths[nodeId] 
                    ? paths[nodeId].map(id => labelDict[id]).join('→') : "-";
                const dist = dists[nodeId] !== Infinity 
                    ? dists[nodeId] : '∞';
                return {distance: `${path} [${dist}]`};
            });
            tableState2.push({ traversed: { traversed, color: "yellow" }, routes: routes })
            const description = `Start at starting node ${labelDict[u]} with distance ${dists[u]}.`
            const cnodes = nodes.map(node => (node.id === u ? {
                ...node,
                borderWidth: 3,
                color: {border: "black",background: "lime"
                }
            }:node));
            const cedges = edges;
            steps.push({
                nodes: structuredClone(cnodes),
                edges: structuredClone(cedges),
                tableState: structuredClone(tableState2),
                description: description
            })
        } else {
            const tableState2 = structuredClone(tableState);
            const traversed = path.map(nodeId => labelDict[nodeId]).join(',');
            const routes = nodes.map(node => {
                const nodeId = node.id;
                const path = paths[nodeId] 
                    ? paths[nodeId].map(id => labelDict[id]).join('→') : "-";
                const dist = dists[nodeId] !== Infinity 
                    ? dists[nodeId] : '∞';
                return {distance: `${path} [${dist}]`};
            });
            tableState2.push({ traversed: { traversed, color: "yellow" }, routes: routes })
            const description = `Traverse to node with next smallest distance, ${labelDict[u]}, with distance ${dists[u]}`
            const cnodes = nodes.map(node => (node.id === u ? {
                ...node,
                borderWidth: 3,
                color: {border: "black",background: "lime"
                }
            }:node));
            const cedges = edges;
            steps.push({
                nodes: structuredClone(cnodes),
                edges: structuredClone(cedges),
                tableState: structuredClone(tableState2),
                description: description
            })
        }

        // STEP
        if (nodesChecked.length > 0){
            const tableState2 = structuredClone(tableState);
            const traversed = path.map(nodeId => labelDict[nodeId]).join(',');
            const routes = nodes.map(node => {
                const nodeId = node.id;
                const path = paths[nodeId] 
                    ? paths[nodeId].map(id => labelDict[id]).join('→') : "-";
                const dist = dists[nodeId] !== Infinity 
                    ? dists[nodeId] : '∞';
                let color = 'white';
                if (nodesChecked.includes(nodeId)) color = 'yellow';
                return {distance: `${path} [${dist}]`, color};
            });
            tableState2.push({ traversed: { traversed }, routes: routes })
            const description = `Explore untraversed neighbour(s) ${nodesChecked.map(id => labelDict[id]).join(", ")}`
            const cnodes = nodes.map(node => (nodesChecked.includes(node.id) ? {
                ...node,
                borderWidth: 3,
                color: {border: "black"
                }
            }:node));
            const cedges = edges.map(edge => (edgesChecked.includes(edge) ? {
                ...edge,
                width: 4,
            }:edge));
            steps.push({
                nodes: structuredClone(cnodes),
                edges: structuredClone(cedges),
                tableState: structuredClone(tableState2),
                description: description
            })
        }

        const traversed = path.map(nodeId => labelDict[nodeId]).join(',');
        const routes = nodes.map(node => {
            const nodeId = node.id;
            const path = paths[nodeId] 
                ? paths[nodeId].map(id => labelDict[id]).join('→') : "-";
            const dist = dists[nodeId] !== Infinity 
                ? dists[nodeId] : '∞';
            return {distance: `${path} [${dist}]`};
        });
        tableState.push({ traversed: { traversed }, routes: routes })
    }
    // STEP
    {
        const description = `All nodes that can be explored have been explored. Least-cost tree has been formed.`
        steps.push({
            nodes: structuredClone(nodes),
            edges: structuredClone(edges),
            tableState: structuredClone(tableState),
            description: description
        })
    }


    return steps;
}
