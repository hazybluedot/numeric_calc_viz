let d3 = require("d3");

import { observable, autorun} from "mobx";

module.exports = function(chart, func, ifunc, scales) {
    let x = scales.x,
	y = scales.y;

    var lineFunc = d3.line()
	.x(function(d) {
	    return x(d.time);
	})
	.y(function(d) {
	    return y(d.value);
	});

    let params = observable({
	interval: [-2, 2],
	div: 6,

	get trapsData() {
	    let interval = this.interval,
		div = this.div;
	    
	    let inc = (interval[1] - interval[0])/div;
	    return d3.range(div).map(function(d) {
		let t1 = interval[0] + d*inc,
		    t2 = interval[0] + (d+1)*inc;
		return [{ idx: d + 'a', time: t1, value: func(t1) },
			{ idx: d + 'b', time: t2, value: func(t2) }];

	    });
	},

	get sum() {
	    let sum = this.trapsData.reduce(function(acc, trap) {
		let h = trap[1].time - trap[0].time,
		    b1 = trap[1].value,
		    b2 = trap[0].value;
		acc += h * ((b1 + b2) / 2);
		return acc;
	    }, 0);
	    return sum;
	},
	    
	get intervalData() {
	    return this.interval.map(function(d) {
		return [{ time: d, value: 0 }, {time: d, value: func(d)}];
	    });
	},

	get text() {
	    let result = ifunc(this.interval[1]) - ifunc(this.interval[0]);
	    return [
		'∫f dx = ' + d3.format(',.2f')(result),
		'∑ fdx = ' + d3.format(',.2f')(this.sum)
	    ];
	}
    });

    // area drag handler
    let drag_translate = d3.drag()
	.on('drag', function(d) {
	    let dx = x.invert(d3.event.x + d3.event.dx) - x.invert(d3.event.x);

	    let _interval = params.interval.map(function(d) { return d + dx; });
	    if (_interval[0] > x.domain()[0] && _interval[1] < x.domain()[1]) {
		params.interval = _interval;
	    }
	});

    // interval line drag handler
    let draggedidx = null;
    let drag = d3.drag()
	.on('start', function(e) {
	    d3.select(this).classed('active', true);
	    draggedidx = params.interval.indexOf(e[0].time);
	})
	.on('drag', function(e) {
	    let newx = x.invert(d3.event.x);
	    let _interval = params.interval.map((d) => d);
	    _interval[draggedidx] = newx;

	    if (_interval[0] > x.domain()[0] && _interval[1] < x.domain()[1]) {
		params.interval = _interval;
	    }
	})
	.on('end', function(e) {
	    d3.select(this).classed('active', false);
	});

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

    enterTraps(params.trapsData);
    
    let area = d3.area()
	.x(function(d) { return x(d.time); })
	.y0(y(0))
	.y1(function(d) { return y(d.value); });

    d3.select('#slider-ntraps').on('input', function() {
	params.div = +this.value;
    });

    // Add text labels
    var disp = chart.append('g')
	.attr('class', 'disp')
	.attr('transform', 'translate(' + 10 + ',' + 100 + ')');

    disp.append('text')
	.attr('id', 'text-trapz')
	.selectAll('tspan')
	.data(params.text).enter()
	.append('tspan')
	.attr('x', 0)
	.attr('dy', (d, i) => {
	    if (i > 0) {
		return 20;
	    }
	    return null;
	})
	.text((d) => d);
                    
    chart.selectAll('.interval')
	.data(params.intervalData)
	.enter().append('path')
	.attr('class', 'line line-interval')
	.attr('d', lineFunc);
        
    chart.selectAll('.line-interval')
	.call(drag);
    
    chart.selectAll('.area-trapz')
	.call(drag_translate);
    
    autorun(() => {
	let data = params.intervalData;
	chart.selectAll('path.line-interval')
	    .data(data)
	    .attr('d', lineFunc);
    });

    autorun(() => {
	d3.select('#slider-ntraps').node().value = +params.div;
	d3.select('.value-ntraps').text(+params.div);
    });


    autorun(() => {
	let data = params.trapsData;
	
	updateTraps(data);
	enterTraps(data);
	exitTraps(data);	

	d3.select('#text-trapz').selectAll('tspan')
	    .data(params.text)
	    .text((d) => d);
    });
    
    chart.select('.line').raise();
    chart.select('.axis').raise();
}
