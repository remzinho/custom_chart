function formatTime(unix_timestamp) {
  var theDate = new Date(unix_timestamp * 1000);
  var dateString = theDate.toGMTString();
  return dateString;
}

function total(obj) {
  let keys = Object.keys(obj);
  let t = 0;
  keys.forEach((k) => {
    if (obj[k].collapsed == 1) {
      t = t + 1;
    } else {
      t = t + obj[k].total;
    }
  });

  return t;
}

function barChart() {
  // set the dimensions and margins of the graph
  const margin = { top: 30, right: 30, bottom: 70, left: 60 },
    width = 760 - margin.left - margin.right,
    height = 600 - margin.top - margin.bottom;

  // append the svg object to the body of the page
  const svg = d3
    .select("#my_dataviz")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  var tooltip = d3
    .select("#my_dataviz")
    .append("div")
    .attr("id", "tooltip")
    .style("opacity", 0);

  const mouseover = function (event, d) {
    tooltip.style("opacity", 1);
    d3.select(this).attr("stroke", "black");
  };
  const mousemove = function (event, d) {
    tooltip
      .html(
        `<span style="font-size:20px;font-weight:bold">Value: ${
          d.data.result
        }</span><br><span style="font-size:20px;font-weight:bold">Time: ${formatTime(
          d.data.timestamp
        )}`
      )
      .style("left", event.pageX + "px")
      .style("top", event.pageY + "px");
  };
  const mouseleave = function (d) {
    tooltip.style("opacity", 0);
    d3.select(this).attr("stroke", "grey");
  };

  // Initialize the X axis
  d3.json("./sample_results.json").then(function (data) {
    let our_data = [];
    let keys = Object.keys(data);

    let collapsed = {};
    let count = 0;
    keys.forEach((k, i) => {
      collapsed[k] = { collapsed: 1, total: data[k].length };
      data[k].forEach((d) => {
        our_data.push({
          version: k,
          data: d,
          position: count,
        });
      });
      count++;
    });

    const colors = [
      "#01405c",
      "#2f4b7c",
      "#665292",
      "#a05195",
      "#d55088",
      "#f95d6b",
      "#fa815d",
      "#ffa600",
    ];
    const x = d3.scaleBand().range([0, width]).padding(0.4);

    const xAxis = svg.append("g").attr("transform", `translate(0,${height})`);
    x.domain(our_data.map((d) => d.version));
    // x1.domain([0, total(collapsed)]);
    xAxis.call(d3.axisBottom(x));

    // Initialize the Y axis
    const y = d3.scaleLinear().range([height, 0]);
    const yAxis = svg.append("g").attr("class", "myYaxis");

    // A function that create / update the plot for a given variable:
    function update() {
      // Update the Y axis
      y.domain([0, d3.max(our_data, (d) => d.data.result)]);
      yAxis.transition().duration(500).call(d3.axisLeft(y));

      svg.selectAll("rect").remove();
      d3.selectAll(".collapsedLabels").remove();

      // Create the u variable
      var u = svg.selectAll("rect").data(our_data);

      let count = 0,
        shadow = 0,
        colorCount = 0;

      u.join("rect")
        .on("click", function (i, d) {
          tooltip.style("opacity", 0);
          collapsed[d.version].collapsed =
            collapsed[d.version].collapsed == 1 &&
            collapsed[d.version].total > 1
              ? 0
              : 1;
          update();
        }) // Add a new rect for each new elements
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave)
        // .transition()
        // .duration(1000)
        .attr("x", function (d, i) {
          count =
            i != 0 && our_data[i].version != our_data[i - 1].version
              ? 0
              : count + 1;
          return (
            x(d.version) +
            (collapsed[d.version].collapsed == 1
              ? 0
              : (x.bandwidth() / collapsed[d.version].total) * count - 1)
          );
        })
        // .attr("y", (d) => y(d.data.result))
		.attr("y", d => y(0))
        .attr("width", function (d) {
          return collapsed[d.version].collapsed == 1
            ? x.bandwidth()
            : x.bandwidth() / collapsed[d.version].total;
        })
		.attr("height", d => height - y(0))
        
        .attr("fill", function (d, i) {
          colorCount =
            i != 0 && our_data[i].version != our_data[i - 1].version
              ? 0
              : colorCount + 1;
          return collapsed[d.version].collapsed == 1
            ? "#01405c"
            : colors[colorCount];
        })
        .attr("stroke", "grey")
        .attr("opacity", function (d, i) {
          shadow =
            i != 0 && our_data[i].version != our_data[i - 1].version
              ? 0
              : shadow + 1;
          return collapsed[d.version].collapsed == 1 && shadow != 0 ? 0.25 : 1;
        })
		// .delay((d,i) => {console.log(i); return i*10000});
		
		svg.selectAll("rect")
  .transition()
  .duration(400)
  .attr("y", (d) => y(d.data.result))
  .attr("height", (d) => height - y(d.data.result))
  .delay((d,i) => {console.log(i); return i*100})

      let labelsArr = [];

      let checkC = our_data[0].version;
      our_data.forEach((d, i) => {
        if (i == 0) {
          if (collapsed[d.version].collapsed == 1) {
            labelsArr.push({
              version: d.version,
              total: collapsed[d.version].total,
              value: d.data.result,
            });
          }
        } else {
          if (checkC != d.version) {
            checkC = d.version;
            if (collapsed[d.version].collapsed == 1) {
              labelsArr.push({
                version: d.version,
                total: collapsed[d.version].total,
                value: d.data.result,
              });
            }
          }
        }
      });

      svg
        .selectAll("labels")
        .data(labelsArr)
        .join("text")
        .transition()
        .duration(500)
        .text(function (d) {
          return d.total;
        })
        .attr("class", "collapsedLabels")
        .attr("x", function (d) {
          return x(d.version) + x.bandwidth() / 2;
        })
        .attr("y", function (d) {
          return y(d.value / 2);
        })
        .style("text-anchor", "middle")
        .style("stroke", "white");
    }

    update();
  });
}
