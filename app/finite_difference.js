let d3 = require("d3"),
    domready = require("domready");

import { observable, autorun} from "mobx";

module.exports = function(chart, func, dfunc, scales) {
    let params = observable({
	a: 2,
	dt: 2,

	get f() {
	    return func(this.a);
	},
	get dfdt() {
	    return dfunc(this.a);
	},
	get finiteDiffPts() {
	    let t1 = this.a - this.dt/2,
		t2 = this.a + this.dt/2;
	    return [
		{ time: t1, value: func(t1) }, 
		{ time: t2, value: func(t2) }
	    ];	
	},
	get text() {
	    let d = this.finiteDiffPts,
		delta = d[1].time - d[0].time,
		deltaf = (d[1].value - d[0].value) / delta;
	    let lines = [
		'df/dt = ' + d3.format(',.2f')(this.dfdt),
		'Δf = ' + d3.format(',.2f')(deltaf),
		'h = ' + d3.format(',.2f')(delta)];
	    return lines;
	}
    });
    
    autorun(() => {
	let text = params.text;

	chart.select('g.legend text')
	    .selectAll('tspan')
	    .data(text)
	    .text(function(d) { return d; });

    });

    domready(function() {
	d3.select('#input-a').on('input', function() {
	    params.transition = true;
	    params.a = +this.value;
	});

	d3.select('#input-time-delta').on('input', function(e) {
	    params.transition = true;
	    params.dt = +this.value;
	});

	autorun(() => {
	    d3.select('#input-time-delta').node().value = d3.format(',.1f')(params.dt);
	});
    });

    
    autorun(() => {
	let pdata = params.finiteDiffPts;
	var g = chart.select('g.finite-diff');

	if (params.transition) {
	    g.select('path')
		.data([pdata])
		.transition()
		.duration(500)
		.attr('d', lineFunc);
	
	    g.selectAll('circle')
		.data(pdata)
	    	.transition()
		.duration(500)
		.attr('cx', function(d) { return x(d.time) })
		.attr('cy', function(d) { return y(d.value) });
	} else {
	    g.select('path')
		.data([pdata])
		.attr('d', lineFunc);
	
	    g.selectAll('circle')
		.data(pdata)
		.attr('cx', function(d) { return x(d.time) })
		.attr('cy', function(d) { return y(d.value) });
	}
    });

    autorun(() => {
	chart.select('g.derivative').selectAll('circle')
	    .data([ params ])
	    .attr('cx', function(d) { return x(d.time); })
	    .attr('cy', function(d) { return y(d.value); });
    });

    let x = scales.x,
	y = scales.y;

    var lineFunc = d3.line()
	.x(function(d) {
	    return x(d.time);
	})
	.y(function(d) {
	    return y(d.value);
	});

    // Add the finite difference line and circles
    var fdiffg = chart.append('g')
	.attr('class', 'finite-diff');

    fdiffg.append('path')
	.attr('class', 'line line-finite-diff')
	.data([params.finiteDiffPts])
	.attr('d', lineFunc);

    fdiffg.selectAll('circle')
	.data(params.finiteDiffPts)
	.enter().append('circle')
	.attr('class', 'circle circle-finite-diff')
	.attr('cx', function(d) { return x(d.time) })
	.attr('cy', function(d) { return y(d.value) })
	.attr('r', 5);

    // Add the derivative dot
    var derivg = chart.append('g')
	.attr('class', 'derivative');

    /*
    derivg.selectAll('circle')
	.data([ddata(params)])
	.enter().append('circle')
	.attr('class', 'circle circle-derivative')
	.attr('cx', function(d) { return x(d.time) })
	.attr('cy', function(d) { return y(d.value) })
	.attr('r', 5);
    */
    
    // Add the text output
    var legend = chart.append('g')
	.attr('class', 'legend')
	.attr('transform', 'translate(' + 10 + ',' + 80 + ')');

    let text = params.text;

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
    

    var g = chart.select('g.finite-diff');
	
	/*g.select('path')
	    .data([pdata])
	    .attr('d', lineFunc);*/
	
    g.selectAll('circle')
	.data(params.finiteDiffPts).enter()
	.append('circle')
	.attr('cx', function(d) { return x(d.time) })
	.attr('cy', function(d) { return y(d.value) })
	.attr('r', 5);

    let x0 = null
    let drag = d3.drag()
	.on('start', function(d) {
	    console.log('drag start', this, d);
	    //xdragstart = x.invert(d3.event.x);
	    d3.select(this).classed('active', true);
	    params.transition = false;
	})
	.on('drag', function(d) {
	    params.a = x.invert(d3.event.x);
	})
	.on('end', function(d) {
	    d3.select(this).classed('active', false);
	});

    chart.selectAll('circle.circle-derivative, g.finite-diff')
	.call(drag);
    
    // behavior when dragging the finite difference circle or path
    let draggedidx = null;
    let hdrag = d3.drag()
	.on('start', function(d) {
	    draggedidx = params.finiteDiffPts.map((d) => d.time).indexOf(d.time);
	    params.transition = false;
	})
	.on('drag', function(d) {
	    let data = params.finiteDiffPts;
	    data[draggedidx].time = x.invert(d3.event.x);
	    params.dt = Math.abs(data[1].time - data[0].time);
	    params.a = (data[1].time + data[0].time)/2;
	})
	.on('end', function(e) {
	});
    
    fdiffg.selectAll('g.finite-diff circle')
	.call(hdrag);
}
