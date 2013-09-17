require.config({
	paths: {
		jquery: 'lib/jquery-1.10.2.min',
		underscore: 'lib/underscore-min'
	},
	shim: {
		underscore: {
			exports: '_'
		}
	},
	packages: [
		{
			name: 'larch',
			main: 'larch',
			location: 'larch'
		}
	]
});

require(['jquery', 'underscore', 'larch', 'larch/validation'], function($, _, larch, validation) {
	$(function() {
		console.dir(larch);
		console.dir(validation);
	});
});