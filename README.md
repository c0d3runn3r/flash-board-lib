# flash-board-lib
Operational clarity

## Installation
Tests use native NodeJS testing, which seemed to be buggy in earlier versions (18.x etc).   Make sure you have a modern NodeJS


## What is a flash board?

A Flash Board is a hierarchical to simplify and summarize complex situations.  We call the real-world things we are managing Assets.   Assets are not shown directly; for each asset, one opinonated view called an Element is created.  We say that the Element 'pairs' with the Asset. Thus what you see is not data directly but rather a processed, opinionated view of data.  Elements are grouped logically or geograpically into Segments.  Segments are an opinionated summary of Elements.  One or more segments makes a Board.
<br>
**Asset** → **Element** → **Segment** → **Board**
<br>
As an example, suppose you have a set of shipping assets.  These assets could be represented by elements that care about whether that shipment is on time or not.  Grouped into Segments by hemisphere, you might be able to quickly observe that "the Eastern hemisphere is condition green, over 95% on schedule".

> **A note on the flash board concept:** Imagine a graph that has informational value (data x importance product) on the vertical axis, and time required for a human to visually absorb this data on the horizontal axis.  Assuming equal areas under the curve, a flash board shifts the information hump to the left.  Put another way, the most important thing to know should also be the most obvious.  This is most easily done by painting a picture of an operation, then painting it by status.  The question "how are we doing?" is always answered first with one of these colors:<br><br>
Green - Everything is at it's nominal state<br>
Yellow - Problems exist but are being handled<br>
Red - Unhandled problems exist

## Board internals

`Board`, `Segment`, `Element`, and `Asset` are all classes.  Since an Element is an opinionated view, it must be subclassed to have any particular usefulness.  All Assets are owned by their Segment, and segments are owned by the Board.  It is the Segment's job to decide whether it needs to create an Element or not.  This is done by passing an Asset → Element map to the Segment's constructor.

> **Board is a singleton** I struggled with whether or not to allow multiple Boards, since various departments may want disparate views on the same data; but since all that data would need to be held in common somewhere at the top level (e.g. a BoardManager or something), that would mean Boards would become rather simple groupings of Segments.  I think I can achieve that aim in some other way if it comes up (e.g. creating a view on a board) without the extra complexity in creating a BoardManager.  

**Workflow**

A Board is instantiated and given `board.conf`.  The board will then create all Segments and each segment will construct any static Elements (elements defined in the configuration that exist whether or not they have assets). 

Once you are up and running, those elements come to life (and additional Elements are dynamically added and removed as needed) when you call `board.add_asset()`.  Think of the Board, the Segments, and some static Elements as a garden, and Assets are the water.  Adding an asset (`board.add_asset()`) results in the following internal process:

1. Segments are iterated by the board in order until one is found that accepts the asset.  This is accomplished by calling `.add_asset()` on all segments until one returns `true` (a segment decides whether or not to accept an asset by evaluating the filters that were read from the config and passed to it at constriuction time).  A base Segment class will by default accept all assets.  You segment assets into groups by subclassing Segment.
2. If no segment is willing to accept the asset, an error is thrown since this is an anti-pattern
3. It is now the duty of the accepting Segment to figure out which Element(s) will represent this asset.
	a. All static elements within the segment are iterated and `.pair()` is called on each one.  A return value of `true` means that the element is not currently paired and will now pair with the asset - the search is over; false means that the element is rejecting the asset and the segment must keep searching.  
	b. If all static elements return `false`, a new element is instantiated from the board `.element_factory` (which is configurable by providing an Asset -> Element mapping in the config).  The Board accepts custom classes in it's constructor, so it should be able to construct anything you will need as long as you have remembered to pass enough constructors;  by default, the factory will return a base `Element`.  Before returning the Element, the Board will test it to make sure it will accept the desired Asset.

Removal is simpler, since it is just a process of calling `.remove_asset()` on the containing segment, which in turn calls `.unpair()` on the associated elements; the element is then pruned (unless it is `.static`). 

**Element rendering**
As was stated earlier, Elements are opinionated views.  Elements express their view by overriding `.render(format)` and returning a render in the format requested.  Any format that is unsupported should `return super(format)` so the base class can return a default rendering.

In order that we may use renders intelligently, a caching system is in place that relies on another override: `.summary()`.  An element summary is a string that uniquely identifies the state of a render.  For example, suppose you are rendering a car with a state for each door position (open or closed).  You might choose to return a `summary` of `cccc` if the doors were all closed, or `oocc` if the front ones are open.  The exact schema is up to you; what matters is that two identical summary strings always produce the same render.  If something happens that makes you think your render may have changed (for example, your car asset fires a `door_position_change` event) you will need to call `this.dirty()`.  This will cause the base Element to check `.summary`; if it has changed, a `summary_changed` event will be fired.

Making a custom Element therefore requires four things:
1. Subclass Element, passing a custom asset class matcher to the base class constructor, e.g. `super({ asset_class_matcher: /car/i })`
2. Override .render() to produce at least one render type (probably `text` and `svg` at a minimum)
3. Override `get .summary()` to return a consistent code representing render states for caching
4. Listen to any important events in your asset (you can attach/detach asset event listeners when the Element emits `pair` and `unpair` events) and call `.dirty()` if you think your render might have changed


## TO-DO
- [x] Make an Asset class that supports events on arbitrary watched properties
- [x] Make a test for the Asset class
- [x] Make a basic Board class that is prepared to manage a library of Assets
- [x] Create a Segment class
- [x] Create a GeoSegment class
- [x] Board class accepts a config in the constructor and internally instantiates all Segments
- [x] Add a base Element class
- [x] Make Bots into Assets
- [x] Remove BotManager, replace it with a Board that manages those Bots
- [x] Add a derived Element class, and figure out some way for this library of classes to be read by the Board and passed to the Segments
- [x] Segment should instantiate any static Elements on construction
- [x] Segment should create elements as assets are added, using a map and the process described in these docs
- [x] Update documentation about `element.summary` and caching
- [ ] Update elements so they can render text representation of themselves
- [ ] Update segments so they can render json including element indices, name and summary
- [ ] Update elements so they emit an 'changed' event when their summary changes
- [ ] Update segments so they watch their elements and update 'changed' events no more than 1 per 5s, the event to include the indices and summaries for change elements
- [ ] Enhance Board with a router that exposes segments, showing an array of segments and a JSON render of those segments
- [ ] Make a webapp that displays all segments, using text representations of the elements
- [ ] Update server to serve webapp
- [ ] Finish Bot element graphics
- [ ] Update element with ability to render e.g. svg type 
- [ ] Update webapp with svg renders of elements
- [ ] Add websockets to server for updates
- [ ] Add websockets to client for updates
