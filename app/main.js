let d3 = require('d3'),
    domready = require('domready'),
    mobx = require('mobx'),
    //katex = require('katex'),
    finite_difference = require('./finite_difference.js'),
    trapz_method = require('./trapz_method.js'),
    integral_demo = require('./integral_demo.js');

var t = -5*Math.PI,
    dt = 0.01,
    data = d3.range(-3*Math.PI, 3*Math.PI, dt).map((t) => ({ time: t, value: func(t) }));

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

var valueLine = d3.line()
    .x((d) => x(d.time))
    .y((d) => y(d.value));
	
var margin = {top: 20, right: 20, bottom: 30, left: 50},
    width = 960 - margin.left - margin.right,
    height = 500 - margin.top - margin.bottom;

let x = d3.scaleLinear().range([0, width]);
let y = d3.scaleLinear().range([height,0]);

x.domain(d3.extent(data, function(d) { return d.time }));
y.domain(d3.extent(data, function(d) { return d.value }));

let yAxis = d3.axisLeft(y);
let xAxis = d3.axisBottom(x);

domready(function() {    
    let charts = ['#derivative_chart', '#integral_chart', '#finite_diff_chart', '#trapz_chart'].reduce(function(charts, domid) {
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
	    .datum(data)
	    .attr('d', valueLine);

	charts[domid] = chart;
	return charts;
    }, []);

    /*
    d3.select('.katex').each(function(d) {
	let string = this.textContent;
	this.textContent = "";
	katex.render(string, this, { throwOnError: false });
    });
    */
    integral_demo(charts['#integral_chart'], func, ifunc, { x, y });
    finite_difference(charts['#finite_diff_chart'], func, dfunc, { x, y });
    trapz_method(charts['#trapz_chart'], func, ifunc, { x, y });
});

