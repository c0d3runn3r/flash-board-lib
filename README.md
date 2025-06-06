# flash-board-lib
Operational clarity

**Overview**

A Flash Board is a smart, easy way to summarize complex real world situations.  Behind the scenes it is controlled by data in the form of Assets.  Assets are not shown directly; for each asset, one or more opinonated views called Elements are created.  Thus what you see is not data directly but rather a processed, opinionated view of data.  Elements are grouped logically or geograpically into Segments.  This allows the state of an Element to influence the state of a Segment and in turn the Board.

As an example, suppose you have a set of shipping assets.  These assets could be represented by elements that care about whether that shipment is on time or not.  Grouped into sets by hemisphere, you might be able to quickly observe that "the Eastern hemisphere is condition green, over 95% on schedule".

> Imagine a graph that has informational value (data * importance product) on the vertical axis, and time required for a human to visually absorb this data on the horizontal axis.  Assuming equal areas under the curve, a flash board shifts the information hump to the left.  Put another way, a flash board shows the status of an entire operation in one glance. It does this by having knowledge of both current and desired state, allowing it to group and summarize, and then conveying this information by color. The question "how are we doing?" is always answered first with one of these colors:<br><br>
Green - Everything is at it's nominal state<br>
Yellow - Problems exist but are being handled<br>
Red - Unhandled problems exist

**Board internals**

`Board` and `Segment` are universal classes.  Since an Element is an opinionated view, it must be subclassed to have any particular usefulness.  An asset can only relate to one segment at once; but it can be represented by any number of elements within that segment.  All Assets are owned by their Segment, and segments are owned by the Board.

Note that Board is a singleton. I struggled with whether or not to allow multiple Boards, since various departments may want disparate views on the same data; but since all that data would need to be held in common somewhere at the top level (e.g. a BoardManager or something), that would mean Boards would become rather simple groupings of Segments.  I think I can achieve that aim in some other way if it comes up (e.g. creating a view on a board) without the extra complexity in creating a BoardManager.  

**Setting up a Board**

A Board is instantiated and given `board.conf`.  The board will then create all Segments and each segment will construct any static Elements (elements defined in the configuration that exist whether or not they have assets). 

Once you are up and running, those elements come to life (and additional Elements are dynamically added and removed as needed) when you call `.add_asset()`.  Think of the Board, the Segments, and some static Elements as a garden, and data assets are the water.  Adding an asset results in the following:

1. Segments are iterated in order until one is found that accepts the asset.  This is accomplished by calling `.add_asset()` on all segments until one returns `true` (a segment decides whether or not to accept an asset by evaluating the filters that were read from the config and passed to it at constriuction time).
2. It is now the duty of the Segment to figure out which Element(s) will represent this asset.
	a. All static elements are iterated and `.add_asset()` is called on each one.  A return value of `true` means that the element is requesting exclusive lock on the asset, and the search is over; false means that the element is rejecting the asset and the segment must keep searching.  `null` means the element is going to use the asset in a non-excliusive way.  
	b. If all static elements return `false`, a new element is instantiated from the Asset -> Element mapping set in the config file and that element is added to the segment.  `.add_asset()` is then called on that element.  If that call returns `false` as well, something is set up wrong and an error should be thrown (or at least logged).  

Removal is simpler, since it is just a process of calling `.remove_asset()` on all segments, which in turn call `.remove_asset()` on their elements.  Segments lastly prune any non static elements with zero assets since these would be zombie elements. 

As an asset changes, it may be the case that it is no longer acceptable to an Entity or Segment.  It is the duty of Segments or Elements to watch any pertinent properies (Assets support watched parameters and will bubble events) and then `.reject()` any assets that are no longer desired.  Elements will call `.reject()` on their owning Segment, and Segments will make the same call on their Board.

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
- [ ] Segment should create elements as assets are added, using a map and the process described in these docs
- [ ] Update documentation about `element.summary` and caching
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
