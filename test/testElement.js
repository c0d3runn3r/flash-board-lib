const assert = require('node:assert');
const Element = require('../lib/Element.js');
const Asset = require('../lib/Asset.js');

describe('Element', () => {
	describe('constructor', () => {
		it('should create element with default properties', () => {
			const element = new Element();
			assert.strictEqual(element.static, false);
			assert.deepStrictEqual(element.asset_class_matcher, /.+/);
			assert.strictEqual(element.asset, null);
		});
		
		it('should create element with custom properties', () => {
			const config = {
				static: true,
				asset_class_matcher: /^TestAsset$/
			};
			const element = new Element(config);
			assert.strictEqual(element.static, true);
			assert.deepStrictEqual(element.asset_class_matcher, /^TestAsset$/);
			assert.strictEqual(element.asset, null);
		});
	});
	
	
	describe('.toString()', () => {
		it('should return correct string representation', () => {
			const element = new Element({ asset_class_matcher: 'TestAsset', static: true });
			assert.strictEqual(String(element), 'Element{static for=TestAsset asset=none}');
		});
	});
	
	describe('.pair()', () => {
		
		it('should successfully pair with any asset by default', () => {
			const element = new Element();
			const asset = new (class TestAsset extends Asset {})({ id: 'test_id' });
			const result = element.pair(asset);
			assert.strictEqual(result, true);
			assert.strictEqual(element.asset, asset);
		});
		
		it('should successfully pair with matching asset', () => {
			const element = new Element({ asset_class_matcher: /^TestAsset$/ });
			const asset = new (class TestAsset extends Asset {})({ id: 'test_id' });
			const result = element.pair(asset);
			assert.strictEqual(result, true);
			assert.strictEqual(element.asset, asset);
		});
		
		it('should fail to pair with non-matching asset', () => {
			const element = new Element({ asset_class_matcher: /^TestAsset$/ });
			const asset = new (class OtherAsset extends Asset {})({ id: 'test_id' });
			const result = element.pair(asset);
			assert.strictEqual(result, false);
			assert.strictEqual(element.asset, null);
		});
		
		it('should fail to pair when already paired', () => {
			const element = new Element({ asset_class_matcher: /.+/ });
			const asset_1 = new (class TestAsset extends Asset {})({ id: 'test_id_1' });
			const asset_2 = new (class TestAsset extends Asset {})({ id: 'test_id_2' });
			element.pair(asset_1);
			const result = element.pair(asset_2);
			assert.strictEqual(result, false);
			assert.strictEqual(element.asset, asset_1);
		});
		
		it('should emit paired event when pairing successfully', (done) => {
			const element = new Element({ asset_class_matcher: /^TestAsset$/ });
			const asset = new (class TestAsset extends Asset {})({ id: 'test_id' });
			element.on('paired', (elem, pairedAsset) => {
				assert.strictEqual(elem, element);
				assert.strictEqual(pairedAsset, asset);
				done();
			});
			element.pair(asset);
		});
		
	});
	
	describe('unpair', () => {
		it('should unpair a paired asset', () => {
			const element = new Element();
			const asset = new (class TestAsset extends Asset {})({ id: 'test_id' });
			element.pair(asset);
			assert.strictEqual(element.asset, asset);
			element.unpair(); 
			assert.strictEqual(element.asset, null);
		});
		
		it('should throw an error when trying to unpair without a paired asset', () => {
			const element = new Element();
			assert.throws(() => {
				element.unpair();
			}, {
				name: 'Error',
				message: "No asset to unpair." 
			});
		});
		
		// Add this test inside the describe('unpair') block
		it('should emit unpaired event when unpairing successfully', (done) => {
			const element = new Element();
			const asset = new (class TestAsset extends Asset {})({ id: 'test_id' });
			element.pair(asset);
			element.on('unpaired', (elem, unpairedAsset) => {
				assert.strictEqual(elem, element);
				assert.strictEqual(unpairedAsset, asset);
				assert.strictEqual(element.asset, null);
				done();
			});
			element.unpair();
		});  
	});
	
	describe('render', () => {
		
		it('default text renderer', () => {
			const element = new Element({ asset_class_matcher: 'TestAsset' });
			assert.strictEqual(element.render(), 'Element{for=TestAsset asset=none}');
			
			const asset = new (class TestAsset extends Asset {})({ id: 'test_id' });
			element.pair(asset);
			assert.strictEqual(element.render(), 'Element{for=TestAsset asset=TestAsset{id=test_id}}');
			
			
		});

		it('object renderer', () => {
			const element = new Element({ asset_class_matcher: 'TestAsset', static: true });
			const asset = new (class TestAsset extends Asset {})({ id: 'test_id' });
			
			// Test without asset
			assert.deepStrictEqual(element.render('object'), {
				type: 'Element',
				static: true,
				condition: 'green',
				asset_type: 'TestAsset',
				summary: 'Element{static for=TestAsset asset=none}',
				asset: ''
			});
			
			// Test with asset
			element.pair(asset);
			assert.deepStrictEqual(element.render('object'), {
				type: 'Element',
				static: true,
				condition: 'green',
				asset_type: 'TestAsset',
				summary: 'Element{static for=TestAsset asset=TestAsset{id=test_id}}',
				asset: 'TestAsset{id=test_id}'
			});
		});		

		it('should throw an error for unknown format', () => {
			const element = new Element();
			assert.throws(() => {
				element.render('unknown_format');
			}, {
				name: 'Error',
				message: "Unknown format 'unknown_format' for rendering element."
			});
		});
	});
	
	describe('summary and change events', () => {
		it('summary should change when an asset is added', () => {
			const element = new Element({ asset_class_matcher: /^TestAsset$/ });
			const initialSummary = element.summary;
			const asset = new (class TestAsset extends Asset {})({ id: 'test_id' });
			element.pair(asset);
			assert.notStrictEqual(element.summary, initialSummary);
		});
		
		it('pair should emit change event', (done) => {
			const element = new Element({ asset_class_matcher: /^TestAsset$/ });
			const asset = new (class TestAsset extends Asset {})({ id: 'test_id' });
			element.on('change', (elem) => {
				assert.strictEqual(elem, element);
				done();
			});
			element.pair(asset);
		});
		
		it('unpair should emit change event', (done) => {
			const element = new Element({ asset_class_matcher: /^TestAsset$/ });
			const asset = new (class TestAsset extends Asset {})({ id: 'test_id' });
			element.pair(asset);
			element.on('change', (elem) => {
				assert.strictEqual(elem, element);
				done();
			});
			element.unpair();
		});
	});
	
});