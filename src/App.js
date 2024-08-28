import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom";

import { Stack, Divider, Button, Select, MenuItem, Box, Grid2 as Grid, FormControl, InputLabel, Pagination,
  TableContainer, Table, TableCell, TableBody, TableRow, TableHead, Paper, IconButton, Typography, Snackbar, Alert,
  DialogTitle, Dialog, DialogContent, DialogContentText, DialogActions, ToggleButton, Tooltip
 } from '@mui/material';

import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import StopIcon from '@mui/icons-material/Stop';
import HelpIcon from '@mui/icons-material/Help';
import AirIcon from '@mui/icons-material/Air';  

import Graph from "react-graph-vis";
import { v4 as uuid } from 'uuid';

import { runLinkStateAlgorithm } from "./algorithms/link-state";

// need to import the vis network css in order to show tooltip

function App() {

  const ALGORITHMS = {
    "link-state": "Link State Algorithm",
    //"distance-vector": "Distance Vector Algorithm"
  };

  const defaultNodeColor = {
    border: '#2B7CE9',
    background: '#97C2FC',
    highlight: {
      border: '#2B7CE9',
      background: '#D2E5FF'
    },
    hover: {
      border: '#2B7CE9',
      background: '#D2E5FF'
    }
  };

  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMessage, setSnackMessage] = useState("");
  const [helpOpen, setHelpOpen] = React.useState(false);

  const snackAlert = (text) => {
    setSnackMessage(text);
    setSnackOpen(true);
  };

  const handleSnackClose = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackOpen(false);
  };

  const handleHelpClose = (event, reason) => {
    setHelpOpen(false);
  };

  const graphRef = useRef(null);
  const graphContainerRef = useRef(null);

  const [nodes, setNodes] = useState([
    { id: 1, label: "A", borderWidth: 1, color: defaultNodeColor },
    { id: 2, label: "B", borderWidth: 1, color: defaultNodeColor },
    { id: 3, label: "C", borderWidth: 1, color: defaultNodeColor },
    { id: 4, label: "D", borderWidth: 1, color: defaultNodeColor },
    { id: 5, label: "E", borderWidth: 1, color: defaultNodeColor },
    { id: 6, label: "F", borderWidth: 1, color: defaultNodeColor },
  ]);

  const [edges, setEdges] = useState([
    { id: uuid(), from: 1, to: 4, label: "9", width: 1, color: "black" },
    { id: uuid(), from: 1, to: 6, label: "12", width: 1, color: "black" },
    { id: uuid(), from: 2, to: 3, label: "5", width: 1, color: "black" },
    { id: uuid(), from: 2, to: 5, label: "1", width: 1, color: "black" },
    { id: uuid(), from: 2, to: 6, label: "4", width: 1, color: "black" },
    { id: uuid(), from: 3, to: 6, label: "10", width: 1, color: "black" },
    { id: uuid(), from: 4, to: 5, label: "6", width: 1, color: "black" },
    { id: uuid(), from: 5, to: 6, label: "2", width: 1, color: "black" },
  ]);

  const addNode = (x, y, label) => {
    const newId = nodes.length+1
    if (!label) label = `Node ${newId}`
    const newNode = {
      id: newId,
      label: label,
      x: x,
      y: y,
      borderWidth: 1,
      color: {
        border: '#2B7CE9',
        background: '#97C2FC',
        highlight: {
          border: '#2B7CE9',
          background: '#D2E5FF'
        },
        hover: {
          border: '#2B7CE9',
          background: '#D2E5FF'
        }
      },
      }
    setNodes([...nodes, newNode]);
  };

  const addEdge = (fromNode, toNode) => {
    const newEdge = {
      id: uuid(),
      from: fromNode,
      to: toNode,
      label: "1",
      width: 1, color: "black"
    };
    setEdges([...edges, newEdge]);
  };

  const [rawNodes, setRawNodes] = useState(nodes)
  const [rawEdges, setRawEdges] = useState(edges)

  const [selectedElement, setSelectedElement] = useState(null);
  const [firstClickNode, setFirstClickNode] = useState(null);
  const [selectedAlgorithm, setSelectedAlgorithm] = useState("link-state");
  const [startingNodeId, setStartingNodeId] = useState(nodes.length > 0 ? nodes[0].id : null);
  const [ongoing, setOngoing] = useState(false);

  const [steps, setSteps] = useState([]);
  const [currentStep, setCurrentStep] = useState(1);
  const [tableState, setTableState] = useState([]);
  const [desc, setDesc] = useState("");

  const [physics, setPhysics] = useState(false);
  const [options, setOptions] = useState(
      {
      layout: {
      },
      edges: {
        color: "#000000",
        arrows: ''
      },
      physics: false,
      interaction: {
        hover: true,
        hoverConnectedEdges: false,
        selectConnectedEdges: false,
      }
    }
  );

  useEffect(() => {
    setOptions(prevOptions => ({
      ...prevOptions,
      physics: physics
    }));
  }, [physics]);

  const events = {
    select: function(event) {
      event.event.preventDefault();
      var { nodes, edges } = event;
      if (nodes.length > 0) {
        setSelectedElement({ type: "node", id: nodes[0] });
      }
      else if (edges.length > 0) {
        setSelectedElement({ type: "edge", id: edges[0] });
      }
      else {
        setSelectedElement(null);
      }
    },
    oncontext: function(event) {
      event.event.preventDefault();
      var { nodes, edges } = event;
      console.log(nodes)
      console.log(edges)
      if (!ongoing) {
        const { canvas } = event.pointer;
        addNode(canvas.x, canvas.y);
      } else {
        snackAlert("Cannot edit graph while simulation is ongoing")
      }
    },
    doubleClick: function(event) {
      event.event.preventDefault();
      if (!ongoing) {
        const { nodes } = event;
        if (nodes.length > 0) {
          if (!firstClickNode) {
            setFirstClickNode(nodes[0]);
          } else {
            const secondClickNode = nodes[0];
            if (firstClickNode === secondClickNode) {
              setFirstClickNode(null); // clicked same node twice
              return;
            }

            const edgeExists = edges.some(edge =>
              (edge.from === firstClickNode && edge.to === secondClickNode) ||
              (edge.from === secondClickNode && edge.to === firstClickNode)
            );

            if (edgeExists) {
              snackAlert("Edge already exists");
            } else {
              addEdge(firstClickNode, secondClickNode);
            }

            setFirstClickNode(null);
          }
        }
      } else {
        snackAlert("Cannot add edge while simulation is ongoing")
      }
    }
  };

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (selectedElement) {
        if (!ongoing) {
          const updateLabel = (isEdge, label, key) => {
            if ("1234567890".includes(key) || key === "Backspace" || !isEdge) {
              if (key.length === 1) {
                if (label) {
                  return label + key;
                }
                else {
                  return key;
                }
              } else if (key === "Backspace") {
                return label.length > 0 ? label.slice(0, -1) : label;
              }
            }
            return label;
          };

          if (selectedElement.type === "node") {
            if (event.key === "Delete") {
              setNodes(prevNodes => prevNodes.filter(node => node.id !== selectedElement.id));
              setEdges(prevEdges => prevEdges.filter(edge => edge.to !== selectedElement.id && edge.from !== selectedElement.id));
            } else {
              setNodes((prevNodes) =>
                prevNodes.map((node) => {
                  if (node.id === selectedElement.id) {
                    return { ...node, label: updateLabel(false, node.label, event.key) };
                  } else {
                    return node;
                  }
                })
              );
            }
          } else if (selectedElement.type === "edge") {
            if (event.key === "Delete") {
              setEdges(prevEdges => prevEdges.filter(edge => edge.id !== selectedElement.id));
            } else {
              setEdges((prevEdges) =>
                prevEdges.map((edge) => {
                  if (edge.id === selectedElement.id) {
                    return { ...edge, label: updateLabel(true, edge.label, event.key) };
                  } else {
                    return edge;
                  }
                })
              );
            }
          }
        } else {
          snackAlert("Cannot add edge while simulation is ongoing")
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      console.log("clean")
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedElement]);



  const handleClickOutside = (event) => {
    if (graphContainerRef.current && !graphContainerRef.current.contains(event.target)) {
      const network = graphRef.current.Network
      if (network) {
        network.selectEdges([]);
        network.selectNodes([]);
      }
      setSelectedElement(null);
    }
  };


useEffect(() => {
  document.addEventListener("mousedown", handleClickOutside);
  return () => {
    document.removeEventListener("mousedown", handleClickOutside);
  };
}, []);

  const startSimulation = () => {
    setRawNodes(nodes)
    setRawEdges(edges)
    const allDistancesSet = edges.every(edge => edge.label.trim() !== "");
    if (allDistancesSet) {
      const steps = runLinkStateAlgorithm(nodes, edges, startingNodeId);
      console.log("Steps", steps)
      setSteps(steps);
      setOngoing(true);
      setCurrentStep(1); // Start from the first step
    } else {
      snackAlert("Please give every link a distance");
    }
  };

  const endSimulation = () => {
    setSteps([]);
    setOngoing(false);
  };

  const help = () => {
    setHelpOpen(true);
  };
  

  const handlePageChange = (event, value) => {
    setCurrentStep(value);
  };

  useEffect(() => { // update based on which step we're on
    if (steps.length > 0) {
      const step = steps[currentStep - 1];
      setTableState(step.tableState || []);
      setDesc(step.description || "");
      setNodes(step.nodes)
      setEdges(step.edges)
    }
    else {
      setTableState([])
      setDesc("")
      setNodes(rawNodes)
      setEdges(rawEdges)
    }
  }, [currentStep, steps]);

  return (
    <Box sx={{ p: 2, height: 'calc(100vh - 32px)', padding: '16px'}}>
      <Grid 
        container
        spacing={2}
        sx={{ height: '100%' }}
      >
        <Grid size={6} sx={{ height: '100%' }}>
          <Stack spacing={2} sx={{ height: '100%' }}>
          <Paper ref={graphContainerRef} elevation={3} sx={{height: '100%', width: '100%' }}>
            <Graph ref={graphRef} sx={{height: '100%', width: '100%' }}
              graph={{ nodes, edges }}
              options={options}
              events={events}
              getNetwork={network => {}}
            />
          </Paper>
            <Stack component={Paper} elevation={3}
              direction="row"
              divider={<Divider orientation="vertical" flexItem />}
              spacing={2}
              alignItems="center"
              padding={2}
            >
              <Stack
                spacing={2}
              >
                <FormControl fullWidth disabled={ongoing} sx={{ maxWidth: '200px' }}>
                  <InputLabel>Algorithm</InputLabel>
                  <Select
                    value={selectedAlgorithm}
                    onChange={(e) => setSelectedAlgorithm(e.target.value)}
                    label="Algorithm"
                  >
                    {Object.entries(ALGORITHMS).map(([id, name]) => (
                      <MenuItem key={id} value={id}>{name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <FormControl fullWidth disabled={ongoing || selectedAlgorithm !== "link-state"} sx={{ maxWidth: '200px' }}>
                  <InputLabel>Starting node</InputLabel>
                  <Select
                    value={startingNodeId}
                    onChange={(e) => setStartingNodeId(e.target.value)}
                    label="Starting node"
                  >
                    {nodes.map(node => (
                      <MenuItem key={node.id} value={node.id}>{node.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Stack>
              <Stack spacing={1}>
                {!ongoing ?
                <Tooltip title="Start simulation" placement="right">
                  <IconButton
                    variant="filled"
                    onClick={startSimulation}
                  ><PlayArrowIcon />
                  </IconButton>
                </Tooltip>
                :
                <Tooltip title="Stop simulation" placement="right">
                  <IconButton
                    variant="filled"
                    onClick={endSimulation}
                  ><StopIcon />
                  </IconButton>
                </Tooltip>
                }
                <Tooltip title="Help" placement="right">
                  <IconButton
                    variant="filled"
                    onClick={help}
                  ><HelpIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Toggle physics" placement="right">
                  <ToggleButton
                    selected={physics}
                    onChange={() => {
                      setPhysics(!physics);
                    }}
                  >
                    <AirIcon />
                  </ToggleButton>
                </Tooltip>
              </Stack>
              <Pagination disabled={!ongoing} count={steps.length} onChange={handlePageChange} showFirstButton siblingCount={0} showLastButton width='100vw'/>
            </Stack>
          </Stack>
        </Grid>
        
        <Grid size={6}>
          <Stack spacing={2} sx={{ height: '100%' }}>
            <Box component={Paper} elevation={3} sx={{ whiteSpace: 'normal', height:'150px', padding: 2 }}>
            {desc ? (
              desc
            ) : (
              <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                description...
              </Typography>
            )}
            </Box>
            <TableContainer component={Paper} elevation={3} sx={{ height: '100%', overflow: 'auto' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Traversed</TableCell>
                    {nodes.map(node => (
                      <TableCell key={node.id}>{node.label}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {tableState.map((row, rowIndex) => (
                    <TableRow key={rowIndex}>
                      <TableCell
                        sx={{backgroundColor: row.traversed.color}}
                      >{row.traversed.traversed}</TableCell>
                      {row.routes.map((cell, colIndex) => (
                        <TableCell
                          key={colIndex}
                          sx={{ 
                            backgroundColor: cell.color,
                          }}
                        >
                          {cell.distance}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Stack>
        </Grid>
      </Grid>
      <Snackbar
        open={snackOpen}
        autoHideDuration={6000}
        onClose={handleSnackClose}
        action={
          <button onClick={handleSnackClose}>Close</button>
        }
      >
        <Alert
          onClose={handleSnackClose}
          severity="error"
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackMessage}
        </Alert>
      </Snackbar>
      <Dialog
        open={helpOpen}
        onClose={handleHelpClose}
      >
        <Box sx={{ padding: 1 }}>
          <DialogTitle>
            <Typography variant="h4" gutterBottom>
              Routing simulator
            </Typography>
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              <Typography variant="h5" gutterBottom>
                Creating a network
              </Typography>
              <Typography variant="body2">
                Right-click to create a Node.<br/>
                Double-click on one node, then double-click on another node to create a Link.<br/>
                Click on a node or link to select it. While selecting a node or link, you can press the Delete button to delete it.<br/>
                While selecting a node, you can type to change its name. While selecting a link, you can type to change its distance.<br/>
              </Typography>
              <Typography variant="h5" gutterBottom>
                Running the simulation
              </Typography>
              <Typography variant="body2">
                Select a starting node for the link-state algorithm. Click play to begin the simulation.<br/>
                You can step forwards, backwards, or skip using the step buttons. At each step, a description of the step will be displayed, and the table will be updated.<br/>
                Relevant cells in the network and the table will be highlighted. Once you are done, click stop to end the simulation.<br/>
              </Typography>
              <Typography variant="h5" gutterBottom>
                Others
              </Typography>
              <Typography variant="body2">
                The physics button below the help button turns on "physics" for the network so that nodes do not get too close to each other.
              </Typography>
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleHelpClose} autoFocus>OK</Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}

export default App;