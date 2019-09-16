var t = -5*Math.PI,
    dt = 0.05,
    p1 = -2,
    dint = 2,
    data = d3.range(-3*Math.PI, 3*Math.PI, dt).map(next);


function func(t) {
    if (t==0) {
	return 1;
    } else {
	return Math.sin(t) / (t);
    }
}

function dfunc(t) {
    if (t==0) {
	return 0;
    } else {
	return Math.cos(t) / (t) - Math.sin(t) / Math.pow(t,2);
    }
}

function next(t) {
    return {
	time: t,
	value: func(t)
	//value: ~~Math.exp(t
    };
}

var lineFunc = d3.line()
    .x(function(d) {
	return x(d.time);
    })
    .y(function(d) {
	return y(d.value);
    });


var margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

var x = d3.scaleLinear().range([0, width]);
var y = d3.scaleLinear().range([height,0]);

x.domain(d3.extent(data, function(d) { return d.time }));
y.domain(d3.extent(data, function(d) { return d.value }));

xAxis = d3.axisLeft(y);
yAxis = d3.axisBottom(x);

let drag = d3.drag()
    .on('start', dragstarted)
    .on('drag', dragged)
    .on('end', dragended);


var charts = ['#derivation_chart', '#integration_chart'].reduce(function(acc, chart_id) {
    var chart = d3.select(chart_id)
	.append('svg')
	.attr('class', 'chart')
	.attr('width', width + margin.left + margin.right)
	.attr('height', height + margin.top + margin.bottom)
	.append('g')
	.attr('transform',
	      'translate(' + margin.left + ', ' + margin.top + ')');

    chart.append('g')
	.attr('class', 'x axis')
	.call(xAxis);

    chart.append('g')
	.attr('class', 'y axis')
	.attr('transform', 'translate(0,' + height + ')')
	.call(yAxis);

    chart.append('path')
	.attr('class', 'line')
	.data([data])
	.attr('d', lineFunc);

    acc[chart_id] = chart;
    return acc;
}, {});

// draw the finite difference line
var pdata = [p1, p1 + dint].map(function(d) {
	return {time: d,
		value: func(d)};
});

//Derivative chart
var fdiffg = charts['#derivation_chart'].append('g')
    .attr('class', 'finite-diff');

fdiffg.append('path')
    .attr('class', 'line line-finite-diff')
    .data([pdata])
    .attr('d', lineFunc);

fdiffg.selectAll('circle')
    .data(pdata)
    .enter().append('circle')
    .attr('class', 'circle circle-finite-diff')
    .attr('cx', function(d) { return x(d.time) })
    .attr('cy', function(d) { return y(d.value) })
    .attr('r', 5);

// Draw the derivative and tangent line
function ddata(d) {
    var t = (d[1].time + d[0].time) / 2;
    return [
	{ time: t,
	  value: func(t),
	  dvalue: dfunc(t)
	}
    ];
}

var dchart = charts['#derivation_chart'];
var derivg = dchart.append('g')
    .data(ddata(pdata))
    .attr('class', 'derivative');
    //.attr('transform', function(d) { return 'translate(' + x(d.time) + ',' + y(d.value) + ')'; });

derivg.selectAll('circle')
    .data(ddata(pdata))
    .enter().append('circle')
    .attr('class', 'circle circle-derivative')
    .attr('cx', function(d) { return x(d.time) })
    .attr('cy', function(d) { return y(d.value) })
    .attr('r', 5);

derivg.selectAll('circle')
    .call(drag);

drawFiniteDiff(pdata);

function finiteDiffText(d) {
    return 'f(a + h) - f(a)/h = ' + d3.format(',.2f')((d[1].value - d[0].value) / (d[1].time - d[0].time)); 
}

function derivativeText(d) {
    dd = ddata(d)[0];
    return 'd/dt = ' + d3.format(',.2f')(dd.dvalue);
}

var legend = dchart.append('g')
    .attr('class', 'legend')
    .attr('transform', 'translate(' + 10 + ',' + 100 + ')');

legend.append('text')
    .attr('id', 'text-finite-diff')
    .data([pdata])
    .text(finiteDiffText);

legend.append('text')
    .attr('id', 'text-derivative')
    .data([pdata])
    .attr('y', -20)
    .text(derivativeText);

function drawFiniteDiff(pdata) {
    var g = charts['#derivation_chart'].select('g.finite-diff');
    
    g.select('path')
	.data([pdata])
	.attr('d', lineFunc);
    
    g.selectAll('circle')
	.data(pdata)
	.attr('cx', function(d) { return x(d.time) })
	.attr('cy', function(d) { return y(d.value) })
	.attr('r', 5);
}


fdiffg.selectAll('g.finite-diff circle, g.finite-diff path')
    .call(drag);

var xdragstart = 0;
function dragstarted(d) {
    //xdragstart = x.invert(d3.event.x);
    d3.select(this).raise().classed('active', true);
}

function dragged(d) {
    //console.log('drag dragged');
    //console.log(d);
    
    d.time = x.invert(d3.event.x);
    d.value = func(d.time);

    pdata = [d.time - dint/2, d.time + dint/2]
	.map(function(d) {
	    var t = d;
	    return {
		time: t,
		value: func(t)
	    };
	});
    drawFiniteDiff(pdata);

    dchart.select('g.derivative').selectAll('circle')
	.data([ d ])
	.attr('cx', function(d) { return x(d.time); })
	.attr('cy', function(d) { return y(d.value); });
   
    dchart.select('g.legend text')
	.data([pdata])
	.text(finiteDiffText);

    dchart.select('#text-derivative')
	.data([pdata])
	.text(derivativeText);
    
}

function dragended(d) {
    d3.select(this).classed('active', false);
}


int_chart(charts['#integration_chart'], 8);

function int_chart(chart, npts) {
    var range = x.domain();
    var intervals = d3.range(npts).map(function(d) {
	return range[0]*(npts - d -1)/(npts - 1) + (d/(npts-1))*range[1];
    });

    /*chart.selectAll('circle')
	.data(intervals)
	.enter().append('area')
	.attr('cx', function(d) { return x(d); })
	.attr('cy', function(d) { return y(func(d)); })
	.attr('r', 2);*/
    var pint = (range[1] - range[0] / npts);
    var area= d3.area()
	.x0(function(d) { return x(d - pint/2); })
	.x1(function(d) { return x(d + pint/2); })
	.y0(y.domain()[0])
	.y1(function(d) { return y(func(d)); });

    chart.append('path')
	.data(intervals)
	.attr('class', 'area')
	.attr('d', area);
}
