# Entropy Mapping Cloudflare Worker

Written in vanilla Javascript, this Cloudflare worker script takes an input in [ImageData](https://developer.mozilla.org/en-US/docs/Web/API/ImageData).data format and provides an entropy mapped output in ImageData.data format.

The entropy map is defined by a chroma, saturation, luminance shift from bright vibrant green to dark dull red. This entropy map is color-probabilistic, such that the map output describes the probability of selecting a pixel of the chosen color at random from all pixels in the input image.  

Where bright vibrant green pixels represent the original image pixels with a high relative likelyhood (by color), thus low selection entropy, and dark dull red pixels represent the original image pixels with the lowest relative likelyhood.

Project created for an example on my website at [howdytaylor.com](https://howdytaylor.com)

This project was kickstarted with a Cloudflare worker template.

## How To Use

Note: Requires a Cloudflare workers account. This script exceeds the 10ms CPU time allowed on the free workers account, so a paid workers account will be needed.

Clone the project

Run the following commands in the root of the project directory.

```
npm install -g wrangler
```

```
npm install
```

To start the
```
wrangler dev
```

Further documentation for Wrangler can be found [here](https://developers.cloudflare.com/workers/tooling/wrangler).

## Some Caveats

Some images are incompatible with this mapping method, transparency seems to cause issues particularly when the input image is large.

