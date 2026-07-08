import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import { useVault } from '../context/VaultContext';

interface NodeDatum extends d3.SimulationNodeDatum {
  id: string;
  label: string;
}

interface LinkDatum extends d3.SimulationLinkDatum<NodeDatum> {
  source: string | NodeDatum;
  target: string | NodeDatum;
}

export const D3Graph: React.FC = () => {
  const { nodes, links, activeFileName, selectFile } = useVault();
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 1. Inicialización física del Grafo D3 (Depende solo de los datos estructurales)
  useEffect(() => {
    if (!svgRef.current || !containerRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    
    // Limpiar SVG anterior para evitar duplicados
    svg.selectAll('*').remove();

    // Obtener dimensiones reales del contenedor
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    svg.attr('width', '100%').attr('height', '100%');

    // Grupo contenedor para habilitar Zoom & Pan
    const g = svg.append('g');

    // Inicializar Zoom
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior);

    // Copias profundas para que D3 las modifique sin mutar el estado de React
    const d3Nodes: NodeDatum[] = nodes.map(n => ({ id: n.id, label: n.label }));
    const d3Links: LinkDatum[] = links.map(l => ({ source: l.source, target: l.target }));

    // Crear la simulación de fuerzas físicas de D3
    const simulation = d3.forceSimulation<NodeDatum>(d3Nodes)
      .force('link', d3.forceLink<NodeDatum, LinkDatum>(d3Links)
        .id(d => d.id)
        .distance(100)
      )
      .force('charge', d3.forceManyBody().strength(-120))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(35));

    // Dibujar los enlaces (líneas)
    const link = g.append('g')
      .attr('stroke', 'rgba(99, 102, 241, 0.25)') // indigo-500/25
      .attr('stroke-width', 1.5)
      .selectAll('line')
      .data(d3Links)
      .enter()
      .append('line');

    // Dibujar los contenedores de los nodos
    const node = g.append('g')
      .selectAll('g')
      .data(d3Nodes)
      .enter()
      .append('g')
      .style('cursor', 'pointer')
      .on('click', async (_event, d) => {
        await selectFile(d.id);
      });

    // Añadir halos de brillo para los nodos activos (con clases específicas)
    node.append('circle')
      .attr('class', 'halo-circle transition-all duration-300')
      .attr('r', 10)
      .attr('fill', d => d.id === activeFileName ? 'rgba(167, 139, 250, 0.3)' : 'rgba(99, 102, 241, 0.15)')
      .attr('stroke', d => d.id === activeFileName ? '#c084fc' : '#6366f1')
      .attr('stroke-width', 2)
      .attr('filter', d => d.id === activeFileName ? 'drop-shadow(0 0 4px rgba(167, 139, 250, 0.6))' : 'none');

    // Añadir el círculo interior sólido
    node.append('circle')
      .attr('class', 'solid-circle')
      .attr('r', 4)
      .attr('fill', d => d.id === activeFileName ? '#c084fc' : '#4f46e5');

    // Añadir etiquetas de texto
    node.append('text')
      .attr('class', 'node-label')
      .text(d => d.label)
      .attr('x', 0)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .attr('fill', d => d.id === activeFileName ? '#fff' : '#94a3b8')
      .attr('font-size', d => d.id === activeFileName ? '10px' : '9px')
      .attr('font-weight', d => d.id === activeFileName ? '600' : '400')
      .attr('font-family', 'Inter, sans-serif')
      .style('pointer-events', 'none')
      .style('user-select', 'none');

    // Habilitar Drag & Drop (arrastrar y soltar)
    const dragBehavior = d3.drag<SVGGElement, NodeDatum>()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
      })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
      });

    node.call(dragBehavior as any);

    // Actualizar posiciones en cada paso de la simulación física (tick)
    simulation.on('tick', () => {
      link
        .attr('x1', d => (d.source as NodeDatum).x || 0)
        .attr('y1', d => (d.source as NodeDatum).y || 0)
        .attr('x2', d => (d.target as NodeDatum).x || 0)
        .attr('y2', d => (d.target as NodeDatum).y || 0);

      node
        .attr('transform', d => `translate(${d.x || 0}, ${d.y || 0})`);
    });

    // Ajustar el centro al redimensionar la ventana
    const handleResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      simulation.force('center', d3.forceCenter(w / 2, h / 2));
      simulation.alpha(0.3).restart();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      simulation.stop();
      window.removeEventListener('resize', handleResize);
    };
  }, [nodes, links, selectFile]);

  // 2. Colorear y resaltar dinámicamente el nodo activo (Evita reconstruir la física al seleccionar una nota)
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);

    // Actualizar círculos de halo
    svg.selectAll('circle.halo-circle')
      .attr('fill', (d: any) => d.id === activeFileName ? 'rgba(167, 139, 250, 0.3)' : 'rgba(99, 102, 241, 0.15)')
      .attr('stroke', (d: any) => d.id === activeFileName ? '#c084fc' : '#6366f1')
      .attr('filter', (d: any) => d.id === activeFileName ? 'drop-shadow(0 0 4px rgba(167, 139, 250, 0.6))' : 'none');

    // Actualizar círculos sólidos interiores
    svg.selectAll('circle.solid-circle')
      .attr('fill', (d: any) => d.id === activeFileName ? '#c084fc' : '#4f46e5');

    // Actualizar etiquetas de texto
    svg.selectAll('text.node-label')
      .attr('fill', (d: any) => d.id === activeFileName ? '#fff' : '#94a3b8')
      .attr('font-size', (d: any) => d.id === activeFileName ? '10px' : '9px')
      .attr('font-weight', (d: any) => d.id === activeFileName ? '600' : '400');
  }, [activeFileName, nodes]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-slate-950/40">
      {nodes.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs font-medium">
          Crea enlaces [[WikiLinks]] en tus notas para ver la red de conexiones.
        </div>
      ) : (
        <svg ref={svgRef} className="w-full h-full absolute inset-0 block select-none" />
      )}
    </div>
  );
};
