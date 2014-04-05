var margin = {top: 20, right: 20, bottom: 30, left: 40},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var formatPercent = d3.format("%");

var x = d3.scale.ordinal()
    .rangeRoundBands([0, width], .1, 0.5);

var y = d3.scale.linear()
    .range([height, 0]);

var xAxis = d3.svg.axis()
    .scale(x)
    .orient("bottom");

var yAxis = d3.svg.axis()
    .scale(y)
    .orient("left")
    .tickFormat(formatPercent);

var svg = d3.select("body").append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var percent = function(str) {
  return parseInt(str.match(/(\d+\.\d+)/g));
};

function wrap(text, width) {
  text.each(function() {
    var text = d3.select(this),
        words = text.text().split(/\s+/).reverse(),
        word,
        line = [],
        lineNumber = 0,
        lineHeight = 1.1, // ems
        y = text.attr("y"),
        dy = parseFloat(text.attr("dy")),
        tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
    while (word = words.pop()) {
      line.push(word);
      tspan.text(line.join(" "));
      if (tspan.node().getComputedTextLength() > width) {
        line.pop();
        tspan.text(line.join(" "));
        line = [word];
        tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
      }
    }
  });
}

d3.tsv("dataex.tsv", function(error, data) {
  console.log(data);
  var keys = d3.keys(data[0]);
  keys.splice(keys.indexOf("Name"), 1);

  var filters = d3.select("#filters");
  keys.forEach(function(k) {
    var li = filters.append("li");
    li.append("input")
      .attr("type", "radio")
      .attr("name", "filters")
      .attr("value", k);

    li.append("label").text(k);
  });

  var li = filters.append("li");
  li.append("input").attr("id", "sortCheckbox").attr("type", "checkbox");
  li.append("label").text("Sort");

  svg.append("g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + height + ")");

  svg.append("g")
      .attr("class", "y axis")
      .append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", 6)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Frequency");

  d3.selectAll("input").on("change", function() { change(false); });
  d3.select("#filters li input").property("checked", true);
  change(true);

  function change(noDelay) {
    var selectedKey = d3.select("#filters input:checked").attr('value');
    var shouldSort = d3.select("#sortCheckbox").property('checked');

    data.forEach(function(d) {
      console.log(d["Name"], "-", d[selectedKey]);
      d.value = percent(d[selectedKey]) / 100;
    });

   var transition = svg.transition().duration(750),
        delay = noDelay ? 0 : function(d, i) { return i * 50; };

    var xData = shouldSort ? data.map(function(d) { return d; })
                                 .sort(function(a, b) { return b.value - a.value; })
                           : data;
    x.domain(xData.map(function(d) { return d["Name"]; }));
    y.domain([0, d3.max(data, function(d) { return d.value; })]);

    var bars = svg.selectAll(".bar")
      .data(data);

    bars.enter().append("rect")
      .attr("class", "bar")
      .attr("width", x.rangeBand());

    transition.selectAll(".bar")
      .delay(delay)
      .attr("x", function(d) { return x(d["Name"]); })
      .attr("y", function(d) { return y(d.value); })
      .attr("height", function(d) { return height - y(d.value); });

    transition.select(".x.axis")
        .call(xAxis)
        .selectAll(".tick text")
        .call(wrap, x.rangeBand())
        .selectAll("g")
        .delay(delay);

    transition.select(".y.axis")
        .call(yAxis);
  }
});
