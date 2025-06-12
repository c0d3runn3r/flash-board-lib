const assert = require('node:assert');
const Segment = require('../lib/Segment.js');
const Asset = require('../lib/Asset.js');
const Element = require('../lib/Element.js');

describe('Segment', () => {
	let boardMock;
	class Board { element_factory(_,params) { return new Element(params); } }
	
	beforeEach(() => {
		boardMock = new Board();
	});
	
	describe('constructor', () => {
		it('should create segment with default properties', () => {
			const segment = new Segment({}, boardMock);
			assert.strictEqual(segment.name, 'Segment');
			assert.deepStrictEqual(segment.assets, []);
			assert.deepStrictEqual(segment.elements, []);
		});
		
		it('should create segment with custom name and elements', () => {
			const config = {
				name: 'TestSegment',
				elements: [{ class: 'Element', static: true }]
			};
			const segment = new Segment(config, boardMock);
			assert.strictEqual(segment.name, 'TestSegment');
			assert.strictEqual(segment.elements.length, 1);
			assert.ok(segment.elements[0] instanceof Element);
			assert.strictEqual(segment.elements[0].static, true);
		});
		
		
	});
	
	describe('find_by_id', () => {
		it('should find asset by ID', () => {
			const segment = new Segment({}, boardMock);
			const asset = new Asset({ id: 'test_id' });
			segment.add_asset(asset);
			const found = segment.find_asset('test_id');
			assert.strictEqual(found, asset);
		});
		
		it('should return null for non-existent ID', () => {
			const segment = new Segment({}, boardMock);
			const found = segment.find_asset('non_existent');
			assert.strictEqual(found, null);
		});
		
		it('should throw error for invalid ID', () => {
			const segment = new Segment({}, boardMock);
			assert.throws(() => {
				segment.find_asset('');
			}, /Asset ID must be a non-empty string/);
		});
	});
	
	describe('add_asset', () => {
		it('should add asset successfully', () => {
			const segment = new Segment({}, boardMock);
			const asset = new Asset({ id: 'test_id' });
			const result = segment.add_asset(asset);
			assert.strictEqual(result, true);
			assert.deepStrictEqual(segment.assets, [asset]);
		});
		
		it('should throw error for non-Asset instance', () => {
			const segment = new Segment({}, boardMock);
			assert.throws(() => {
				segment.add_asset({});
			}, /Only instances of Asset can be added/);
		});
		
		it('should throw error for duplicate asset ID', () => {
			const segment = new Segment({}, boardMock);
			const asset = new Asset({ id: 'test_id' });
			segment.add_asset(asset);
			assert.throws(() => {
				segment.add_asset(new Asset({ id: 'test_id' }));
			}, /Asset with ID test_id already exists/);
		});
		
		it('should add asset and pair with element based on assets_to_elements', () => {
			const segment = new Segment({
				assets_to_elements: { TestAsset: Element }
			}, boardMock);
			const TestAsset = class TestAsset extends Asset {};
			const asset = new TestAsset({ id: 'test_id' });
			const result = segment.add_asset(asset);
			assert.strictEqual(result, true);
			assert.strictEqual(segment.assets.length, 1);
			assert.strictEqual(segment.elements.length, 1);
			assert.strictEqual(segment.elements[0].asset, asset);
		});
	});
	
	describe('remove_asset', () => {
		it('should remove asset successfully', () => {
			const segment = new Segment({}, boardMock);
			const asset = new Asset({ id: 'test_id' });
			segment.add_asset(asset);
			const result = segment.remove_asset('test_id');
			assert.strictEqual(result, true);
			assert.deepStrictEqual(segment.assets, []);
		});
		
		it('should return false for non-existent asset', () => {
			const segment = new Segment({}, boardMock);
			const result = segment.remove_asset('non_existent');
			assert.strictEqual(result, false);
		});
		
		it('should throw error for invalid ID', () => {
			const segment = new Segment({}, boardMock);
			assert.throws(() => {
				segment.remove_asset('');
			}, /Asset ID must be a non-empty string/);
		});
		
		it('should unpair asset from element and prune non-static elements', () => {
			const segment = new Segment({
				assets_to_elements: { TestAsset: Element }
			}, boardMock);
			const TestAsset = class TestAsset extends Asset {};
			const asset = new TestAsset({ id: 'test_id' });
			segment.add_asset(asset);
			assert.strictEqual(segment.elements.length, 1);
			const result = segment.remove_asset('test_id');
			assert.strictEqual(result, true);
			assert.deepStrictEqual(segment.assets, []);
			assert.deepStrictEqual(segment.elements, [null]); // Non-static element pruned
		});
	});
	
	describe('render', () => {
		it('should render in text format correctly', () => {
			const segment = new Segment({ name: 'TestSegment', elements:[ {class: "Element", static: true}] }, boardMock);
			const expected = `Segment: TestSegment\nElement 0: Element{static for=/.+/ asset=none}\n`;
			assert.strictEqual(segment.render('text'), expected);
		});
		
		it('should render in object format correctly', () => {
			const segment = new Segment({ name: 'TestSegment', elements:[ {class: "Element", static: true}] }, boardMock);
			const asset1 = new Asset({ id: 'test_id1' });
			const asset2 = new Asset({ id: 'test_id2' });
			segment.add_asset(asset1);
			segment.add_asset(asset2);
			const result = segment.render('object');
			assert.deepStrictEqual(result, {
				"name": "TestSegment",
				"elements": [
					{
					"type": "Element",
					"static": true,
					"asset_type": "Asset",
					"summary": "Element{static for=Asset asset=Asset{id=test_id1}}",
					"asset": "Asset{id=test_id1}"
					},
					{
					"type": "Element",
					"static": false,
					"asset_type": "Asset",
					"summary": "Element{for=Asset asset=Asset{id=test_id2}}",
					"asset": "Asset{id=test_id2}"
					}
				]
			});

		});
		
		it('should throw error for unknown format', () => {
			const segment = new Segment({}, boardMock);
			assert.throws(() => {
				segment.render('unknown_format');
			}, {
				name: 'Error',
				message: "Unknown format 'unknown_format' for rendering segment."
			});
		});
	});


	describe('events', () => {

		it('should emit "change" event when an element is added', (done) => {
			const segment = new Segment({}, boardMock);
			segment.on('change', (event) => {
				assert.strictEqual(event.segment, segment);
				assert.strictEqual(event.element, segment.elements[0]);
				assert.strictEqual(event.summary, segment.elements[0].summary);
				assert.strictEqual(event.index, 0);
				done();
			});
			const asset = new Asset({ id: 'test_id' }); // Adding an asset will create an element
			segment.add_asset(asset);
		});

		it('should emit "change" event when an element is removed', (done) => {
			const segment = new Segment({}, boardMock);
			const asset = new Asset({ id: 'test_id' });
			segment.add_asset(asset);
			const related_element = segment.elements[0];
			segment.once('change', (event) => {
				// First change event is from when the asset is removed
				assert.strictEqual(event.segment, segment);
				assert.strictEqual(event.element, related_element);
				assert.strictEqual(event.index, 0);

				segment.once('change', (event) => {

					// Second change event is from when the element is pruned
					assert.strictEqual(event.segment, segment);
					assert.strictEqual(event.element, null);
					assert.strictEqual(event.summary, '');
					assert.strictEqual(event.index, 0);
					done();
				});

			});
			segment.remove_asset('test_id');	// Remove the asset, which should prune the non-static element and trigger a change event
		});

		it('should emit "change" event when an element is modified', (done) => {
			const config = {
				name: 'TestSegment',
				elements: [{ class: 'Element', static: true }]
			};			
			const segment = new Segment(config, boardMock);
			const asset = new Asset({ id: 'test_id' });
			segment.add_asset(asset);
			segment.on('change', (event) => {
				assert.strictEqual(event.segment, segment);
				assert.strictEqual(event.element, segment.elements[0]);
				assert.strictEqual(event.summary, segment.elements[0].summary);
				assert.strictEqual(event.index, 0);
				done();
			});
			segment.remove_asset('test_id'); // This will unpair the asset and trigger a change event (element is static so it remains)

		});

	});

	describe('checksum',() => {

		it('should return a nonzero checksum of a segment with assets', () => {
			const segment = new Segment({ name: 'TestSegment' }, boardMock);
			const asset1 = new Asset({ id: 'test_id1' });
			const asset2 = new Asset({ id: 'test_id2' });
			segment.add_asset(asset1);
			segment.add_asset(asset2);
			const checksum = segment.checksum;
			assert.notStrictEqual(checksum, 0);
		});

		it('checksum should change when assets are added or removed', () => {
			const segment = new Segment({ name: 'TestSegment' }, boardMock);
			const asset1 = new Asset({ id: 'test_id1' });
			const asset2 = new Asset({ id: 'test_id2' });
			segment.add_asset(asset1);
			const initialChecksum = segment.checksum;
			segment.add_asset(asset2);
			assert.notStrictEqual(segment.checksum, initialChecksum);
			segment.remove_asset('test_id1');
			assert.notStrictEqual(segment.checksum, initialChecksum);
		});

		it('should not return the same checksum initially vs after adding and then removing all assets', () => {

			const segment = new Segment({ name: 'TestSegment' }, boardMock);
			const initialChecksum = segment.checksum;

			const asset1 = new Asset({ id: 'test_id1' });
			const asset2 = new Asset({ id: 'test_id2' });
			segment.add_asset(asset1);
			segment.add_asset(asset2);
			segment.remove_asset('test_id1');
			segment.remove_asset('test_id2');

			const secondChecksum = segment.checksum;
			assert.notStrictEqual(initialChecksum, secondChecksum); // Since the elements will be [null, null] instead of []
		});

	});
	
});