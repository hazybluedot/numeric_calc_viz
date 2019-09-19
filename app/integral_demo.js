let d3 = require("d3"),
    domready = require("domready");

import { observable, computed, autorun} from "mobx";

module.exports = function(chart, func, ifunc, scales) {
    let x = scales.x,
	y = scales.y,
	params = observable({ a: -2,
			      b: 2,
			      get data() {
				  return [ this.a, this.b ].map((d) => [{ time: d, value: 0 },
									{time: d, value: func(d)}])
			      },
			      get adata() {
				  return d3.range(this.a, this.b+.05, .05).map((d) => ({ time: d, value: func(d) }));
			      }
			    });
    let line = d3.line()
	.x((d) => x(d.time))
	.y((d) => y(d.value));

    let area = d3.area()
	.x((d) => x(d.time))
	.y0(y(0))
	.y1((d) => y(d.value));

    chart.selectAll('.area-integral')
	.data([params.adata])
	.enter().append('path')
	.attr('class', 'area area-integral')
	.attr('d', area);    

    chart.selectAll('.line-interval')
	.data(params.data)
	.enter().append('path')
	.attr('class', 'line-interval')
	.attr('d', line);

    chart.selectAll('.area-integral')
	.call(d3.drag()
	      .on('drag', (d) => {
		  let dx = x.invert(d3.event.x + d3.event.dx) - x.invert(d3.event.x);
		  params.a += dx;
		  params.b += dx;
	      }));

    chart.selectAll('.line-interval')
	.call(d3.drag()
	      .on('drag', (d, idx) => {
		  let limits = x.domain(),
		      newx = x.invert(d3.event.x),
		      oncanvas = newx > limits[0] && newx < limits[1];

		  if (!oncanvas) return;
		  
		  let dx = x.invert(d3.event.x + d3.event.dx) - x.invert(d3.event.x),
		      which = (idx == 0) ? 'a' : 'b';

	
		  let newval = params[which] + dx;
		  if (newval > limits[0] && newval < limits[1]) {
		      params[which] += dx;
		  }
	      }));

    autorun(() => {
	let data = params.adata;

	chart.selectAll('path.area')
	    .data([params.adata])
	    .attr('d', area);

	chart.selectAll('path.line-interval')
	    .data(params.data)
	    .attr('d', line);
    });

};
