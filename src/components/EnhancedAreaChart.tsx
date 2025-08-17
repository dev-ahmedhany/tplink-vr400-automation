import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface TimeFilters {
  startDate?: string;
  endDate?: string;
  hours?: number;
}

interface EnhancedAreaChartProps {
  csvData: string | undefined;
  onFiltersChange?: (filters: TimeFilters) => void;
}

const EnhancedAreaChart: React.FC<EnhancedAreaChartProps> = ({ csvData, onFiltersChange }) => {
  const svgRef = useRef<HTMLDivElement>(null);
  const [filters, setFilters] = useState<TimeFilters>({});

  const handleFilterChange = (newFilters: TimeFilters) => {
    setFilters(newFilters);
    onFiltersChange?.(newFilters);
  };

  const resetFilters = () => {
    handleFilterChange({});
  };

  useEffect(() => {
    if (!csvData || !svgRef.current) return;

    // Clear previous chart
    d3.select(svgRef.current).select("svg").remove();

    const margin = { top: 60, right: 230, bottom: 80, left: 70 };
    const width = 800 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;

    // Create SVG
    const svg = d3
      .select(svgRef.current)
      .append("svg")
      .attr("width", width + margin.left + margin.right)
      .attr("height", height + margin.top + margin.bottom)
      .append("g")
      .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Parse the data
    const rawData = d3.csvParse(csvData);
    
    if (rawData.length === 0) {
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("fill", "#e5e7eb")
        .style("font-weight", "500")
        .text("No data available for the selected time range");
      return;
    }

    // Transform data to proper types
    const data = rawData.map((d: any) => {
      const point: any = {
        timestamp: new Date(d.timestamp)
      };
      
      // Convert all device columns to numbers
      Object.keys(d).forEach(key => {
        if (key !== 'timestamp') {
          point[key] = (+d[key]) / 1000; // Convert to number and normalize
        }
      });
      
      return point;
    });

    // Get device columns (exclude timestamp)
    const keys = rawData.columns?.slice(1) || [];

    // Color palette
    const color = d3.scaleOrdinal<string>()
      .domain(keys)
      .range(d3.schemeSet2);

    // Stack the data
    const stackedData = d3.stack<any, string>()
      .keys(keys)
      (data);

    // Set up scales
    const xExtent = d3.extent(data, (d: any) => d.timestamp) as [Date, Date];
    const x = d3.scaleTime()
      .domain(xExtent)
      .range([0, width]);

    const maxValue = d3.max(stackedData, (layer: any) => d3.max(layer, (d: any) => d[1])) || 0;
    const y = d3.scaleLinear()
      .domain([0, maxValue as number])
      .range([height, 0]);

    // Add clipPath for brushing
    svg
      .append("defs")
      .append("svg:clipPath")
      .attr("id", "clip")
      .append("svg:rect")
      .attr("width", width)
      .attr("height", height)
      .attr("x", 0)
      .attr("y", 0);

    // Create main chart area
    const chartArea = svg.append("g").attr("clip-path", "url(#clip)");

    // Area generator
    const area = d3
      .area<any>()
      .x((d: any) => x(d.data.timestamp))
      .y0((d: any) => y(d[0]))
      .y1((d: any) => y(d[1]))
      .curve(d3.curveMonotoneX);

    // Draw areas
    chartArea
      .selectAll("mylayers")
      .data(stackedData)
      .join("path")
      .attr("class", (d: any) => "myArea " + d.key.replace(/[^a-zA-Z0-9]/g, "_"))
      .style("fill", (d: any) => color(d.key) as string)
      .style("opacity", 0.8)
      .attr("d", area);

    // Add X axis
    const xAxis = svg
      .append("g")
      .attr("transform", `translate(0, ${height})`);

    const updateXAxis = () => {
      const tickCount = Math.min(8, data.length);
      xAxis.call(
        d3.axisBottom(x)
          .ticks(tickCount)
          .tickFormat(d3.timeFormat("%m/%d %H:%M") as any)
      )
      .selectAll("text")
      .style("text-anchor", "end")
      .style("fill", "#e5e7eb")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");
      
      // Style axis lines and ticks
      xAxis.selectAll("path, line")
        .style("stroke", "#4a5568");
    };

    updateXAxis();

    // Add Y axis
    const yAxis = svg.append("g").call(d3.axisLeft(y).ticks(6));
    
    // Style Y axis
    yAxis.selectAll("text")
      .style("fill", "#e5e7eb");
    yAxis.selectAll("path, line")
      .style("stroke", "#4a5568");

    // Add axis labels
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + 70)
      .attr("fill", "#e5e7eb")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .text("Date & Time");

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("y", -45)
      .attr("x", -height / 2)
      .attr("fill", "#e5e7eb")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .text("Usage Rate (MB/min)");

    // Add brushing
    const brush = d3
      .brushX()
      .extent([[0, 0], [width, height]])
      .on("end", function(event: any) {
        if (!event.selection) {
          // Double-click to reset
          x.domain(xExtent);
          updateChart();
          return;
        }

        const [x0, x1] = event.selection.map(x.invert);
        x.domain([x0, x1]);
        (chartArea.select(".brush") as any).call(brush.move, null);
        updateChart();
      });

    chartArea.append("g").attr("class", "brush").call(brush);

    function updateChart() {
      // Update axis and areas
      xAxis.transition().duration(750).call(
        d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat("%m/%d %H:%M") as any)
      )
      .selectAll("text")
      .style("text-anchor", "end")
      .style("fill", "#e5e7eb")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");
      
      chartArea.selectAll("path")
        .transition()
        .duration(750)
        .attr("d", (d: any) => area(d) || "");
    }

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "rgba(31, 41, 55, 0.95)")
      .style("color", "white")
      .style("padding", "12px")
      .style("border-radius", "8px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "1000")
      .style("box-shadow", "0 4px 6px rgba(0, 0, 0, 0.1)");

    // Add invisible rects for mouse interaction
    chartArea.selectAll(".mouse-area")
      .data(data)
      .join("rect")
      .attr("class", "mouse-area")
      .attr("x", (d: any) => x(d.timestamp) - 5)
      .attr("y", 0)
      .attr("width", 10)
      .attr("height", height)
      .style("fill", "transparent")
      .on("mouseover", function(event: any, d: any) {
        tooltip.style("visibility", "visible");
        const tooltipContent = [
          `<strong>Time:</strong> ${d3.timeFormat("%Y-%m-%d %H:%M")(d.timestamp)}`,
          ...keys.map((key: string) => `<strong>${key}:</strong> ${(d[key] * 1000).toFixed(0)} MB/min`)
        ].join("<br>");
        tooltip.html(tooltipContent);
      })
      .on("mousemove", function(event: any) {
        tooltip
          .style("top", (event.pageY - 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", function() {
        tooltip.style("visibility", "hidden");
      });

    // Legend with hover effects
    const highlight = function(event: any, d: string) {
      d3.selectAll(".myArea").style("opacity", 0.1);
      d3.select(`.myArea.${d.replace(/[^a-zA-Z0-9]/g, "_")}`).style("opacity", 1);
    };

    const noHighlight = function() {
      d3.selectAll(".myArea").style("opacity", 0.8);
    };

    // Add legend
    const legendSize = 18;
    const legend = svg.append("g")
      .attr("class", "legend")
      .attr("transform", `translate(${width + 20}, 20)`);

    legend.selectAll("rect")
      .data(keys)
      .join("rect")
      .attr("x", 0)
      .attr("y", (d: string, i: number) => i * (legendSize + 5))
      .attr("width", legendSize)
      .attr("height", legendSize)
      .style("fill", (d: string) => color(d) as string)
      .style("cursor", "pointer")
      .on("mouseover", highlight)
      .on("mouseleave", noHighlight);

    legend.selectAll("text")
      .data(keys)
      .join("text")
      .attr("x", legendSize + 5)
      .attr("y", (d: string, i: number) => i * (legendSize + 5) + legendSize / 2)
      .style("fill", "#e5e7eb")
      .style("font-size", "12px")
      .style("font-weight", "500")
      .style("alignment-baseline", "middle")
      .style("cursor", "pointer")
      .text((d: string) => d)
      .on("mouseover", highlight)
      .on("mouseleave", noHighlight);

    // Cleanup tooltip on component unmount
    return () => {
      tooltip.remove();
    };

  }, [csvData]);

  const formatDateForInput = (date: Date) => {
    return date.toISOString().slice(0, 16);
  };

  const getCurrentDate = () => new Date();
  const getHoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000);

  // Get current input values for controlled inputs
  const getStartDateValue = () => {
    if (filters.startDate) return filters.startDate;
    if (filters.hours) return formatDateForInput(getHoursAgo(filters.hours));
    return '';
  };

  const getEndDateValue = () => {
    if (filters.endDate) return filters.endDate;
    if (filters.hours) return formatDateForInput(getCurrentDate());
    return '';
  };

  return (
    <div style={{ width: '100%' }}>
      {/* Time Filter Controls */}
      <div style={{ 
        marginBottom: '1.5rem', 
        padding: '1.25rem', 
        background: '#2a2f3e',
        border: '1px solid #374151',
        borderRadius: '12px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center'
      }}>
        <h3 style={{ 
          margin: 0, 
          marginRight: '1rem', 
          fontSize: '0.875rem',
          fontWeight: '600',
          color: '#e5e7eb',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          📅 Time Filters
        </h3>
        
        {/* Quick time filters */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleFilterChange({ hours: 1 })}
            style={{
              padding: '0.5rem 1rem',
              background: filters.hours === 1 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#2a2f3e',
              color: filters.hours === 1 ? 'white' : '#e5e7eb',
              border: filters.hours === 1 ? 'none' : '1px solid #4a5568',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              boxShadow: filters.hours === 1 ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            Last Hour
          </button>
          <button
            onClick={() => handleFilterChange({ hours: 6 })}
            style={{
              padding: '0.5rem 1rem',
              background: filters.hours === 6 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#2a2f3e',
              color: filters.hours === 6 ? 'white' : '#e5e7eb',
              border: filters.hours === 6 ? 'none' : '1px solid #4a5568',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              boxShadow: filters.hours === 6 ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            Last 6 Hours
          </button>
          <button
            onClick={() => handleFilterChange({ hours: 24 })}
            style={{
              padding: '0.5rem 1rem',
              background: filters.hours === 24 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#2a2f3e',
              color: filters.hours === 24 ? 'white' : '#e5e7eb',
              border: filters.hours === 24 ? 'none' : '1px solid #4a5568',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              boxShadow: filters.hours === 24 ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            Last 24 Hours
          </button>
          <button
            onClick={() => handleFilterChange({ hours: 168 })}
            style={{
              padding: '0.5rem 1rem',
              background: filters.hours === 168 ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#2a2f3e',
              color: filters.hours === 168 ? 'white' : '#e5e7eb',
              border: filters.hours === 168 ? 'none' : '1px solid #4a5568',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: '500',
              transition: 'all 0.2s ease',
              boxShadow: filters.hours === 168 ? '0 2px 4px rgba(0, 0, 0, 0.1)' : 'none'
            }}
          >
            Last Week
          </button>
        </div>

        {/* Custom date range */}
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ 
            fontSize: '0.75rem', 
            fontWeight: '500',
            color: '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            From:
            <input
              type="datetime-local"
              value={getStartDateValue()}
              onChange={(e) => handleFilterChange({ ...filters, startDate: e.target.value, hours: undefined })}
              style={{
                padding: '0.5rem',
                fontSize: '0.75rem',
                border: '1px solid #4a5568',
                borderRadius: '8px',
                background: '#2a2f3e',
                color: '#e5e7eb'
              }}
            />
          </label>
          <label style={{ 
            fontSize: '0.75rem', 
            fontWeight: '500',
            color: '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}>
            To:
            <input
              type="datetime-local"
              value={getEndDateValue()}
              onChange={(e) => handleFilterChange({ ...filters, endDate: e.target.value, hours: undefined })}
              style={{
                padding: '0.5rem',
                fontSize: '0.75rem',
                border: '1px solid #4a5568',
                borderRadius: '8px',
                background: '#2a2f3e',
                color: '#e5e7eb'
              }}
            />
          </label>
        </div>

        <button
          onClick={resetFilters}
          style={{
            padding: '0.5rem 1rem',
            background: '#6b7280',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '0.75rem',
            fontWeight: '500',
            transition: 'all 0.2s ease'
          }}
        >
          Reset
        </button>
      </div>

      {/* Chart Container */}
      <div ref={svgRef} style={{ width: '100%', overflow: 'auto' }}></div>
      
      {/* Instructions */}
      <div style={{ 
        marginTop: '1rem', 
        fontSize: '0.75rem', 
        color: '#9ca3af',
        fontStyle: 'italic',
        padding: '0.75rem',
        background: '#2a2f3e',
        borderRadius: '8px',
        border: '1px solid #374151'
      }}>
        💡 <strong>Tips:</strong> Use the time filters above, drag on the chart to zoom in, double-click to reset zoom, hover over the chart for details.
      </div>
    </div>
  );
};

export default EnhancedAreaChart;
