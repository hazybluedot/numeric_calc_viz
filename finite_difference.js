var t = -5*Math.PI,
    dt = 0.01,
    data = d3.range(-3*Math.PI, 3*Math.PI, dt).map(next);

function func(t) {
    let t2 = Math.pow(t,2);
    if (t==0) {
	return 0;	
    } else {
	return Math.cos(t) / (t) - Math.sin(t) / t2;
    }
}

function dfunc(t) {
    let t2 = Math.pow(t,2);
    if (t==0) {
	return -1/3;
    } else {
	return ((2-t2) * Math.sin(t) - 2*t*Math.cos(t)) *Math.pow(t,-3);
    }
}

function ifunc(t) {
    if (t==0) {
	return 1;
    } else {
	return Math.sin(t) / t;
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

yAxis = d3.axisLeft(y);
xAxis = d3.axisBottom(x);

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
	.attr('transform', 'translate(0,' + y(0) + ')')
	.call(xAxis);

    chart.append('g')
	.attr('class', 'y axis')
//	.attr('transform', 'translate(0,' + height + ')')
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
    let interval = [-2, 2],
	div = 6,
	params = {
	    interval: interval,
	    div: div
	};
    

    let area = d3.area()
	.x(function(d) { return x(d.time); })
	.y0(y(0))
	.y1(function(d) { return y(d.value); });

    $('#slider-ntraps').on('input', function(e) {
	div = e.target.value;
	let data = trapdata(interval, div);
	updateTraps(data);
	enterTraps(data);
	exitTraps(data);	

	d3.select('#text-trapz')
	    .datum(data)
	    .text(trapsText);

	d3.select('#ntraps-value').text(div);
    });

    let x0 = null;
    let drag_translate = d3.drag()
	.on('start', function(d) {
	    x0 = x.invert(d3.event.x);
	})
	.on('drag', function(d) {
	    dx = x.invert(d3.event.x) - x0;
	    x0 = x.invert(d3.event.x);
	    
	    let _interval = interval.map(function(d) { return d + dx; });
	    if (_interval[0] > x.domain()[0] && _interval[1] < x.domain()[1]) {
		interval = _interval;
		let data = intervaldata(interval);
		updateInterval(data);
		let tdata = trapdata(interval, div);
		updateTraps(tdata);

		d3.select('#text-trapz')
		    .datum(tdata)
		    .text(trapsText);
		
		d3.select('#text-integral')
		    .datum(interval)
		    .text(integralText);
	    }
	})
	.on('end', function(d) {
	    x0 = null;
	});

    enterTraps(trapdata(interval, div));

    // Add text labels
    function trapsText(d) {
	let sum = d.reduce(function(acc, trap) {
	    let h = trap[1].time - trap[0].time,
		b1 = trap[1].value,
		b2 = trap[0].value;
	    acc += h * ((b1 + b2) / 2);
	    return acc;
	}, 0);
	return '∑ fdx = ' + d3.format(',.2f')(sum); 
    }

    function integralText(interval) {
	let result = ifunc(interval[1]) - ifunc(interval[0]);
	return '∫f dx = ' + d3.format(',.2f')(result);
    }

    var disp = chart.append('g')
	.attr('class', 'disp')
	.attr('transform', 'translate(' + 10 + ',' + 100 + ')');

    disp.append('text')
	.attr('id', 'text-trapz')
	.datum(trapdata(interval, div))
	.text(trapsText);

    
    disp.append('text')
	.attr('id', 'text-integral')
	.datum(interval)
	.attr('y', -20)
	.text(integralText);

    
    function trapdata(interval, div) {
	let inc = (interval[1] - interval[0])/div;
	return d3.range(div).map(function(d) {
	    let t1 = interval[0] + d*inc,
		t2 = interval[0] + (d+1)*inc;
		return [{ idx: d + 'a', time: t1, value: func(t1) },
			{ idx: d + 'b', time: t2, value: func(t2) }];
	    
	});
    }

    function intervaldata(intervale) {
	return interval.map(function(d) {
	    return [{ time: d, value: 0 }, {time: d, value: func(d)}];
	});
    };

    let idata = intervaldata(interval),
	tdata = trapdata(interval, div);
    
    function updateTraps(data) {
	chart.selectAll('path.area-trapz')
	    .data(data)
	    .attr('d', area);
    }
    
    function enterTraps(data) {
	chart.selectAll('path.area-trapz')
	    .data(data)
	    .enter().append('path')
	    .attr('class', 'area area-trapz')
	    .attr('d', area)
	    .call(drag_translate);
	chart.select('.line-interval').raise();
    }

    function exitTraps(data) {
	chart.selectAll('path.area-trapz')
	    .data(data)
	    .exit().remove();
	chart.select('.line-interval').raise();
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
	    let _interval = interval;
	    _interval[draggedidx] = newx;

	    if (_interval[0] > x.domain()[0] && _interval[1] < x.domain()[1]) {
		interval = _interval;
		let data = intervaldata(interval);
		updateInterval(data);
		let tdata = trapdata(interval, div);
		updateTraps(tdata);

		d3.select('#text-trapz')
		    .datum(tdata)
		    .text(trapsText);

		d3.select('#text-integral')
		    .datum(interval)
		    .text(integralText);
	    }
	})
	.on('end', function(e) {
	    d3.select(this).classed('active', false);
	});
    
    chart.selectAll('.interval')
	.data(idata)
	.enter().append('path')
	.attr('class', 'line line-interval')
	.attr('d', lineFunc);
    
    function updateInterval(data) {
	chart.selectAll('path.line-interval')
	    .data(data)
	    .attr('d', lineFunc);
    }
    
    chart.selectAll('.line-interval')
	.call(drag);
    
    chart.selectAll('.area-trapz')
	.call(drag_translate);
    
    chart.select('.line').raise();
    chart.select('.axis').raise();
}

function derivative_chart(chart) {
    let params = { p1: -2, dint: 2};

    function ddata(d) {
	return {
	    time: d.p1,
	    value: func(d.p1),
	    dvalue: dfunc(d.p1)
	};
    };

    function fddata(d) { return [
	{ time: d.p1 - d.dint/2, value: func(d.p1 - d.dint/2) }, 
	{ time: d.p1 + d.dint/2, value: func(d.p1 + d.dint/2) }
    ]; };

    // Add the finite difference line and circles
    var fdiffg = chart.append('g')
	.attr('class', 'finite-diff');

    fdiffg.append('path')
	.attr('class', 'line line-finite-diff')
	.data([fddata(params)])
	.attr('d', lineFunc);

    console.log('params', params, 'fddata()', fddata(params));

    fdiffg.selectAll('circle')
	.data(fddata(params))
	.enter().append('circle')
	.attr('class', 'circle circle-finite-diff')
	.attr('cx', function(d) { return x(d.time) })
	.attr('cy', function(d) { return y(d.value) })
	.attr('r', 5);

    // Add the derivative dot
    var derivg = chart.append('g')
	.attr('class', 'derivative');

    derivg.selectAll('circle')
	.data([ddata(params)])
	.enter().append('circle')
	.attr('class', 'circle circle-derivative')
	.attr('cx', function(d) { return x(d.time) })
	.attr('cy', function(d) { return y(d.value) })
	.attr('r', 5);

    drawFiniteDiff(fddata(params));

    // Add the text output
    function finiteDiffText(d) {
	let delta = d[1].time - d[0].time,
	    deltaf = (d[1].value - d[0].value) / delta;
	let lines = ['Δf = ' + d3.format(',.2f')(deltaf),
		     'h = ' + d3.format(',.2f')(delta)];
	return lines;
    }

    function derivativeText(d) {
	return 'd/dt f = ' + d3.format(',.2f')(d.dvalue);
    }

    var legend = chart.append('g')
	.attr('class', 'legend')
	.attr('transform', 'translate(' + 10 + ',' + 80 + ')');

    console.log('pre legend params', params, 'fddata()', fddata(params));

    function textLines(params) {
	let text = [finiteDiffText(fddata(params))];
	text = [derivativeText(ddata(params))].concat(finiteDiffText(fddata(params)));
	return text;
    }

    let text = textLines(params);

    legend.append('text')
	.attr('id', 'text-derivative')
	.selectAll('tspan')
	.data(text).enter()
	.append('tspan')
    	.attr('x', 0)
	.attr('dy', function(d,i) {
	    console.log('dy d', d, 'i', i);
	    if (i > 0) {
		return 20;
	    } else {
		return null;
	    }
	})
	.text(function(d) { return d; });

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

    let x0 = null
    let drag = d3.drag()
	.on('start', function(d) {
	    console.log('drag start', this, d);
	    //xdragstart = x.invert(d3.event.x);
	    d3.select(this).classed('active', true);
	})
	.on('drag', function(d) {
	    params.p1 = x.invert(d3.event.x);

	    updateParams(params);	    
	})
	.on('end', function(d) {
	    d3.select(this).classed('active', false);
	});

    chart.selectAll('circle.circle-derivative, g.finite-diff')
	.call(drag);

    function updateParams(params) {
	let pdata = fddata(params);

	drawFiniteDiff(pdata);
	
	chart.select('g.derivative').selectAll('circle')
	    .data([ ddata(params) ])
	    .attr('cx', function(d) { return x(d.time); })
	    .attr('cy', function(d) { return y(d.value); });

	let text = textLines(params);
	chart.select('g.legend text')
	    .selectAll('tspan')
	    .data(text)
	    .text(function(d) { return d; });

    };
    
    // behavior when dragging the finite difference circle or path
    let draggedidx = null;
    let hdrag = d3.drag()
	.on('start', function(d) {
	    let ddata = fddata(params)
	    draggedidx = ddata.map((d) => d.time).indexOf(d.time);
	})
	.on('drag', function(d) {
	    let data = fddata(params);
	    data[draggedidx].time = x.invert(d3.event.x);
	    params.dint = Math.abs(data[1].time - data[0].time);
	    params.p1 = (data[1].time + data[0].time)/2;

	    updateParams(params);	    
	})
	.on('end', function(e) {
	});
    
    fdiffg.selectAll('g.finite-diff circle')
	.call(hdrag);
}
