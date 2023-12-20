import Graph from "./graph";
import ForceDirectedGraph from "../../new/graphLayout";

let graph = new Graph();

const nodes = ['A','Av','Ak','Ah']
const links = [['A','Av'],['A','Ak'],['A','Ah']]

nodes.map(node => graph.addNode(node))
links.map(link => graph.addEdge(link[0], link[1]))

let fdGraph = new ForceDirectedGraph(graph, 'graphCanvas');
fdGraph.graphInit();


// import {Graph} from "./new/graph";
//
// const graph = new Graph(true)
// let nodes = [
//     { id: 1, value: 5, properties: {name:'sdfdsf'} },
//     { id: 2, value: 5, properties: {name:'2sdfdsf'} },
//     { id: 3, value: 5, properties: {name:'3sdfdsf'} },
//     { id: 4, value: 5, properties: {name:'4sdfdsf'} },
//     { id: 5, value: 5, properties: {name:'5sdfdsf'} },
//     { id: 6, value: 5, properties: {name:'5sdfdsf'} },
// ];
//
// let edges = [
//     { source: 1, target: 2, value: 10 },
//     { source: 5, target: 3, value: 15 },
//     { source: 4, target: 3, value: 15 },
//     { source: 6, target: 3, value: 15 }
// ];
//
// graph.addNodes(nodes);
// graph.addEdges(edges);
//
// const incomingNodes = graph.getIncomingNodes(3); // Получаем узлы, направленные к узлу с ID 2
// console.log('Incoming Nodes:', incomingNodes);