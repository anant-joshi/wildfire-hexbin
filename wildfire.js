const width = 900, height = 500;

var svg = d3.select(".chart-container")
    .append("svg")
    .attr("viewBox", [0, 0, width, height])
    .style("preserveAspectRatio", "xMidYMid meet")
    .attr("position", "absolute");
    // .attr("width", width)
    // .attr("height", height);

//Need two separate groups for state/county boundaries
var boundaryGroup = svg.append("g");
// and hexbins.  
var hexbinGroup = svg.append("g");

control = d3.select(".control-container")

control.append("g").style("font-size", "25pt").attr("id", "yearTitle");


var yearSlider = control
    .append("input")
    .attr("type", "range")
    .attr("class", "slider")
    .attr("id", "yearSlider");


var projection = d3.geoAlbersUsa();

//this function can project a point like [x, y] into the chart coords
var path = d3.geoPath().projection(projection);
var hexbin = d3.hexbin().extent([[0, 0], [width, height]]).radius(0.2);

function plotChartByYear(hexGroup, dataByYear) {
    hexGroup.selectAll("*").remove();
    hexbin.x = d => {
	return parseFloat(d['0']);
    }
    hexbin.y = d => {
	return parseFloat(d['1']);
	}
	max_fires = 0
	min_fires = 100000
	manmade_ratio = 0

	binned_data = hexbin(dataByYear)

	for(i = 0; i<binned_data.length; i++){
		if(binned_data[i].length > max_fires){
			max_fires = binned_data[i].length
		}
		if(binned_data[i].length < min_fires){
			min_fires = binned_data[i].length
		}
	}

	var radius_scale = d3.scaleLinear().domain([min_fires, max_fires]).range([2, 20])

    // console.log(hexbin(csvData));
    printOnce = true

    hexGroup.selectAll("path")
	.data(binned_data)
	.enter()
	.append("path")
	.attr("transform", function(d) {
		// projecting the lat/longs into the chart coords
	    if(printOnce){
		// Sample output from hexbin
		//contains the x, y, array of datapoints corresponding to bin
		// TODO: Calculate the radius according to length,
		// TODO: Calculate color according to number of MANMADEs
		console.log(d);
		printOnce = false;
		}
	    p  = projection([d.x, d.y])
	    if(p == null){
		return "translate(0,0)";
	    }
	    x_ = p[0];
	    y_ = p[1];
	    return "translate(" + x_ + "," + y_ + ")"
	})
	.attr("d", function(d){
		return hexbin.hexagon(radius_scale(d.length))
	})
	.attr("fill", function(d) { 
		sum_manmade = 0
		for(i = 0; i<d.length; i++){
			sum_manmade += parseInt(d[i].MANMADE)
		}
		manmade_ratio = sum_manmade/d.length
		return d3.interpolateRdYlBu(1-manmade_ratio) 
	})
	.attr("fill-opacity", "0.4");

    //TODO: Add color attribute or add colorscale
	// This radius can be changed with a d3.scaleXXX

	//Append a defs (for definition) element to your SVG
	var defs = svg.append("defs");

	//Append a linearGradient element to the defs and give it a unique id
	var linearGradient = defs.append("linearGradient")
		.attr("id", "linear-gradient");
	
	linearGradient
	.attr("x1", "0%")
	.attr("y1", "0%")
	.attr("x2", "100%")
	.attr("y2", "0%");

	//Set the color for the start (0%)
	linearGradient.append("stop")
	.attr("offset", "0%")
	.attr("stop-color", d3.interpolateRdYlBu(1)); //light blue

	//Set the color for the end (100%)
	linearGradient.append("stop")
	.attr("offset", "100%")
	.attr("stop-color", d3.interpolateRdYlBu(0)); //dark blue

	svg.append("rect")
	.attr("transform", "translate(1000, 200)")
    .attr("width", 300)
    .attr("height", 20)
    .style("fill", "url(#linear-gradient)");
}


Promise.all([
    d3.tsv("./wildfire-years.tsv"), // Replace LONGITUDE with 0, and LATITUDE with 1
    d3.json("./10m.json") // counties-10m.json taken from https://github.com/topojson/us-atlas
]).then(([csvData, topoJsonData]) => {
    // Process data after loading
    states = topojson.feature(topoJsonData, topoJsonData.objects.states);
    counties = topojson.feature(topoJsonData, topoJsonData.objects.counties);

    // Print state boundaries
    boundaryGroup.selectAll("path")
	.data(states.features)
	.enter()
	.append("path")
	.attr("d", path)
	.attr("stroke", "black")
	.attr("fill", "rgba(0,0,0,0)")
	.attr("stroke-width", 1.0);

    // Print county boundaries
    boundaryGroup.selectAll("path")
	.data(counties.features)
	.enter()
	.append("path")
	.attr("d", path)
	.attr("stroke", "gray")
	.attr("fill", "rgba(0,0,0,0)")
	.attr("stroke-width", 0.5);

    years = [...new Set(csvData.map(d => d.FIRE_YEAR))];
    maxYear = Math.max(...years);
    minYear = Math.min(...years);
    yearSlider
	.attr("min", minYear)
	.attr("max", maxYear)
	.attr("defaultValue", minYear);

    slider = document.getElementById("yearSlider");
    dataByYear = csvData.filter(d => d.FIRE_YEAR == slider.value);
    plotChartByYear(hexbinGroup, dataByYear);
    d3.select("#yearTitle").html("Year: "+slider.value);

    yearSlider.on("input", (d, i) => {
	d3.select("#yearTitle").html("Year: "+slider.value);
    });

    yearSlider.on("change", () => {
	dataByYear = csvData.filter(d => d.FIRE_YEAR == slider.value);
	d3.select("#yearTitle").html("Year: "+slider.value);
	plotChartByYear(hexbinGroup, dataByYear);
    });


    // plotChartByYear(hexbinGroup, csvData, yearSlider.attr("value")); 


    // These functions are the functions that hexbin
    // requires to calculate the x and y coordinate

    // For some reason, the LATITUDE and LONGITUDE keys aren't working,
    // so I used and 1. The data files have been adjusted accordingly
});
