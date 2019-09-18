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

let hdrag = d3.drag()
    .on('start', function(d, idx) {
	console.log('drag start on d');
	console.log(d);
	console.log(idx);
	console.log('and this');
	console.log(this);
	d3.select(this).classed('active', true);
    })
    .on('drag', function(d,idx) {
	console.log('drag on d');
	console.log(d);
	console.log(idx);
	console.log('and this');
	console.log(this);
    })
    .on('end', function(d) {
	d3.select(this).classed('active', false);
    });

let charts = ['#derivative_chart', '#integral_chart'].reduce(function(charts, domid) {
    var chart = d3.select(domid)
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

    charts[domid] = chart;
    return charts;
}, []);

derivative_chart(charts['#derivative_chart']);
integral_chart(charts['#integral_chart']);

$('#slider-ntraps').on('draged', function(e) {
    console.log('slider-traps draged', e);
});

function integral_chart(chart) {
    let interval = [-4, 4];
    let div = 6;

    let area = d3.area()
	.x(function(d) { return x(d.time); })
	.y0(height)
	.y1(function(d) { return y(func(d.time)); });

    $('#slider-ntraps').on('input', function(e) {
	div = e.target.value;
	let data = trapdata(interval, div);
	console.log('trapdata', data);
	enterTraps(data);
	exitTraps(data);
    });

    enterTraps(trapdata(interval, div));
    console.log(y.domain());
    console.log(d3.extent(interval));

    function trapdata(interval, div) {
	let inc = (interval[1] - interval[0])/div;
	return d3.range(div).map(function(d) {
	    return [{ idx: d, time: interval[0] + d*inc},
		    { idx: d, time: interval[0] + (d+1)*inc}];
	    
	});
    }

    let idata = function(intervale) {
	return interval.map(function(d) {
	    return [{ time: d, value: y.domain()[0] }, {time: d, value: func(d)}];
	});
    };

    function updateTraps(data) {
    }
    
    function enterTraps(data) {
	chart.selectAll('.area-trap')
	    .data(data, function(d) { return d.idx; })
	    .enter().append('path')
	    .attr('class', 'area area-trap')
	    .attr('d', area);
    }

    function exitTraps(data) {
	chart.selectAll('.area-trap')
	    .data(data, function(d) { return d.idx; })
	    .exit().remove();
    }
    
    let draggedidx = null;
    let drag = d3.drag()
	.on('start', function(e) {
	    console.log(this, e);
	    d3.select(this).classed('active', true);
	    draggedidx = interval.indexOf(e[0].time);
	})
	.on('drag', function(e) {
	    let newx = x.invert(d3.event.x);
	    interval[draggedidx] = newx;
	    updateInterval(interval);
	})
	.on('end', function(e) {
	    d3.select(this).classed('active', false);
	});

    //drawInterval(interval);
	
    
    /*data.forEach(function(d) {
	chart.append('path')
	    .datum(d)
	    .attr('class', 'area')
	    .attr('d', area);
	    });*/
    
    chart.selectAll('.interval')
	.data(idata(interval))
	.enter().append('path')
	.attr('class', 'line line-interval')
	.attr('d', lineFunc);
    
    function updateInterval(interval) {
	chart.selectAll('path.line-interval')
	    .data(idata(interval))
	    .attr('d', lineFunc);

	chart.selectAll('path.area-trap')
	    .data(trapdata(interval))
	    .attr('d', area);
    }
    
    chart.selectAll('.line-interval')
	.call(drag);
    
    chart.select('.line').raise();
}

function derivative_chart(chart) {
    let drag = d3.drag()
	.on('start', dragstarted)
	.on('drag', dragged)
	.on('end', dragended);
    
    // draw the finite difference line
    var pdata = [p1, p1 + dint].map(function(d) {
	return {time: d,
		value: func(d)};
    });

    var fdiffg = chart.append('g')
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
	//console.log('ddata(d) for d');
	//console.log(d);
	var t = (d[1].time + d[0].time) / 2;
	return [
	    { time: t,
	      value: func(t),
	      dvalue: dfunc(t)
	    }
	];
    }

    var derivg = chart.append('g')
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

    var legend = chart.append('g')
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
	var g = chart.select('g.finite-diff');
	
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
	.call(hdrag);

    var xdragstart = 0;
    function dragstarted(d) {
	//xdragstart = x.invert(d3.event.x);
	d3.select(this).classed('active', true);
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

	chart.select('g.derivative').selectAll('circle')
	    .data([ d ])
	    .attr('cx', function(d) { return x(d.time); })
	    .attr('cy', function(d) { return y(d.value); });
	
	chart.select('g.legend text')
	    .data([pdata])
	    .text(finiteDiffText);

	chart.select('#text-derivative')
	    .data([pdata])
	    .text(derivativeText);
	
    }

    function dragended(d) {
	d3.select(this).classed('active', false);
    }
}
