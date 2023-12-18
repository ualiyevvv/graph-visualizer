import Graph from "./graph";
import ForceDirectedGraph from "./graphLayout";

let graph = new Graph();

const nodes = ['A','Av','Ab','An','Ak','Aj','Ah','Ag','Af','As','As1','As2','As3','As4','As5','As52']
const links = [['A','Av'],['A','Ak'],['A','Ah']
    ,['A','Af'],['A','Aj'],['Ak','Ab'],['Ak','An'],['Ak','As2']
    ,['Ak','As'],['Ak','Ag'],['Af','As4'],['Af','As3'],['Af','As1'],['Af','As52'],['Af','As5']]

nodes.map(node => graph.addNode(node))
links.map(link => graph.addEdge(link[0], link[1]))

let fdGraph = new ForceDirectedGraph(graph, 'graphCanvas');
fdGraph.start();

