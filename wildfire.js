const width = 1100, height = 500;

var svg = d3.select("body")
    .append("svg")
    .attr("viewBox", [0, 0, width, height]);
    // .attr("width", width)
    // .attr("height", height);

//Need two separate groups for state/county boundaries
var g2 = svg.append("g");
// and hexbins.
var g1 = svg.append("g");

var projection = d3.geoAlbersUsa();

//this function can project a point like [x, y] into the chart coords
var path = d3.geoPath().projection(projection);
var hexbin = d3.hexbin().extent([[0, 0], [width, height]]).radius(0.2);

Promise.all([
    d3.tsv("./wildfire-year.tsv"), // Replace LONGITUDE with 0, and LATITUDE with 1
    d3.json("./10m.json") // counties-10m.json taken from https://github.com/topojson/us-atlas
]).then(([csvData, topoJsonData]) => {
    // Process data after loading
    states = topojson.feature(topoJsonData, topoJsonData.objects.states);
    counties = topojson.feature(topoJsonData, topoJsonData.objects.counties);

    // Print state boundaries
    g2.selectAll("path")
	.data(states.features)
	.enter()
	.append("path")
	.attr("d", path)
	.attr("stroke", "black")
	.attr("fill", "rgba(0,0,0,0)")
	.attr("stroke-width", 1.0);

    // Print county boundaries
    g2.selectAll("path")
	.data(counties.features)
	.enter()
	.append("path")
	.attr("d", path)
	.attr("stroke", "gray")
	.attr("fill", "rgba(0,0,0,0)")
	.attr("stroke-width", 0.5);


    // These functions are the functions that hexbin
    // requires to calculate the x and y coordinate

    // For some reason, the LATITUDE and LONGITUDE keys aren't working,
    // so I used and 1. The data files have been adjusted accordingly
    hexbin.x = d => {
	return parseFloat(d['0']);
    }
    hexbin.y = d => {
	return parseFloat(d['1']);
    }

    // console.log(hexbin(csvData));
    printOnce = true

    g1.selectAll("path")
	.data(hexbin(csvData))
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
	}).attr("d", hexbin.hexagon(2));
    //TODO: Add color attribute or add colorscale
    // This radius can be changed with a d3.scaleXXX
});
