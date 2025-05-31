// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create SVG containers for both charts
const svg1_line = d3.select("#lineChart1")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const svg2_bar = d3.select("#lineChart2")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Tooltip
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("position", "absolute")
    .style("visibility", "hidden")
    .style("background", "rgba(0, 0, 0, 0.75)")
    .style("color", "white")
    .style("padding", "8px 12px")
    .style("border-radius", "5px")
    .style("font-size", "13px")
    .style("pointer-events", "none");

// 2: LOAD CSV DATA
d3.csv("aircraft_incidents.csv").then(data => {
    // Reformat data
    data.forEach(d => {
        d.year = new Date(d["Event_Date"]).getFullYear();
        d.fatalities = +d["Total_Fatal_Injuries"];
        d.injury = +d["Total_Serious_Injuries"];
        d.make = d["Make"];
    });

    // ===== CHART 1: FATALITIES BY YEAR (LINE CHART) =====
    const yearlyData = d3.groups(data, d => d.year)
        .map(([year, values]) => ({
            year,
            fatalities: d3.sum(values, d => d.fatalities)
        }));

    const xYear = d3.scaleLinear()
        .domain([1995, d3.max(yearlyData, d => d.year)])
        .range([0, width]);

    const yFatalities = d3.scaleLinear()
        .domain([0, d3.max(yearlyData, d => d.fatalities)])
        .range([height, 0]);

    const line = d3.line()
        .x(d => xYear(d.year))
        .y(d => yFatalities(d.fatalities));

    svg1_line.append("path")
        .datum(yearlyData)
        .attr("d", line)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 3);

    svg1_line.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xYear).tickFormat(d3.format("d")));

    svg1_line.append("g")
        .call(d3.axisLeft(yFatalities));

    svg1_line.selectAll(".data-point")
        .data(yearlyData)
        .enter()
        .append("circle")
        .attr("class", "data-point")
        .attr("cx", d => xYear(d.year))
        .attr("cy", d => yFatalities(d.fatalities))
        .attr("r", 25)
        .style("fill", "steelblue")
        .style("opacity", 0)
        .on("mouseover", function(event, d) {
            tooltip.style("visibility", "visible")
                .html(`<strong>Year:</strong> ${d.year}<br><strong>Fatalities:</strong> ${d.fatalities}`)
                .style("top", (event.pageY + 10) + "px")
                .style("left", (event.pageX + 10) + "px");

            svg1_line.append("circle")
                .attr("class", "hover-circle")
                .attr("cx", xYear(d.year))
                .attr("cy", yFatalities(d.fatalities))
                .attr("r", 6)
                .style("fill", "steelblue");
        })
        .on("mouseout", function() {
            tooltip.style("visibility", "hidden");
            svg1_line.selectAll(".hover-circle").remove();
        });

    // ===== TRENDLINE TOGGLE =====
    function linearRegression(data) {
        const n = data.length;
        const sumX = d3.sum(data, d => d.year);
        const sumY = d3.sum(data, d => d.fatalities);
        const sumXY = d3.sum(data, d => d.year * d.fatalities);
        const sumX2 = d3.sum(data, d => d.year * d.year);

        const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const b = (sumY - m * sumX) / n;

        return data.map(d => ({
            year: d.year,
            fatalities: m * d.year + b
        }));
    }

    function toggleTrendline(show, data) {
        svg1_line.selectAll(".trendline").remove();

        if (show) {
            const trendlineData = linearRegression(data);

            svg1_line.append("path")
                .datum(trendlineData)
                .attr("class", "trendline")
                .attr("d", d3.line()
                    .x(d => xYear(d.year))
                    .y(d => yFatalities(d.fatalities))
                )
                .attr("stroke", "gray")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "5,5")
                .attr("fill", "none");
        }
    }

    d3.select("#trendline-toggle").on("change", function() {
        const isChecked = d3.select(this).property("checked");
        toggleTrendline(isChecked, yearlyData);
    });

    // Initial draw (if checkbox is already checked)
    if (d3.select("#trendline-toggle").property("checked")) {
        toggleTrendline(true, yearlyData);
    }

    // ===== CHART 2: INJURIES BY MANUFACTURER (BAR CHART) =====
    const cleanBarData = data.filter(d => d.make && d.injury > 0);

    const barData = Array.from(
        d3.rollup(cleanBarData, v => d3.sum(v, d => d.injury), d => d.make),
        ([make, injury]) => ({ make, injury })
    );

    const xMake = d3.scaleBand()
        .domain(barData.map(d => d.make))
        .range([0, width])
        .padding(0.1);

    const yInjury = d3.scaleLinear()
        .domain([0, d3.max(barData, d => d.injury)])
        .range([height, 0]);

    svg2_bar.selectAll(".bar")
        .data(barData)
        .enter()
        .append("rect")
        .attr("class", "bar")
        .attr("x", d => xMake(d.make))
        .attr("y", d => yInjury(d.injury))
        .attr("width", xMake.bandwidth())
        .attr("height", d => height - yInjury(d.injury))
        .attr("fill", "steelblue")
        .on("mouseover", function(event, d) {
            d3.select(this).attr("fill", "darkblue");

            tooltip.style("visibility", "visible")
                .html(`<strong>Manufacturer:</strong> ${d.make}<br><strong>Injuries:</strong> ${d.injury}`);
        })
        .on("mousemove", function(event) {
            tooltip.style("top", (event.pageY - 10) + "px")
                .style("left", (event.pageX + 10) + "px");
        })
        .on("mouseout", function() {
            d3.select(this).attr("fill", "steelblue");
            tooltip.style("visibility", "hidden");
        });

    svg2_bar.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xMake));

    svg2_bar.append("g")
        .call(d3.axisLeft(yInjury));
});
