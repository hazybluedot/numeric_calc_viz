import { fromEvent, merge, never } from "rxjs";

module.exports = function(selection, event) {
    var obs = never();
    selection.each(function() {
	console.log('creating event for this', this);
	var events = fromEvent(this, event);
	console.log('obs', obs);
	obs = merge(obs, events);
    });
    return obs;
};    
