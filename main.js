// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 900 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create SVG containers for both charts
const svg1_line = d3.select("#lineChart1") // If you change this ID, you must change it in index.html too
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const svg2_bar = d3.select("#lineChart2")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// (If applicable) Tooltip element for interactivity
// const tooltip = ...

// 2.a: LOAD...
d3.csv("aircraft_incidents.csv").then(data => {


    // REFORMAT DATA
    data.forEach(d => {
        d.year = new Date(d.Event_Date).getFullYear(); // Parse dates and get year
        d.fatalities = +d.Total_Fatal_Injuries;
        d.make = d.Make;
        d.injury = d.Total_Serious_Injuries
    });
    // Check reformated data 
    console.log(data);

    // GROUP DATA
    const groupedData2 = d3.groups(data, d => d.year)
        .map(([year, entries]) => ({
            year, 
            fatalities: d3.sum(entries, e => e.fatalities)
        }));
    // Check grouped data 
    console.log(groupedData2);

    // PIVOT DATA 
    const pivotedData2 = groupedData2.flatMap(({ year, fatalities }) => [
                {year, fatalities: fatalities}
            ]);
    // Check pivoted data 
    console.log("Final pivoted data:", pivotedData2);

    /*
    const dataArrayLine = Array.from(pivotedData2,
        ([year, fatalities]) => ({year, fatalities}))
        .sort((a, b) => a.year - b.year)
    ; 
    // Check data array 
    console.log(dataArrayLine);

    */ 

    let xYear = d3.scaleLinear()
    .domain([1995, d3.max(pivotedData2, d => d.year)])
    .range([0, width]); // START low, INCREASE
        
    
    // 4.b: Y scale (Gross)
    let yFatalilities = d3.scaleLinear()
        .domain([0, d3.max(pivotedData2, d => d.fatalities)])
        .range([height,0]); // START high, DECREASE

    // 4.c: Define line generator for plotting line
    const line = d3.line()
        .x(d => xYear(d.year))
        .y(d => yFatalilities(d.fatalities));

    svg1_line.append("path")
        .datum(pivotedData2)
        .attr("d", line)
        .attr("stroke", "steelblue")
        .attr("stroke-width", 5)
        .attr("fill", "none");

     // 6: ADD AXES FOR LINE CHART
    // 6.a: X-axis (Year)
    svg1_line.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xYear)
            .tickFormat(d3.format("d")) // remove decimals
    );


    // 6.b: Y-axis (Gross)
    svg1_line.append("g")
        .call(d3.axisLeft(yFatalilities)
    );

    // 7: ADD LABELS FOR LINE CHART
    // 7.a: Chart Title
    // svg1_line.append("text")
    //     .attr("class", "title")
    //     .attr("x", (width / 2) - 10 )
    //     .attr("y", -margin.top / 2)
    //     .text("Fatalities (1995 - 2016)");


    // 7.b: X-axis label (Year)
    svg1_line.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + (margin.bottom / 2) + 10)
        .text("Year");

    // 7.c: Y-axis label (Avg Gross)
    svg1_line.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", (-margin.left / 2) - 10 )
        .attr("x", -height / 2)
        .text("Fatalities");


    // 7.a: ADD INTERACTIVITY FOR CHART 1
     // // Tooltip
     const tooltip = d3.select("body") // Create tooltip
     .append("div")
     .attr("class", "tooltip")
     .style("position", "absolute")
     .style("visibility", "hidden")
     .style("background", "rgba(0, 0, 0, 0.7)")
     .style("color", "white")
     .style("padding", "10px")
     .style("border-radius", "5px")
     .style("font-size", "12px");

 svg1_line.selectAll(".data-point") // Create tooltip events
     .data(pivotedData2) 
     .enter()
     .append("circle")
     .attr("class", "data-point")
     .attr("cx", d => xYear(d.year))
     .attr("cy", d => yFatalilities(d.fatalities))
     .attr("r", 25)
     .style("fill", "steelblue")
     .style("opacity", 0)  // Make circles invisible by default
     // --- MOUSEOVER ---
     .on("mouseover", function(event, d) {
         tooltip.style("visibility", "visible")
             .html(`<strong>Year:</strong> ${d.year} <br><strong>Fatalities:</strong> ${d.fatalities}`)
             .style("top", (event.pageY + 10) + "px") // Position relative to pointer
             .style("left", (event.pageX + 10) + "px");

         // Create the large circle at the hovered point
         svg1_line.append("circle")
             .attr("class", "hover-circle")
             .attr("cx", xYear(d.year))  // Position based on the xScale (year)
             .attr("cy", yFatalilities(d.fatalities)) // Position based on the yScale (fatalities)
             .attr("r", 6)  // Radius of the large circle
             .style("fill", "steelblue") // Circle color
             .style("stroke-width", 2);
     })
     // --- MOUSEOUT ---
     .on("mouseout", function() {
         tooltip.style("visibility", "hidden");

         // Remove the hover circle when mouseout occurs
         svg1_line.selectAll(".hover-circle").remove();

         // Make the circle invisible again
         d3.select(this).style("opacity", 0);  // Reset opacity to 0 when not hovering
     });


        // T3.1: Function to calculate the linear regression (trendline)
        function linearRegression(data) {
            const n = data.length;
            const sumX = d3.sum(data, d => d.year);
            const sumY = d3.sum(data, d => d.fatalities);
            const sumXY = d3.sum(data, d => d.year * d.fatalities);
            const sumX2 = d3.sum(data, d => d.year * d.year);

            // Calculate slope (m) and intercept (b)
            const m = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
            const b = (sumY - m * sumX) / n;

            // Generate points for the trendline
            const trendlineData = data.map(d => ({
                year: d.year,
                fatalities: m * d.year + b
            }));

            return trendlineData;
        };
    
        // T3.2: Function to draw the trendline if the checkbox is checked
        function drawTrendline() {
            // T3.3: Set-up data
            // Filter data based on the selected category (D6.1: Make selected category dynamic)
    
            const trendlineData = linearRegression(pivotedData2);

            // T2.4: Remove the previous trendline if it exists
            svg1_line.selectAll(".trendline").remove();
    
            // T2.5: Draw trendline based on set-up data
            svg1_line.append("path")
                .data([trendlineData])
                .attr("class", "trendline")
                .attr("d", d3.line()
                    .x(d => xYear(d.year))
                    .y(d => yFatalilities(d.fatalities))
                )
                .attr("fill", "none")
                .attr("stroke", "gray")
                .attr("stroke-width", 2)
                .attr("stroke-dasharray", "5,5");
        }
    
        // T4: Manually draw trendline
        d3.select("#trendline-toggle").on("change", function() {
            // T5.2: Get whether the checkbox is checked
            const isChecked = d3.select(this).property("checked");
            // D6.2: Get the current selected category
           // const selectedCategory = d3.select("#categorySelect").property("value");
            // T5.3: Show or hide the trendline based on the checkbox state
            if (isChecked) {
                // D6.2: Draw the trendline for the selected category
                drawTrendline(pivotedData2);
            } else {
                svg1_line.selectAll(".trendline").remove(); // Remove the trendline if the checkbox is unchecked
            }
        });


    // ==========================================
    //         CHART 2 (if applicable)
    // ==========================================

    // 3.b: SET SCALES FOR CHART 2
        // 3.a Clean data
    // 3. PREPARE DATA
    // clean data 

    const cleanBarData = data.filter(d =>
        d.make != ''
        && d.injury != 0
    );

    console.log("Clean bar data: ", cleanBarData);

    // 3.b Group by [director] & aggregate [score]
    const barMap = d3.rollup(cleanBarData
        ,v => d3.sum(v, d => d.injury)
        ,d => d.make
    );

    console.log(barMap)
    
    // 3.c Sort & get top 6
    const barFinalArray = Array.from(barMap // conver to array
        ,([make, injury]) => ({ make, injury })
    );

    console.log("Final bar data: ", barFinalArray);

    // 4: SCALE AXES
    // 4.a: x-axis (director)
    let xMake = d3.scaleBand() // Use instead of scaleLinear() for bar charts
        .domain(barFinalArray.map(d => d.make)) // Extract unique categories for x-axis
        .range([0, width]) // START low, INCREASE
        .padding(0.1); // Add space between bars

    // 4.b: y-axis (score)
    let yInjury = d3.scaleLinear()
        .domain([0, d3.max(barFinalArray, d => d.injury)])
        .range([height,0]); // START high, DECREASE


    // 5: PLOT DATA
    svg2_bar.selectAll("rect")
        .data(barFinalArray)
        .enter()
        .append("rect")
        .attr("x", d => xMake(d.make))
        .attr("y", d => yInjury(d.injury))
        .attr("width", xMake.bandwidth())
        .attr("height", d => height - yInjury(d.injury))
        .attr("fill", "steelblue")
        ;
    
    svg2_bar.append("g") // x-axis
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xMake).tickFormat(d => d));



    // 6: ADD AXES
    // 6.a: x-axis




    // 4.b: PLOT DATA FOR CHART 2
    svg2_bar.selectAll("rect")
    .data(barFinalArray)
    .enter()
    .append("rect")
    .attr("x", d => xMake(d.make))
    .attr("y", d => yInjury(d.injury))
    .attr("width", xMake.bandwidth())
    .attr("height", d => height - yInjury(d.injury))
    .attr("fill", "steelblue")
    ;
    svg2_bar.append("g") // x-axis
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xMake).tickFormat(d => d));



    // 5.b: ADD AXES FOR CHART 

    

    svg2_bar.append("g") // y-axis
    .call(d3.axisLeft(yInjury));

    svg2_bar.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(xMake));

    // 6.b: y-axis
    svg2_bar.append("g")
    .call(d3.axisLeft(yInjury));

    // 6.b: ADD LABELS FOR CHART 2
    // svg2_bar.append("text")
    //     .attr("class", "title")
    //     .attr("x", width / 2)
    //     .attr("y", -margin.top / 2)
    //     .text("Top 6 Director's IMDb Scores");

     svg2_bar.append("text")
        .attr("class", "axis-label")
        .attr("x", width / 2)
        .attr("y", height + (margin.bottom / 2) + 10)
        .text("Manufacturers");


    svg2_bar.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", -margin.left / 2)
        .attr("x", -height / 2)
        .text("Number of Incidents");

    // 7.b: ADD INTERACTIVITY FOR CHART 2

   
});