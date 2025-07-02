const assert = require('assert');
const Board = require('../lib/Board');
const Asset = require('../lib/Asset');
const Segment = require('../lib/Segment');
const GeoSegment = require('../lib/GeoSegment');
const Element = require('../lib/Element');
const fs = require('fs');
const path = require('path');

describe('Board', () => {

	describe('Element factory', () => {
		let board, segment, asset;
		class CustomElement extends Element {}
		class CustomAsset extends Asset {}
		
		beforeEach(() => {
			board = new Board({ asset_to_element:[{ "asset": "CustomAsset", "element": "CustomElement"}]}, { CustomElement, CustomAsset });
			segment = new Segment({ name: 'Test Segment' }, board);
			board._add_segment(segment); // Calls private method to add segment
			asset = new Asset({ id: 'test-asset', name: 'Test Asset' });
		});
		
		it('should create an object with string target', () => {

			const element = board.element_factory('CustomElement', { id: 'test-element', asset_class_matcher: 'CustomAsset' });
			assert.ok(element instanceof CustomElement, 'CustomElement instance created');
		});
		
		it('should create an Element for an Asset', () => {
			const element = board.element_factory(asset, { id: 'test-element' });
			assert.ok(element instanceof Element, 'Element instance created for asset');
			assert.ok(element.pair(asset, true), 'Element can pair with provided asset');
		});
		
		it('should use asset-to-element mapping from config', () => {
			const config = {
				asset_to_element: [{ asset: 'Asset', element: 'Element' }]
			};
			const customBoard = new Board(config);
			const element = customBoard.element_factory(asset, { id: 'test-element' });
			assert.ok(element instanceof Element, 'Element instance created using mapping');
			assert.ok(element.pair(asset, true), 'Element can pair with asset');
		});

		it('should throw an error if a non-array is passed for asset_to_element', () => {
			const invalidConfig = {
				asset_to_element: 'not-an-array'
			};
			assert.throws(() => {
				new Board(invalidConfig);
			}
			, /Asset to element mapping must be an array of objects with 'asset' and 'element' properties as strings/, 'Invalid asset_to_element config throws error');
		});
		
		it('should throw error for invalid class name', () => {
			assert.throws(() => {
				board.element_factory('NonExistentClass');
			}, /Unable to find class 'NonExistentClass'/, 'Invalid class name throws error');
		});
		
		it('should throw error for invalid target type', () => {
			assert.throws(() => {
				board.element_factory(123);
			}, /Target must be an Asset instance or a string representing the element class name/, 'Invalid target type throws error');
		});
		
		it('should throw error if element cannot pair with asset', () => {
			// Mock a custom Element class that rejects pairing
			class CustomElement extends Element {
				pair(asset, testMode) {
					return false;
				}
			}
			const config = {
				asset_to_element: [{ asset: 'Asset', element: 'CustomElement' }]
			};
			const customBoard = new Board(config, { CustomElement });
			assert.throws(() => {
				customBoard.element_factory(asset);
			}, /Element class 'CustomElement' is not configured to accept asset of type 'Asset'/, 'Non-pairing element throws error');
		});
	});
	
	describe('Asset-to-element mapping', () => {
		it('should correctly process valid asset-to-element mappings', () => {
			const config = {
				asset_to_element: [
					{ asset: 'Asset', element: 'Element' },
					{ asset: 'CustomAsset', element: 'CustomElement' }
				]
			};
			const board = new Board(config);
			const asset = new Asset({ id: 'test-asset', name: 'Test Asset' });
			const element = board.element_factory(asset);
			assert.ok(element instanceof Element, 'Element created using mapping');
			assert.ok(element.pair(asset, true), 'Element can pair with asset');
		});
		
		it('should throw error for invalid asset-to-element mappings', () => {
			const invalidConfig = {
				asset_to_element: [
					{ asset: 123, element: 'Element' }, // Invalid asset type
					{ asset: 'Asset', element: 456 }   // Invalid element type
				]
			};
			assert.throws(() => {
				new Board(invalidConfig);
			}, /Asset to element mapping must be an array of objects with 'asset' and 'element' properties as strings/, 'Invalid mapping throws error');
		});
		
		it('should handle empty asset-to-element mappings', () => {
			const config = {
				asset_to_element: []
			};
			const board = new Board(config);
			const asset = new Asset({ id: 'test-asset', name: 'Test Asset' });
			const element = board.element_factory(asset);
			assert.ok(element instanceof Element, 'Default Element created with empty mapping');
			assert.ok(element.pair(asset, true), 'Element can pair with asset');
		});
	});
	
	describe('Asset management', () => {
		let board;
		
		beforeEach(() => {
			board = new Board();
			segment = new Segment({ name: 'Test Segment' }, board);
			board._add_segment(segment); // Calls private method to add segment
		});
		
		describe('add_asset', () => {
			it('should add a valid asset to the board', () => {
				const asset = new Asset({ id: 'test-asset', name: 'Test Asset' });
				board.add_asset(asset);
				assert.strictEqual(board.segments[0].assets.length, 1, 'Asset added to board');
				assert.strictEqual(board.segments[0].assets[0], asset, 'Correct asset added');
			});
			
			it('should throw error for non-Asset instances', () => {
				assert.throws(() => {
					board.add_asset({ id: 'invalid' });
				}, /Only instances of Asset can be added/, 'Non-Asset instance throws error');
			});
			
			it('should throw error for asset with invalid ID', () => {
				assert.throws(() => {
					board.add_asset(new Asset({ id: '' }));
				}, /Asset ID must be a non-empty string/, 'Empty ID throws error');
				
				assert.throws(() => {
					board.add_asset(new Asset({ id: null }));
				}, /Asset ID must be a non-empty string/, 'Null ID throws error');
			});
			
			it('should throw error for duplicate asset ID', () => {
				const asset1 = new Asset({ id: 'test-asset', name: 'Asset 1' });
				board.add_asset(asset1);
				const asset2 = new Asset({ id: 'test-asset', name: 'Asset 2' });
				assert.throws(() => {
					board.add_asset(asset2);
				}, /Asset with ID test-asset already exists/, 'Duplicate ID throws error');
			});
		});
		
		describe('find_asset', () => {
			
			it('should find an asset by ID', () => {
				const asset = new Asset({ id: 'test-asset', name: 'Test Asset' });
				board.add_asset(asset);
				const found = board.find_asset('test-asset');
				assert.deepStrictEqual(found, [segment, asset], 'Asset found by ID');
			});
			
			it('should return null for non-existent ID', () => {
				const found = board.find_asset('non-existent');
				assert.strictEqual(found, null, 'Non-existent ID returns null');
			});
			
			it('should throw error for invalid ID', () => {
				assert.throws(() => {
					board.find_asset('');
				}, /Asset ID must be a non-empty string/, 'Empty ID throws error');
				
				assert.throws(() => {
					board.find_asset(null);
				}, /Asset ID must be a non-empty string/, 'Null ID throws error');
			});
		});
		
		describe('remove_asset', () => {
			it('should remove an asset by ID', () => {
				const asset = new Asset({ id: 'test-asset', name: 'Test Asset' });
				board.add_asset(asset);
				const removed = board.remove_asset('test-asset');
				assert.strictEqual(removed, true, 'Asset removed successfully');
				assert.strictEqual(board.segments[0].assets.length, 0, 'Asset list is empty');
				assert.strictEqual(board.find_asset('test-asset'), null, 'Asset no longer exists');
			});
			
			it('should return false for non-existent ID', () => {
				const removed = board.remove_asset('non-existent');
				assert.strictEqual(removed, false, 'Non-existent ID returns false');
				assert.strictEqual(board.segments[0].assets.length, 0, 'Asset list remains empty');
			});
			
			it('should throw error for invalid ID', () => {
				assert.throws(() => {
					board.remove_asset('');
				}, /Asset ID must be a non-empty string/, 'Empty ID throws error');
				
				assert.throws(() => {
					board.remove_asset(null);
				}, /Asset ID must be a non-empty string/, 'Null ID throws error');
			});
		});
		
		
	});
	
	describe('Use of board.conf', () => {
		
		let config, board;
		beforeEach(() => {
			
			// Read and parse the board.conf file
			const configPath = path.join(__dirname, 'data', 'board.conf');
			const configContent = fs.readFileSync(configPath, 'utf8');
			config = JSON.parse(configContent);
			
			// Create a new Board instance with the config
			board = new Board(config);
		});
		
		it('test config should create a board with one GeoSegment and one Segment from board.conf', () => {
			
			// Verify the board name
			assert.strictEqual(board.name, 'Dax Command', 'Board name should match config');
			
			// Verify the number of segments
			assert.strictEqual(board.segments.length, 2, 'Board should have two segments');
			
			// Verify the segments
			const geoSegment = board.segments.find(s => s instanceof GeoSegment);
			const segment = board.segments.find(s => s instanceof Segment && !(s instanceof GeoSegment));
			
			assert.ok(geoSegment, 'Board should have one GeoSegment');
			assert.strictEqual(geoSegment.name, 'Philomath HQ', 'GeoSegment name should match config');
			
			assert.ok(segment, 'Board should have one Segment');
			assert.strictEqual(segment.name, 'Corvallis HQ', 'Segment name should match config');
		});
	});

	describe('events', () => {

		let board;
		beforeEach(() => {

			// Create a board with two segments, each with two elements
			board = new Board({
				name: 'Test Board',
				min_event_seconds: 0.1,
				segments: [
					{ class: 'Segment', name: 'Segment 1', elements: [{ class: 'Element' }, { class: 'Element' }] },
					{ class: 'Segment', name: 'Segment 2', elements: [{ class: 'Element' }, { class: 'Element' }] }
				]
			});
			
		});

		it('should emit a change event when an asset is added', (done) => {
			board.on('change', (event) => {

				assert.ok(event, 'Change event should be emitted');
				assert.ok(event.board instanceof Board, 'Event should contain the board instance');
				assert.ok(event.changes.length > 0, 'Event should have changes');
				assert.ok(event.changes[0].segment instanceof Segment, 'Change should be for a Segment');
				assert.ok(event.changes[0].element instanceof Element, 'Change should be for an Element');
				assert.strictEqual(event.changes[0].element_index, 0, 'Element index should be 0 for first element');
				assert.strictEqual(event.changes[0].segment_index, 0, 'Segment index should be 0 for first segment');
				done();
			});
			
			const asset = new Asset({ id: 'test-asset', name: 'Test Asset' });
			board.segments[0].add_asset(asset);
		});	

		it('should only emit one change event for multiple changes within a period < min_event_seconds', (done) => {
			let changeCount = 0;
			board.on('change', (event) => {
				changeCount++;
			});

			setTimeout(()=>{

				assert.strictEqual(changeCount, 1, 'Should emit only one change event for multiple changes within the same second');
				done();	
			}, 101);
			
			const asset1 = new Asset({ id: 'test-asset-1', name: 'Test Asset 1' });
			const asset2 = new Asset({ id: 'test-asset-2', name: 'Test Asset 2' });
			const asset3 = new Asset({ id: 'test-asset-3', name: 'Test Asset 3' });

			board.segments[0].add_asset(asset1);
			board.segments[0].add_asset(asset2);
			board.segments[0].add_asset(asset3);
		}
		);

	});
	
	
});