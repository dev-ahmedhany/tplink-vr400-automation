import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface TimeFilters {
  startDate?: string;
  endDate?: string;
  hours?: number;
}

interface EnhancedAreaChartProps {
  csvData: string;
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
    const data = d3.csvParse(csvData);
    
    if (data.length === 0) {
      svg.append("text")
        .attr("x", width / 2)
        .attr("y", height / 2)
        .attr("text-anchor", "middle")
        .style("font-size", "16px")
        .style("fill", "#666")
        .text("No data available for the selected time range");
      return;
    }

    // Parse timestamps and convert to Date objects
    data.forEach(d => {
      d.timestamp = new Date(d.timestamp);
    });

    // Get device columns (exclude timestamp)
    const keys = data.columns.slice(1);

    // Normalize data by dividing all numeric values by 1000 for better visualization
    data.forEach(d => {
      keys.forEach(key => {
        d[key] = +d[key] / 1000; // Convert to number and divide by 1000
      });
    });

    // Color palette
    const color = d3.scaleOrdinal().domain(keys).range(d3.schemeSet2);

    // Stack the data
    const stackedData = d3.stack().keys(keys)(data);

    // Set up scales
    const xExtent = d3.extent(data, d => d.timestamp);
    const x = d3.scaleTime()
      .domain(xExtent)
      .range([0, width]);

    const maxValue = d3.max(stackedData, d => d3.max(d, d => d[1]));
    const y = d3.scaleLinear()
      .domain([0, maxValue])
      .range([height, 0]);

    // Add clipPath for brushing
    const clip = svg
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
      .area()
      .x(d => x(d.data.timestamp))
      .y0(d => y(d[0]))
      .y1(d => y(d[1]))
      .curve(d3.curveMonotoneX);

    // Draw areas
    chartArea
      .selectAll("mylayers")
      .data(stackedData)
      .join("path")
      .attr("class", d => "myArea " + d.key.replace(/[^a-zA-Z0-9]/g, "_"))
      .style("fill", d => color(d.key))
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
          .tickFormat(d3.timeFormat("%m/%d %H:%M"))
      )
      .selectAll("text")
      .style("text-anchor", "end")
      .attr("dx", "-.8em")
      .attr("dy", ".15em")
      .attr("transform", "rotate(-45)");
    };

    updateXAxis();

    // Add Y axis
    svg.append("g").call(d3.axisLeft(y).ticks(6));

    // Add axis labels
    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("x", width / 2)
      .attr("y", height + 70)
      .attr("fill", "currentColor")
      .style("font-size", "12px")
      .text("Date & Time");

    svg
      .append("text")
      .attr("text-anchor", "middle")
      .attr("transform", "rotate(-90)")
      .attr("y", -45)
      .attr("x", -height / 2)
      .attr("fill", "currentColor")
      .style("font-size", "12px")
      .text("Usage Rate (MB/min)");

    // Add brushing
    const brush = d3
      .brushX()
      .extent([[0, 0], [width, height]])
      .on("end", function(event) {
        if (!event.selection) {
          // Double-click to reset
          x.domain(xExtent);
          updateChart();
          return;
        }

        const [x0, x1] = event.selection.map(x.invert);
        x.domain([x0, x1]);
        chartArea.select(".brush").call(brush.move, null);
        updateChart();
      });

    chartArea.append("g").attr("class", "brush").call(brush);

    function updateChart() {
      // Update axis and areas
      xAxis.transition().duration(750).call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat("%m/%d %H:%M")))
        .selectAll("text")
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)");
      
      chartArea.selectAll("path")
        .transition()
        .duration(750)
        .attr("d", area);
    }

    // Tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("position", "absolute")
      .style("visibility", "hidden")
      .style("background-color", "rgba(0, 0, 0, 0.8)")
      .style("color", "white")
      .style("padding", "8px")
      .style("border-radius", "4px")
      .style("font-size", "12px")
      .style("pointer-events", "none")
      .style("z-index", "1000");

    // Add invisible rects for mouse interaction
    chartArea.selectAll(".mouse-area")
      .data(data)
      .join("rect")
      .attr("class", "mouse-area")
      .attr("x", d => x(d.timestamp) - 5)
      .attr("y", 0)
      .attr("width", 10)
      .attr("height", height)
      .style("fill", "transparent")
      .on("mouseover", function(event, d) {
        tooltip.style("visibility", "visible");
        const tooltipContent = [
          `<strong>Time:</strong> ${d3.timeFormat("%Y-%m-%d %H:%M")(d.timestamp)}`,
          ...keys.map(key => `<strong>${key}:</strong> ${(d[key] * 1000).toFixed(0)} MB/min`)
        ].join("<br>");
        tooltip.html(tooltipContent);
      })
      .on("mousemove", function(event) {
        tooltip
          .style("top", (event.pageY - 10) + "px")
          .style("left", (event.pageX + 10) + "px");
      })
      .on("mouseout", function() {
        tooltip.style("visibility", "hidden");
      });

    // Legend with hover effects
    const highlight = function(event, d) {
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
      .attr("y", (d, i) => i * (legendSize + 5))
      .attr("width", legendSize)
      .attr("height", legendSize)
      .style("fill", d => color(d))
      .style("cursor", "pointer")
      .on("mouseover", highlight)
      .on("mouseleave", noHighlight);

    legend.selectAll("text")
      .data(keys)
      .join("text")
      .attr("x", legendSize + 5)
      .attr("y", (d, i) => i * (legendSize + 5) + legendSize / 2)
      .style("fill", d => color(d))
      .style("font-size", "12px")
      .style("alignment-baseline", "middle")
      .style("cursor", "pointer")
      .text(d => d)
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

  return (
    <div style={{ width: '100%' }}>
      {/* Time Filter Controls */}
      <div style={{ 
        marginBottom: '20px', 
        padding: '15px', 
        backgroundColor: '#f5f5f5', 
        borderRadius: '8px',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '15px',
        alignItems: 'center'
      }}>
        <h3 style={{ margin: 0, marginRight: '15px' }}>Time Filters:</h3>
        
        {/* Quick time filters */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleFilterChange({ hours: 1 })}
            style={{
              padding: '6px 12px',
              backgroundColor: filters.hours === 1 ? '#0070f3' : '#fff',
              color: filters.hours === 1 ? '#fff' : '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Last Hour
          </button>
          <button
            onClick={() => handleFilterChange({ hours: 6 })}
            style={{
              padding: '6px 12px',
              backgroundColor: filters.hours === 6 ? '#0070f3' : '#fff',
              color: filters.hours === 6 ? '#fff' : '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Last 6 Hours
          </button>
          <button
            onClick={() => handleFilterChange({ hours: 24 })}
            style={{
              padding: '6px 12px',
              backgroundColor: filters.hours === 24 ? '#0070f3' : '#fff',
              color: filters.hours === 24 ? '#fff' : '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Last 24 Hours
          </button>
          <button
            onClick={() => handleFilterChange({ hours: 168 })}
            style={{
              padding: '6px 12px',
              backgroundColor: filters.hours === 168 ? '#0070f3' : '#fff',
              color: filters.hours === 168 ? '#fff' : '#333',
              border: '1px solid #ddd',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px'
            }}
          >
            Last Week
          </button>
        </div>

        {/* Custom date range */}
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <label style={{ fontSize: '12px' }}>
            From:
            <input
              type="datetime-local"
              value={filters.startDate || ''}
              onChange={(e) => handleFilterChange({ ...filters, startDate: e.target.value, hours: undefined })}
              style={{
                marginLeft: '5px',
                padding: '4px',
                fontSize: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </label>
          <label style={{ fontSize: '12px' }}>
            To:
            <input
              type="datetime-local"
              value={filters.endDate || ''}
              onChange={(e) => handleFilterChange({ ...filters, endDate: e.target.value, hours: undefined })}
              style={{
                marginLeft: '5px',
                padding: '4px',
                fontSize: '12px',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </label>
        </div>

        <button
          onClick={resetFilters}
          style={{
            padding: '6px 12px',
            backgroundColor: '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '12px'
          }}
        >
          Reset
        </button>
      </div>

      {/* Chart Container */}
      <div ref={svgRef} style={{ width: '100%', overflow: 'auto' }}></div>
      
      {/* Instructions */}
      <div style={{ 
        marginTop: '15px', 
        fontSize: '12px', 
        color: '#666',
        fontStyle: 'italic'
      }}>
        💡 <strong>Tips:</strong> Use the time filters above, drag on the chart to zoom in, double-click to reset zoom, hover over the chart for details.
      </div>
    </div>
  );
};

export default EnhancedAreaChart;
