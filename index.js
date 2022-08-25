const corsHeaders = {
	'Access-Control-Allow-Origin': '*',
	'Access-Control-Allow-Methods': 'GET,HEAD,POST,OPTIONS',
	'Access-Control-Max-Age': '86400',
	'Access-Control-Allow-Headers': '*'
};

addEventListener('fetch', event => {
  	event.respondWith(handleRequest(event.request))
})
async function handleRequest(request) {
    if(request.method == 'OPTIONS'){
		// CORS Stuff
		return new Response('Ok', {
			headers: { 
				...corsHeaders,
				'content-type': 'text/plain',
			},
		})
	}else{
		// The basic idea here is to determine the color distribution of the input image
		const pixMap = new Map();
		const targetPixMap = new Map();

		// Data is provided in ImageData.data format
		// NTS: request.body is a ReadableStream which isn't a ReadableStream...
		// NTS: This isn't something we did, it's a Cloudflare behavior.
		// NTS: Yes, Cloudflare is using Non-Standard Behaviors
		var data = new Uint8Array(await request.arrayBuffer())
		
		// Create map of color dist
		for (let i = 0; i < data.length; i += 4) {
			addToMap(data[i],  data[i+1], data[i+2], data[i+3])
		}

		// Create array of color dist
		var pixDist = [];
		pixMap.forEach((value, key)=>{
			pixDist.push({
				name: key,
				count: value
			})
		})

		// Sort desc
		pixDist.sort((a, b)=>{
			if(a.count > b.count){
				return -1;
			}else if(a.count < b.count){
				return 1;
			}else{
				return 0;
			}
		})

		// Determine what output color we should use for each color in the image
		var hslMap = createHSLMap(pixDist.length)
		pixDist.forEach((value, index)=>{
			let {h, s, l} = hslMap[index];
			let rgbVal = hslToRgb(h, s, l);
			rgbVal.push(255)
			targetPixMap.set(value.name, rgbVal)
		})
	
		// Create an output image with this output/target map in ImageData.data format
		for (let i = 0; i < data.length; i += 4) {
			let target = targetPixMap.get(`${data[i]} ${data[i+1]} ${data[i+2]} ${data[i+3]}`)
			data[i] = target[0];
			data[i+1] = target[1];
			data[i+2] = target[2];
			data[i+3] = target[3];
		}

		return new Response(data, {
			headers: { 
				...corsHeaders,
				'content-type': 'application/x-binary'
			},
		})

		function hslToRgb(h, s, l){
			var r, g, b;
		
			if(s == 0){
				r = g = b = l; // achromatic
			}else{
				var hue2rgb = function hue2rgb(p, q, t){
					if(t < 0) t += 1;
					if(t > 1) t -= 1;
					if(t < 1/6) return p + (q - p) * 6 * t;
					if(t < 1/2) return q;
					if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
					return p;
				}
		
				var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
				var p = 2 * l - q;
				r = hue2rgb(p, q, h + 1/3);
				g = hue2rgb(p, q, h);
				b = hue2rgb(p, q, h - 1/3);
			}
		
			return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
		}
		
		function createHSLMap(numUniqueValues){
			var map = [];
			if(numUniqueValues > 130){
				// We need satuation also
				// Figure out how deep we need to go
				var perHue = Math.ceil(numUniqueValues / 130);
				if(perHue > 50){
					// We need luminance as well, figure out how many lumiance values there are
					var perSatuation = Math.ceil(perHue / 50);
					let lums = calculateRangePoints(25, 50, perSatuation)
					for (let hue = 130; hue >= 0; hue--) {
						for (let sat = 100; sat >= 0; sat--) {
							lums.forEach((lum)=>{
								map.push({
									h: Math.round(hue) / 360,
									s: sat/100,
									l: lum/100
								})
							})
						}
					}
				}else{
					// Generate hue and saturation map
					let saturations = calculateRangePoints(50, 100, perHue)
					for (let hue = 130; hue >= 0; hue--) {
						saturations.forEach((sat)=>{
							map.push({
								h: Math.round(hue) / 360,
								s: sat/100,
								l: 0.5
							})
						})
					}
				}
			}else{
				// Just generate a hue map
				let hues = calculateRangePoints(0, 130, numUniqueValues)
				hues.forEach((hue)=>{
					map.push({
						h: Math.round(hue) / 360,
						s: 1.0,
						l: 0.5
					})
				})
			}
			return map;
		
		}
		
		function calculateRangePoints(start, end, numPoints){
			var points = [];
			let spacing = (end - start) / (numPoints - 1);
			for (let i = start; i < end; i += spacing) {
				points.push(i);
			}
			points.push(end);
			return points.reverse();
		}
		
		function addToMap(r, g, b, a){
			let key = `${r} ${g} ${b} ${a}`
			if(pixMap.has(key)){
				pixMap.set(key, pixMap.get(key) + 1);
			}else{
				pixMap.set(key, 1)
			}
		}
	}
}
